import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InternalServiceGuard } from './internal-service.guard';
import { IncomingHttpHeaders } from 'http';

describe('InternalServiceGuard', () => {
  let guard: InternalServiceGuard;
  let configService: ConfigService;
  let executionContext: ExecutionContext;
  let mockHeaders: IncomingHttpHeaders;

  beforeEach(async () => {
    // Mock ConfigService
    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InternalServiceGuard,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    guard = module.get<InternalServiceGuard>(InternalServiceGuard);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (headers: IncomingHttpHeaders): ExecutionContext => {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          headers,
        }),
      }),
    } as unknown as ExecutionContext;
  };

  describe('canActivate', () => {
    describe('✓ Success cases', () => {
      it('should allow access with valid API key', () => {
        // Arrange
        const validApiKey = 'super-secret-key-12345';
        mockHeaders = { 'x-internal-api-key': validApiKey };
        executionContext = createMockExecutionContext(mockHeaders);
        jest.spyOn(configService, 'get').mockReturnValue(validApiKey);

        // Act
        const result = guard.canActivate(executionContext);

        // Assert
        expect(result).toBe(true);
        expect(configService.get).toHaveBeenCalledWith('INTERNAL_API_KEY');
      });

      it('should allow access with case-sensitive matching', () => {
        // Arrange
        const apiKey = 'MySecretKey123';
        mockHeaders = { 'x-internal-api-key': apiKey };
        executionContext = createMockExecutionContext(mockHeaders);
        jest.spyOn(configService, 'get').mockReturnValue(apiKey);

        // Act
        const result = guard.canActivate(executionContext);

        // Assert
        expect(result).toBe(true);
      });

      it('should allow access with special characters in API key', () => {
        // Arrange
        const apiKey = 'key!@#$%^&*()_+-=[]{}|;:,.<>?';
        mockHeaders = { 'x-internal-api-key': apiKey };
        executionContext = createMockExecutionContext(mockHeaders);
        jest.spyOn(configService, 'get').mockReturnValue(apiKey);

        // Act
        const result = guard.canActivate(executionContext);

        // Assert
        expect(result).toBe(true);
      });

      it('should allow access with UUID as API key', () => {
        // Arrange
        const apiKey = '550e8400-e29b-41d4-a716-446655440000';
        mockHeaders = { 'x-internal-api-key': apiKey };
        executionContext = createMockExecutionContext(mockHeaders);
        jest.spyOn(configService, 'get').mockReturnValue(apiKey);

        // Act
        const result = guard.canActivate(executionContext);

        // Assert
        expect(result).toBe(true);
      });
    });

    describe('✗ Failure cases - Missing header', () => {
      it('should deny access when X-Internal-Api-Key header is missing', () => {
        // Arrange
        mockHeaders = {};
        executionContext = createMockExecutionContext(mockHeaders);
        jest.spyOn(configService, 'get').mockReturnValue('valid-key-here');

        // Act & Assert
        expect(() => guard.canActivate(executionContext)).toThrow(
          UnauthorizedException,
        );
        expect(() => guard.canActivate(executionContext)).toThrow(
          'Internal API key is required',
        );
      });

      it('should deny access when X-Internal-Api-Key header is undefined', () => {
        // Arrange
        mockHeaders = { 'x-internal-api-key': undefined };
        executionContext = createMockExecutionContext(mockHeaders);
        jest.spyOn(configService, 'get').mockReturnValue('valid-key-here');

        // Act & Assert
        expect(() => guard.canActivate(executionContext)).toThrow(
          UnauthorizedException,
        );
      });

      it('should deny access when X-Internal-Api-Key header is empty string', () => {
        // Arrange
        mockHeaders = { 'x-internal-api-key': '' };
        executionContext = createMockExecutionContext(mockHeaders);
        jest.spyOn(configService, 'get').mockReturnValue('valid-key-here');

        // Act & Assert
        expect(() => guard.canActivate(executionContext)).toThrow(
          UnauthorizedException,
        );
      });
    });

    describe('✗ Failure cases - Invalid API key', () => {
      it('should deny access with incorrect API key', () => {
        // Arrange
        mockHeaders = { 'x-internal-api-key': 'wrong-key-here' };
        executionContext = createMockExecutionContext(mockHeaders);
        jest.spyOn(configService, 'get').mockReturnValue('correct-key-here');

        // Act & Assert
        expect(() => guard.canActivate(executionContext)).toThrow(
          UnauthorizedException,
        );
        expect(() => guard.canActivate(executionContext)).toThrow(
          'Invalid internal API key',
        );
      });

      it('should deny access when API key differs by one character', () => {
        // Arrange
        mockHeaders = { 'x-internal-api-key': 'super-secret-key-1234' };
        executionContext = createMockExecutionContext(mockHeaders);
        jest
          .spyOn(configService, 'get')
          .mockReturnValue('super-secret-key-12345');

        // Act & Assert
        expect(() => guard.canActivate(executionContext)).toThrow(
          UnauthorizedException,
        );
      });

      it('should deny access when API key has different case', () => {
        // Arrange
        mockHeaders = { 'x-internal-api-key': 'SECRET-KEY' };
        executionContext = createMockExecutionContext(mockHeaders);
        jest.spyOn(configService, 'get').mockReturnValue('secret-key');

        // Act & Assert
        expect(() => guard.canActivate(executionContext)).toThrow(
          UnauthorizedException,
        );
      });

      it('should deny access when API key has extra spaces', () => {
        // Arrange
        mockHeaders = { 'x-internal-api-key': ' super-secret-key ' };
        executionContext = createMockExecutionContext(mockHeaders);
        jest.spyOn(configService, 'get').mockReturnValue('super-secret-key');

        // Act & Assert
        expect(() => guard.canActivate(executionContext)).toThrow(
          UnauthorizedException,
        );
      });
    });

    describe('✗ Failure cases - Missing config', () => {
      it('should deny access when INTERNAL_API_KEY env variable is not configured', () => {
        // Arrange
        mockHeaders = { 'x-internal-api-key': 'some-key' };
        executionContext = createMockExecutionContext(mockHeaders);
        jest.spyOn(configService, 'get').mockReturnValue(undefined);

        // Act & Assert
        expect(() => guard.canActivate(executionContext)).toThrow(
          UnauthorizedException,
        );
        expect(() => guard.canActivate(executionContext)).toThrow(
          'Service authentication not configured',
        );
      });

      it('should deny access when INTERNAL_API_KEY env variable is empty string', () => {
        // Arrange
        mockHeaders = { 'x-internal-api-key': 'some-key' };
        executionContext = createMockExecutionContext(mockHeaders);
        jest.spyOn(configService, 'get').mockReturnValue('');

        // Act & Assert
        expect(() => guard.canActivate(executionContext)).toThrow(
          UnauthorizedException,
        );
      });
    });

    describe('📋 Header case insensitivity', () => {
      it('should accept x-internal-api-key (lowercase)', () => {
        // Arrange
        const apiKey = 'test-key';
        mockHeaders = { 'x-internal-api-key': apiKey };
        executionContext = createMockExecutionContext(mockHeaders);
        jest.spyOn(configService, 'get').mockReturnValue(apiKey);

        // Act
        const result = guard.canActivate(executionContext);

        // Assert
        expect(result).toBe(true);
      });

      it('should read from normalized lowercase headers', () => {
        // Arrange
        const apiKey = 'test-key';
        mockHeaders = { 'x-internal-api-key': apiKey };
        executionContext = createMockExecutionContext(mockHeaders);
        jest.spyOn(configService, 'get').mockReturnValue(apiKey);

        // Act
        const result = guard.canActivate(executionContext);

        // Assert
        expect(result).toBe(true);
      });
    });

    describe('🔒 Security edge cases', () => {
      it('should not allow bypass with authorization header instead', () => {
        // Arrange
        mockHeaders = { authorization: 'Bearer token-here' };
        executionContext = createMockExecutionContext(mockHeaders);
        jest.spyOn(configService, 'get').mockReturnValue('valid-key');

        // Act & Assert
        expect(() => guard.canActivate(executionContext)).toThrow(
          UnauthorizedException,
        );
      });

      it('should deny access with SQL injection attempt in API key', () => {
        // Arrange
        mockHeaders = {
          'x-internal-api-key': "'; DROP TABLE users; --",
        };
        executionContext = createMockExecutionContext(mockHeaders);
        jest.spyOn(configService, 'get').mockReturnValue('valid-key');

        // Act & Assert
        expect(() => guard.canActivate(executionContext)).toThrow(
          UnauthorizedException,
        );
      });

      it('should handle very long API keys correctly', () => {
        // Arrange
        const longKey = 'a'.repeat(10000);
        mockHeaders = { 'x-internal-api-key': longKey };
        executionContext = createMockExecutionContext(mockHeaders);
        jest.spyOn(configService, 'get').mockReturnValue(longKey);

        // Act
        const result = guard.canActivate(executionContext);

        // Assert
        expect(result).toBe(true);
      });

      it('should reject API key with newline characters', () => {
        // Arrange
        mockHeaders = {
          'x-internal-api-key': 'valid-key\nmalicious-payload',
        };
        executionContext = createMockExecutionContext(mockHeaders);
        jest.spyOn(configService, 'get').mockReturnValue('valid-key');

        // Act & Assert
        expect(() => guard.canActivate(executionContext)).toThrow(
          UnauthorizedException,
        );
      });
    });

    describe('📊 Integration scenarios', () => {
      it('should work with multiple requests in sequence', () => {
        // Arrange
        const validKey = 'consistent-key';
        jest.spyOn(configService, 'get').mockReturnValue(validKey);

        // Act - First request
        mockHeaders = { 'x-internal-api-key': validKey };
        executionContext = createMockExecutionContext(mockHeaders);
        const result1 = guard.canActivate(executionContext);

        // Act - Second request
        mockHeaders = { 'x-internal-api-key': validKey };
        executionContext = createMockExecutionContext(mockHeaders);
        const result2 = guard.canActivate(executionContext);

        // Assert
        expect(result1).toBe(true);
        expect(result2).toBe(true);
      });

      it('should handle mixed valid and invalid requests', () => {
        // Arrange
        const validKey = 'correct-key';
        jest.spyOn(configService, 'get').mockReturnValue(validKey);

        // Act & Assert - Valid request
        mockHeaders = { 'x-internal-api-key': validKey };
        executionContext = createMockExecutionContext(mockHeaders);
        expect(guard.canActivate(executionContext)).toBe(true);

        // Act & Assert - Invalid request
        mockHeaders = { 'x-internal-api-key': 'wrong-key' };
        executionContext = createMockExecutionContext(mockHeaders);
        expect(() => guard.canActivate(executionContext)).toThrow(
          UnauthorizedException,
        );
      });
    });
  });
});