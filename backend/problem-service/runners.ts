export const PYTHON_RUNNER = `import json
import sys

sys.path.insert(0, '/app')
from solution import *

def normalize_output(value):
    """Treat empty collections as None for comparison"""
    if value == [] or value == '' or value == {}:
        return None
    # Parsuj stringowe reprezentacje None/null
    if isinstance(value, str) and value.lower() in ('none', 'null'):
        return None
    return value

with open('/app/test_cases.json', 'r') as f:
    test_cases = json.load(f)

results = []
for test_case in test_cases:
    try:
        input_data = test_case['input']
        
        if isinstance(input_data, dict):
            args = list(input_data.values())
        elif isinstance(input_data, list):
            args = input_data
        else:
            args = [input_data]
        
        output = \${FUNCTION_NAME}(*args)
        expected = test_case['expectedOutput']
        
        # Normalization
        passed = normalize_output(output) == normalize_output(expected)
        
        results.append({
            'testId': test_case['id'],
            'passed': passed,
            'output': json.dumps(output) if output is not None else 'null',
            'expectedOutput': json.dumps(expected) if expected is not None else 'null',
            'error': None
        })
    except Exception as e:
        import traceback
        results.append({
            'testId': test_case['id'],
            'passed': False,
            'output': '',
            'expectedOutput': json.dumps(test_case['expectedOutput']),
            'error': traceback.format_exc()
        })

print(json.dumps(results))
`;

export const JAVASCRIPT_RUNNER = `const fs = require('fs');
const testCases = JSON.parse(fs.readFileSync('/app/test_cases.json', 'utf8'));

const solutionCode = fs.readFileSync('/app/solution.js', 'utf8');
eval(solutionCode);

let solution = typeof \${FUNCTION_NAME} !== 'undefined' ? \${FUNCTION_NAME} : null;

if (!solution || typeof solution !== 'function') {
  console.log(JSON.stringify(testCases.map(tc => ({
    testId: tc.id,
    passed: false,
    output: '',
    expectedOutput: JSON.stringify(tc.expectedOutput),
    error: 'Function \${FUNCTION_NAME} not found or not a function'
  }))));
  process.exit(0);
}

function normalizeOutput(value) {
  if (value === null || value === undefined || 
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'object' && Object.keys(value).length === 0) ||
      value === '') {
    return null;
  }

  if (typeof value === 'string' && (value.toLowerCase() === 'none' || value.toLowerCase() === 'null')) {
    return null;
  }
  return value;
}

const results = [];
for (const testCase of testCases) {
  try {
    const inputData = testCase.input;
    
    let args = [];
    if (typeof inputData === 'object' && !Array.isArray(inputData)) {
      args = Object.values(inputData);
    } else if (Array.isArray(inputData)) {
      args = inputData;
    } else {
      args = [inputData];
    }
    
    const output = solution(...args);
    const expected = testCase.expectedOutput;
    
    // Normalization
    const passed = JSON.stringify(normalizeOutput(output)) === JSON.stringify(normalizeOutput(expected));

    results.push({
      testId: testCase.id,
      passed,
      output: output !== null && output !== undefined ? JSON.stringify(output) : 'null',
      expectedOutput: expected !== null && expected !== undefined ? JSON.stringify(expected) : 'null',
      error: null
    });
  } catch (e) {
    results.push({
      testId: testCase.id,
      passed: false,
      output: '',
      expectedOutput: JSON.stringify(testCase.expectedOutput),
      error: e.message
    });
  }
}

console.log(JSON.stringify(results));
`;
