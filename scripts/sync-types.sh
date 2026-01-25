#!/bin/bash

# Path settings
OUTPUT_DIR="apps/ai-service/ai_service/models"
OUTPUT_FILE="$OUTPUT_DIR/generated.py"

mkdir -p $OUTPUT_DIR

echo "🔄 1. Generating temporary TSConfig..."

# Create a dedicated configuration file to avoid conflicts with project settings
cat > tsconfig.temp.json <<EOF
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "emitDeclarationOnly": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "baseUrl": "."
  },
  "include": [
    "packages/types/src/**/*.ts"
  ]
}
EOF

echo "🔄 2. Generating JSON Schema from TypeScript..."

# Use the temporary config
npx typescript-json-schema \
  "tsconfig.temp.json" "*" \
  --required \
  --noExtraProps \
  --out temp_schema.json || {
    echo "❌ Error generating JSON Schema."
    rm tsconfig.temp.json
    exit 1
  }

# Check if file was created
if [ ! -f temp_schema.json ]; then
  echo "❌ Failed to generate schema.json"
  rm tsconfig.temp.json
  exit 1
fi

echo "🐍 3. Converting JSON Schema to Pydantic (Python)..."

# Use poetry run to execute command in Python environment
# Assuming execution from root, pointing to service directory
cd apps/ai-service && poetry run python -m datamodel_code_generator \
  --input ../../temp_schema.json \
  --input-file-type jsonschema \
  --output app/models/generated.py \
  --output-model-type pydantic_v2.BaseModel \
  --target-python-version 3.12 \
  --use-schema-description \
  --field-constraints \
  --use-annotated \
  --format ruff-format \
  --disable-timestamp && cd ../..

echo "🧹 4. Cleaning up..."
rm -f temp_schema.json
rm -f tsconfig.temp.json

echo "✅ Done! Models saved to $OUTPUT_FILE"