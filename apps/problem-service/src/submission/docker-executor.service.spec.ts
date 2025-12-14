import { Test, TestingModule } from '@nestjs/testing';
import { DockerExecutorService } from './docker-executor.service';
import { BadRequestException } from '@nestjs/common';

jest.mock('dockerode', () => {
  return jest.fn().mockImplementation(() => ({
    getImage: jest.fn(),
    createContainer: jest.fn(),
    pull: jest.fn((imageName: string, callback: Function) => {
      callback(null, { on: jest.fn() });
    }),
    modem: {
      demuxStream: jest.fn(),
      followProgress: jest.fn(),
    },
  }));
});

jest.mock('tar-stream');
jest.mock('../config/docker-executor.config', () => ({
  DOCKER_EXECUTOR_CONFIG: {
    images: {
      python: 'python:3.9',
      javascript: 'node:16',
      typescript: 'node:16',
      java: 'openjdk:11',
    },
    runners: {
      python:
        'import json\nwith open("test_cases.json") as f: test_cases = json.load(f)\nresults = []\nfor tc in test_cases:\n    try:\n        result = ${FUNCTION_NAME}(**tc["input"])\n        results.append({"passed": result == tc["expectedOutput"], "output": str(result), "expectedOutput": str(tc["expectedOutput"]), "error": None})\n    except Exception as e:\n        results.append({"passed": False, "output": "", "expectedOutput": str(tc["expectedOutput"]), "error": str(e)})\nprint(json.dumps(results))',
      javascript:
        'const fs = require("fs");\nconst testCases = JSON.parse(fs.readFileSync("test_cases.json", "utf8"));\nconst results = [];\nfor (const tc of testCases) {\n  try {\n    const result = ${FUNCTION_NAME}(...Object.values(tc.input));\n    results.push({ passed: JSON.stringify(result) === JSON.stringify(tc.expectedOutput), output: JSON.stringify(result), expectedOutput: JSON.stringify(tc.expectedOutput), error: null });\n  } catch (e) {\n    results.push({ passed: false, output: "", expectedOutput: JSON.stringify(tc.expectedOutput), error: e.message });\n  }\n}\nconsole.log(JSON.stringify(results));',
    },
    resources: {
      memory: 256 * 1024 * 1024,
      memorySwap: 256 * 1024 * 1024,
    },
    cpu: {
      period: 100000,
      quota: 50000,
    },
    ulimits: [],
    executionTimeout: 5000,
  },
}));

describe('DockerExecutorService', () => {
  let service: DockerExecutorService;

  const mockTestCases = [
    {
      id: 'tc-1',
      input: '{"nums": [2, 7, 11, 15], "target": 9}',
      expectedOutput: '[0, 1]',
    },
    {
      id: 'tc-2',
      input: '{"nums": [3, 2, 4], "target": 6}',
      expectedOutput: '[1, 2]',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DockerExecutorService],
    }).compile();

    service = module.get<DockerExecutorService>(DockerExecutorService);
    jest.spyOn(service['logger'], 'error').mockImplementation();
    jest.spyOn(service['logger'], 'warn').mockImplementation();
    jest.spyOn(service['logger'], 'log').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('executeCodeBatch', () => {
    it('should throw BadRequestException for unsupported language', async () => {
      const code = 'code';
      const language = 'cobol';

      await expect(
        service.executeCodeBatch(code, language, mockTestCases),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.executeCodeBatch(code, language, mockTestCases),
      ).rejects.toThrow('Language cobol not supported');
    });

    it('should return error results when ensureImage fails', async () => {
      const code = 'def solution(): pass';

      jest.spyOn(service['docker'], 'getImage').mockReturnValue({
        inspect: jest
          .fn()
          .mockRejectedValue(new Error('Docker connection failed')),
      } as any);

      (
        jest.spyOn(service['docker'] as any, 'pull') as any
      ).mockImplementationOnce((imageName: string, callback: Function) => {
        callback(new Error('Pull failed'));
      });

      const results = await service.executeCodeBatch(
        code,
        'python',
        mockTestCases,
      );

      expect(results).toHaveLength(mockTestCases.length);
      results.forEach((result) => {
        expect(result.passed).toBe(false);
        expect(result.output).toBe('');
        expect(result.errorMessage).toBeDefined();
      });
    });

    it('should catch errors during batch execution and return error results', async () => {
      const code = 'def solution(): pass';

      jest.spyOn(service['docker'], 'getImage').mockReturnValue({
        inspect: jest.fn().mockResolvedValue({}),
      } as any);

      jest
        .spyOn(service['docker'], 'createContainer')
        .mockRejectedValue(new Error('Container creation failed'));

      const results = await service.executeCodeBatch(
        code,
        'python',
        mockTestCases,
      );

      expect(results).toHaveLength(mockTestCases.length);
      results.forEach((result) => {
        expect(result.passed).toBe(false);
        expect(result.errorMessage).toContain('Container creation failed');
      });
    });
  });

  describe('extractFunctionName', () => {
    it('should extract Python function name', () => {
      const code = 'def twoSum(nums, target):\n    return [0, 1]';
      const name = service['extractFunctionName'](code, 'python');
      expect(name).toBe('twoSum');
    });

    it('should extract Python class method name', () => {
      const code =
        'class Solution:\n    def twoSum(self, nums, target):\n        return [0, 1]';
      const name = service['extractFunctionName'](code, 'python');
      expect(name).toBe('twoSum');
    });

    it('should extract Python class method with multiple lines before', () => {
      const code =
        'class Solution:\n    def helper(self):\n        pass\n    def twoSum(self, nums, target):\n        return [0, 1]';
      const name = service['extractFunctionName'](code, 'python');
      expect(name).toBe('helper');
    });

    it('should extract JavaScript var function name', () => {
      const code = 'var twoSum = function(nums, target) { return [0, 1]; }';
      const name = service['extractFunctionName'](code, 'javascript');
      expect(name).toBe('twoSum');
    });

    it('should extract JavaScript function declaration name', () => {
      const code = 'function twoSum(nums, target) { return [0, 1]; }';
      const name = service['extractFunctionName'](code, 'javascript');
      expect(name).toBe('twoSum');
    });

    it('should extract JavaScript const arrow function name', () => {
      const code = 'const twoSum = (nums, target) => { return [0, 1]; };';
      const name = service['extractFunctionName'](code, 'javascript');
      expect(name).toBe('twoSum');
    });

    it('should return default function name when not found', () => {
      const code = 'some random code';
      const name = service['extractFunctionName'](code, 'python');
      expect(name).toBe('solution');
    });

    it('should extract Java method name', () => {
      const code = 'public int twoSum(int[] nums, int target) { return 0; }';
      const name = service['extractFunctionName'](code, 'java');
      expect(name).toBe('twoSum');
    });

    it('should return default for Java array return types not matching regex', () => {
      const code =
        'public int[] twoSum(int[] nums, int target) { return new int[]{0, 1}; }';
      const name = service['extractFunctionName'](code, 'java');
      expect(name).toBe('solution');
    });

    it('should extract Java method with List return type', () => {
      const code =
        'public List twoSum(int[] nums, int target) { return null; }';
      const name = service['extractFunctionName'](code, 'java');
      expect(name).toBe('twoSum');
    });

    it('should handle case-insensitive language names', () => {
      const code = 'def myFunction(x):\n    pass';
      const name1 = service['extractFunctionName'](code, 'PYTHON');
      const name2 = service['extractFunctionName'](code, 'Python');
      expect(name1).toBe('myFunction');
      expect(name2).toBe('myFunction');
    });
  });

  describe('parseResults', () => {
    it('should parse valid JSON results', () => {
      const output = JSON.stringify([
        {
          passed: true,
          output: '[0, 1]',
          expectedOutput: '[0, 1]',
          error: null,
        },
        {
          passed: true,
          output: '[1, 2]',
          expectedOutput: '[1, 2]',
          error: null,
        },
      ]);

      const results = service['parseResults'](output, mockTestCases);

      expect(results).toHaveLength(2);
      expect(results[0].passed).toBe(true);
      expect(results[0].output).toBe('[0, 1]');
      expect(results[1].passed).toBe(true);
    });

    it('should handle output with non-printable characters', () => {
      const jsonOutput = JSON.stringify([
        {
          passed: true,
          output: '[0, 1]',
          expectedOutput: '[0, 1]',
          error: null,
        },
      ]);
      const dirtyOutput = '\x00\x01' + jsonOutput + '\x00\x01';

      const results = service['parseResults'](dirtyOutput, mockTestCases);

      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(true);
    });

    it('should handle parsing errors and return failed results', () => {
      const invalidOutput = 'This is not JSON';

      const results = service['parseResults'](invalidOutput, mockTestCases);

      expect(results).toHaveLength(mockTestCases.length);
      expect(results[0].passed).toBe(false);
      expect(results[0].errorMessage).toContain('Parse error');
    });

    it('should handle missing JSON in output', () => {
      const output = 'Some text with no JSON';

      const results = service['parseResults'](output, mockTestCases);

      expect(results).toHaveLength(mockTestCases.length);
      expect(results[0].passed).toBe(false);
      expect(results[0].errorMessage).toContain('Parse error');
    });

    it('should extract JSON from middle of output', () => {
      const jsonOutput = JSON.stringify([
        {
          passed: true,
          output: 'result',
          expectedOutput: 'result',
          error: null,
        },
      ]);
      const output = 'Some prefix text\n' + jsonOutput + '\nSome suffix text';

      const results = service['parseResults'](output, mockTestCases);

      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(true);
    });

    it('should handle errors in parsed results', () => {
      const output = JSON.stringify([
        {
          passed: false,
          output: '',
          expectedOutput: '[0, 1]',
          error: 'IndexError: list index out of range',
        },
        {
          passed: true,
          output: '[0, 1]',
          expectedOutput: '[0, 1]',
          error: null,
        },
      ]);

      const results = service['parseResults'](output, mockTestCases);

      expect(results).toHaveLength(2);
      expect(results[0].passed).toBe(false);
      expect(results[0].errorMessage).toBe(
        'IndexError: list index out of range',
      );
      expect(results[1].passed).toBe(true);
    });
  });

  describe('getLanguageConfig', () => {
    it('should return Python configuration', () => {
      const config = service['getLanguageConfig']('python');

      expect(config.cmd).toContain('python');
      expect(config.filename).toBe('solution.py');
    });

    it('should return JavaScript configuration', () => {
      const config = service['getLanguageConfig']('javascript');

      expect(config.cmd).toContain('node');
      expect(config.filename).toBe('solution.js');
    });

    it('should return TypeScript configuration', () => {
      const config = service['getLanguageConfig']('typescript');

      expect(config.cmd[0]).toBe('sh');
      expect(config.filename).toBe('solution.ts');
    });

    it('should return Java configuration', () => {
      const config = service['getLanguageConfig']('java');

      expect(config.filename).toBe('Solution.java');
    });

    it('should default to Python for unknown language', () => {
      const config = service['getLanguageConfig']('unknown');

      expect(config.cmd).toContain('python');
    });

    it('should handle case-insensitive language names', () => {
      const config1 = service['getLanguageConfig']('PYTHON');
      const config2 = service['getLanguageConfig']('JavaScript');

      expect(config1.filename).toBe('solution.py');
      expect(config2.filename).toBe('solution.js');
    });
  });

  describe('timeout', () => {
    it('should reject after specified milliseconds', async () => {
      const promise = service['timeout'](50);

      await expect(promise).rejects.toThrow('Execution timeout');
    });

    it('should take at least the specified time', async () => {
      const start = Date.now();
      try {
        await service['timeout'](100);
      } catch {}
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(100);
    });
  });

  describe('extractFunctionName edge cases', () => {
    it('should handle TypeScript as javascript for extraction', () => {
      const code = 'const solution = (x: number) => x * 2';
      const name = service['extractFunctionName'](code, 'typescript');
      expect(name).toBe('solution');
    });

    it('should handle Python3 as python for extraction', () => {
      const code = 'def calculate(x):\n    return x * 2';
      const name = service['extractFunctionName'](code, 'python3');
      expect(name).toBe('calculate');
    });

    it('should handle Java with complex return types', () => {
      const code =
        'public List<Integer> twoSum(int[] nums, int target) { return null; }';
      const name = service['extractFunctionName'](code, 'java');
      expect(name).toBe('solution');
    });

    it('should extract first method from multiple Python methods', () => {
      const code = 'def first():\n    pass\ndef second():\n    pass';
      const name = service['extractFunctionName'](code, 'python');
      expect(name).toBe('first');
    });

    it('should extract JavaScript arrow function without const', () => {
      const code = 'let myFunc = (x) => x + 1';
      const name = service['extractFunctionName'](code, 'javascript');
      expect(name).toBe('solution');
    });

    it('should handle empty code gracefully', () => {
      const name = service['extractFunctionName']('', 'python');
      expect(name).toBe('solution');
    });

    it('should handle Java protected method', () => {
      const code = 'protected int solve(int x) { return x; }';
      const name = service['extractFunctionName'](code, 'java');
      expect(name).toBe('solution');
    });

    it('should extract JavaScript function with no spaces', () => {
      const code = 'function solution(x){return x;}';
      const name = service['extractFunctionName'](code, 'javascript');
      expect(name).toBe('solution');
    });

    it('should extract Python static method', () => {
      const code =
        'class Solution:\n    @staticmethod\n    def solve(x):\n        pass';
      const name = service['extractFunctionName'](code, 'python');
      expect(name).toBe('solve');
    });
  });

  describe('parseResults edge cases', () => {
    it('should handle results with all fields populated', () => {
      const output = JSON.stringify([
        {
          passed: true,
          output: '[0, 1]',
          expectedOutput: '[0, 1]',
          error: null,
        },
      ]);

      const results = service['parseResults'](output, mockTestCases);

      expect(results[0].passed).toBe(true);
      expect(results[0].errorMessage).toBeNull();
    });

    it('should handle whitespace-only output', () => {
      const output = '   \n\n   ';

      const results = service['parseResults'](output, mockTestCases);

      expect(results).toHaveLength(mockTestCases.length);
      expect(results[0].passed).toBe(false);
    });

    it('should handle malformed JSON with brackets', () => {
      const output = '[{invalid json}]';

      const results = service['parseResults'](output, mockTestCases);

      expect(results).toHaveLength(mockTestCases.length);
      expect(results[0].errorMessage).toContain('Parse error');
    });

    it('should extract JSON with surrounding noise', () => {
      const jsonOutput = JSON.stringify([
        {
          passed: true,
          output: 'ok',
          expectedOutput: 'ok',
          error: null,
        },
      ]);
      const output = 'Starting...\nINFO\n' + jsonOutput + '\nCleaning up...';

      const results = service['parseResults'](output, mockTestCases);

      expect(results[0].passed).toBe(true);
    });

    it('should handle empty JSON array', () => {
      const output = '[]';
      const results = service['parseResults'](output, mockTestCases);

      expect(results).toHaveLength(0);
    });

    it('should handle multiple test results with mixed outcomes', () => {
      const output = JSON.stringify([
        {
          passed: true,
          output: 'correct',
          expectedOutput: 'correct',
          error: null,
        },
        {
          passed: false,
          output: 'wrong',
          expectedOutput: 'correct',
          error: null,
        },
        {
          passed: false,
          output: '',
          expectedOutput: 'correct',
          error: 'Timeout',
        },
      ]);

      const results = service['parseResults'](output, mockTestCases);

      expect(results).toHaveLength(3);
      expect(results[0].passed).toBe(true);
      expect(results[1].passed).toBe(false);
      expect(results[2].errorMessage).toBe('Timeout');
    });

    it('should handle JSON with unicode characters', () => {
      const output = JSON.stringify([
        {
          passed: true,
          output: '你好',
          expectedOutput: '你好',
          error: null,
        },
      ]);

      const results = service['parseResults'](output, mockTestCases);

      expect(results[0].passed).toBe(true);
      expect(results[0].output).toBe('你好');
    });

    it('should handle very long output with JSON embedded', () => {
      const jsonOutput = JSON.stringify([
        {
          passed: true,
          output: 'result',
          expectedOutput: 'result',
          error: null,
        },
      ]);
      const longPrefix = 'x'.repeat(10000);
      const output = longPrefix + jsonOutput;

      const results = service['parseResults'](output, mockTestCases);

      expect(results[0].passed).toBe(true);
    });

    it('should handle null error field', () => {
      const output = JSON.stringify([
        {
          passed: true,
          output: 'result',
          expectedOutput: 'result',
          error: null,
        },
      ]);

      const results = service['parseResults'](output, mockTestCases);

      expect(results[0].errorMessage).toBeNull();
    });

    it('should preserve error message from result', () => {
      const output = JSON.stringify([
        {
          passed: false,
          output: '',
          expectedOutput: 'expected',
          error: 'Custom error message',
        },
      ]);

      const results = service['parseResults'](output, mockTestCases);

      expect(results[0].errorMessage).toBe('Custom error message');
    });
  });

  describe('getLanguageConfig edge cases', () => {
    it('should be case-insensitive for all supported languages', () => {
      const languages = [
        'PYTHON',
        'PyThOn',
        'JAVASCRIPT',
        'TypeScript',
        'JAVA',
      ];
      const results = languages.map((lang) =>
        service['getLanguageConfig'](lang),
      );

      expect(results[0].filename).toBe('solution.py');
      expect(results[1].filename).toBe('solution.py');
      expect(results[2].filename).toBe('solution.js');
      expect(results[3].filename).toBe('solution.ts');
      expect(results[4].filename).toBe('Solution.java');
    });

    it('should have proper command arrays', () => {
      const pythonConfig = service['getLanguageConfig']('python');
      const jsConfig = service['getLanguageConfig']('javascript');
      const tsConfig = service['getLanguageConfig']('typescript');
      const javaConfig = service['getLanguageConfig']('java');

      expect(Array.isArray(pythonConfig.cmd)).toBe(true);
      expect(Array.isArray(jsConfig.cmd)).toBe(true);
      expect(Array.isArray(tsConfig.cmd)).toBe(true);
      expect(Array.isArray(javaConfig.cmd)).toBe(true);
    });
  });
});
