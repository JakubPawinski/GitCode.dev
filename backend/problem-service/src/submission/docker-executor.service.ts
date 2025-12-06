import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import Docker from 'dockerode';
import { DOCKER_EXECUTOR_CONFIG } from '../config/docker-executor.config';

interface ExecutionResult {
  passed: boolean;
  output: string;
  expectedOutput: string;
  errorMessage?: string;
  executionTime?: number; // ms
  memoryUsed?: number; // MB
}

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
}

@Injectable()
export class DockerExecutorService {
  private readonly logger = new Logger(DockerExecutorService.name);
  private docker: Docker;
  private readonly config = DOCKER_EXECUTOR_CONFIG;
  private readonly imageMap = this.config.images;

  constructor() {
    const dockerHost = process.env.DOCKER_HOST;

    if (dockerHost) {
      this.docker = new Docker({
        host: dockerHost.replace('tcp://', '').split(':')[0],
        port: parseInt(dockerHost.split(':')[2] || '2375'),
      });
      this.logger.log(`Connected to Docker at ${dockerHost}`);
    } else {
      this.docker = new Docker();
      this.logger.log('Using local Docker socket');
    }
  }

  async executeCodeBatch(
    code: string,
    language: string,
    testCases: TestCase[],
  ): Promise<ExecutionResult[]> {
    this.logger.log(
      `Executing ${language} code for ${testCases.length} test cases...`,
    );
    // Get image by language from config
    const image = this.imageMap[language.toLowerCase()];
    if (!image) {
      throw new BadRequestException(`Language ${language} not supported`);
    }

    try {
      await this.ensureImage(image);
      return await this.runBatchInContainer(image, code, language, testCases);
    } catch (error) {
      this.logger.error(`Batch execution failed:`, error);
      return testCases.map((testCase) => ({
        passed: false,
        output: '',
        expectedOutput: testCase.expectedOutput,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }

  // PRIVATE HELPERS
  private async runBatchInContainer(
    image: string,
    code: string,
    language: string,
    testCases: TestCase[],
  ): Promise<ExecutionResult[]> {
    const { cmd, filename } = this.getLanguageConfig(language);
    const functionName = this.extractFunctionName(code, language);

    const testCasesJson = testCases.map((tc) => ({
      id: tc.id,
      input: typeof tc.input === 'string' ? JSON.parse(tc.input) : tc.input,
      expectedOutput:
        typeof tc.expectedOutput === 'string'
          ? JSON.parse(tc.expectedOutput)
          : tc.expectedOutput,
    }));

    const runners: Record<string, string> = {
      python: this.config.runners.python.replace(
        /\$\{FUNCTION_NAME\}/g,
        functionName,
      ),
      javascript: this.config.runners.javascript.replace(
        /\$\{FUNCTION_NAME\}/g,
        functionName,
      ),
    };

    const runnerContent = runners[language.toLowerCase()] || runners['python'];
    const runnerFilename =
      language.toLowerCase() === 'python' ? 'runner.py' : 'runner.js';

    const container = await this.docker.createContainer({
      Image: image,
      Cmd: cmd,
      WorkingDir: '/app',
      HostConfig: {
        Memory: this.config.resources.memory,
        MemorySwap: this.config.resources.memorySwap,
        CpuPeriod: this.config.cpu.period,
        CpuQuota: this.config.cpu.quota,
        NetworkMode: 'none',
        Ulimits: this.config.ulimits,
        SecurityOpt: ['no-new-privileges'],
      },
      AttachStdout: true,
      AttachStderr: true,
    });

    try {
      // Get ready archive to put on container
      const tar = require('tar-stream');
      const pack = tar.pack();

      pack.entry({ name: filename }, code);
      pack.entry({ name: runnerFilename }, runnerContent);
      pack.entry({ name: 'test_cases.json' }, JSON.stringify(testCasesJson));

      pack.finalize();

      await container.putArchive(pack, { path: '/app' });

      const startTime = Date.now();
      await container.start();

      const output = await Promise.race([
        this.getContainerOutput(container),
        this.timeout(this.config.executionTimeout),
      ]);

      const executionTime = Date.now() - startTime;

      this.logger.log(
        `Container output: ${output.substring(0, 200)}... (${executionTime}ms)`,
      );

      const results = this.parseResults(output, testCases);

      // add execution time for every test
      return results.map((result) => ({
        ...result,
        executionTime,
      }));
    } catch (error) {
      this.logger.error(`Container execution error:`, error);
      throw error;
    } finally {
      try {
        await container.stop({ t: 1 });
      } catch (e) {
        // Ignore
      }
      try {
        await container.remove();
      } catch (e) {
        // Ignore
      }
    }
  }

  private extractFunctionName(code: string, language: string): string {
    language = language.toLowerCase();

    if (language === 'python' || language === 'python3') {
      const classMethodMatch = code.match(
        /class\s+\w+[\s\S]*?def\s+(\w+)\s*\(/,
      );
      if (classMethodMatch) return classMethodMatch[1];
      const methodMatch = code.match(/def\s+(\w+)\s*\(/);
      return methodMatch ? methodMatch[1] : 'solution';
    }

    if (language === 'javascript' || language === 'typescript') {
      const varMatch = code.match(/var\s+(\w+)\s*=\s*function/);
      if (varMatch) return varMatch[1];
      const funcMatch = code.match(/function\s+(\w+)\s*\(/);
      if (funcMatch) return funcMatch[1];
      const constMatch = code.match(/const\s+(\w+)\s*=/);
      if (constMatch) return constMatch[1];
      return 'solution';
    }

    if (language === 'java') {
      const methodMatch = code.match(/public\s+\w+\s+(\w+)\s*\(/);
      return methodMatch ? methodMatch[1] : 'solution';
    }

    return 'solution';
  }

  private parseResults(
    output: string,
    testCases: TestCase[],
  ): ExecutionResult[] {
    try {
      let cleanOutput = output
        .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F\x80-\xFF]/g, '')
        .trim();

      const jsonStart = cleanOutput.indexOf('[');
      if (jsonStart === -1) {
        throw new Error('No JSON array found in output');
      }
      cleanOutput = cleanOutput.substring(jsonStart);

      const jsonEnd = cleanOutput.lastIndexOf(']');
      if (jsonEnd === -1) {
        throw new Error('No closing bracket found in output');
      }
      cleanOutput = cleanOutput.substring(0, jsonEnd + 1);

      this.logger.log(`Cleaned output: ${cleanOutput.substring(0, 500)}...`);

      const parsedResults = JSON.parse(cleanOutput);

      const firstFailed = parsedResults.find((r: any) => !r.passed);
      if (firstFailed) {
        this.logger.warn(
          `First failed test: ${JSON.stringify(firstFailed, null, 2)}`,
        );
      }

      return parsedResults.map((result: any) => ({
        passed: result.passed,
        output: result.output,
        expectedOutput: result.expectedOutput,
        errorMessage: result.error,
      }));
    } catch (error) {
      this.logger.error(`Failed to parse results:`, error);
      this.logger.error(`Raw output was:`, output.substring(0, 500));
      return testCases.map((tc) => ({
        passed: false,
        output: '',
        expectedOutput: tc.expectedOutput,
        errorMessage: `Parse error: ${error instanceof Error ? error.message : 'Unknown'}`,
      }));
    }
  }

  private getLanguageConfig(language: string): {
    cmd: string[];
    filename: string;
  } {
    const configs: Record<string, { cmd: string[]; filename: string }> = {
      python: {
        cmd: ['python', '/app/runner.py'],
        filename: 'solution.py',
      },
      javascript: {
        cmd: ['node', '/app/runner.js'],
        filename: 'solution.js',
      },
      typescript: {
        cmd: [
          'sh',
          '-c',
          'npm install -g typescript && tsc /app/solution.ts --outFile /app/solution.js && node /app/runner.js',
        ],
        filename: 'solution.ts',
      },
      java: {
        cmd: ['sh', '-c', 'javac /app/Solution.java && java -cp /app Solution'],
        filename: 'Solution.java',
      },
    };

    return configs[language.toLowerCase()] || configs['python'];
  }

  private async ensureImage(imageName: string): Promise<void> {
    try {
      const image = this.docker.getImage(imageName);
      await image.inspect();
      this.logger.log(`Image ${imageName} already exists`);
    } catch (error) {
      this.logger.log(`Pulling image ${imageName}...`);
      await new Promise<void>((resolve, reject) => {
        this.docker.pull(imageName, (err: Error | null, stream: any) => {
          if (err) reject(err);
          this.docker.modem.followProgress(stream, (err: Error | null) => {
            if (err) reject(err);
            else resolve();
          });
        });
      });
    }
  }

  private async getContainerOutput(
    container: Docker.Container,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      container.logs(
        {
          follow: true,
          stdout: true,
          stderr: true,
        },
        (err: Error | null, stream: any) => {
          if (err) {
            reject(err);
            return;
          }

          let output = '';
          const stdout = new (require('stream').PassThrough)();
          const stderr = new (require('stream').PassThrough)();

          container.modem.demuxStream(stream, stdout, stderr);

          stdout.on('data', (chunk: Buffer) => {
            output += chunk.toString('utf8');
          });

          stderr.on('data', (chunk: Buffer) => {
            output += chunk.toString('utf8');
          });

          stream.on('end', () => {
            resolve(output);
          });

          stream.on('error', reject);
        },
      );
    });
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Execution timeout')), ms),
    );
  }
}
