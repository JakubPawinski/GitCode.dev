import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

import prettierPlugin from 'eslint-plugin-prettier/recommended'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettierPlugin,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  {
    rules: {
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          trailingComma: 'all',
          printWidth: 100,
          tabWidth: 2,
          semi: true,
        },
      ],
    },
    plugins: {
      prettier: prettierPlugin,
    },
  },
])
export default eslintConfig
