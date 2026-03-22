import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { GithubTokenService } from './github-token.service';
import { of, throwError } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';

describe('GithubTokenService', () => {
  let service: GithubTokenService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUserId = 'user-123';
  const mockAuthServiceUrl = 'http://auth-service:3001';
  const mockApiKey = 'internal-api-key-secret';
  const mockGithubToken = 'github_token_ghu_1234567890';

  const mockTokenResponse = {
    data: {
      data: {
        accessToken: mockGithubToken,
        refreshToken: 'github_refresh_token_123',
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GithubTokenService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                AUTH_SERVICE_URL: mockAuthServiceUrl,
                INTERNAL_API_KEY: mockApiKey,
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<GithubTokenService>(GithubTokenService);
    httpService = module.get(HttpService) as jest.Mocked<HttpService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  describe('getGitHubTokenForUser', () => {
    it('should return GitHub access token successfully', async () => {
      httpService.get.mockReturnValue(of(mockTokenResponse as any));

      const result = await service.getGitHubTokenForUser(mockUserId);

      expect(result).toBe(mockGithubToken);
      expect(httpService.get).toHaveBeenCalledWith(
        `${mockAuthServiceUrl}/auth/internal/oauth-token/${mockUserId}/github`,
        {
          headers: {
            'X-Internal-Api-Key': mockApiKey,
          },
        },
      );
    });

    it('should request correct endpoint with proper headers', async () => {
      httpService.get.mockReturnValue(of(mockTokenResponse as any));

      await service.getGitHubTokenForUser(mockUserId);

      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining(
          `/auth/internal/oauth-token/${mockUserId}/github`,
        ),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Internal-Api-Key': mockApiKey,
          }),
        }),
      );
    });

    it('should throw UnauthorizedException when GitHub token is missing', async () => {
      const responseWithoutToken = {
        data: {
          data: {
            refreshToken: 'github_refresh_token_123',
          },
        },
      };

      httpService.get.mockReturnValue(of(responseWithoutToken as any));

      await expect(service.getGitHubTokenForUser(mockUserId)).rejects.toThrow(
        UnauthorizedException,
      );

      await expect(service.getGitHubTokenForUser(mockUserId)).rejects.toThrow(
        'GitHub account not connected for this user',
      );
    });

    it('should throw UnauthorizedException when token data is null', async () => {
      const responseWithNullData = {
        data: {
          data: null,
        },
      };

      httpService.get.mockReturnValue(of(responseWithNullData as any));

      await expect(service.getGitHubTokenForUser(mockUserId)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when accessToken is empty string', async () => {
      const responseWithEmptyToken = {
        data: {
          data: {
            accessToken: '',
            refreshToken: 'github_refresh_token_123',
          },
        },
      };

      httpService.get.mockReturnValue(of(responseWithEmptyToken as any));

      await expect(service.getGitHubTokenForUser(mockUserId)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException with specific message on 404 error', async () => {
      const error: Partial<AxiosError> = {
        response: {
          status: 404,
        } as AxiosResponse,
      };

      httpService.get.mockReturnValue(throwError(() => error));

      await expect(service.getGitHubTokenForUser(mockUserId)).rejects.toThrow(
        UnauthorizedException,
      );

      await expect(service.getGitHubTokenForUser(mockUserId)).rejects.toThrow(
        'GitHub account not connected. Please connect your GitHub account first.',
      );
    });

    it('should throw UnauthorizedException with specific message on 401 error', async () => {
      const error: Partial<AxiosError> = {
        response: {
          status: 401,
        } as AxiosResponse,
      };

      httpService.get.mockReturnValue(throwError(() => error));

      await expect(service.getGitHubTokenForUser(mockUserId)).rejects.toThrow(
        UnauthorizedException,
      );

      await expect(service.getGitHubTokenForUser(mockUserId)).rejects.toThrow(
        'GitHub account not connected. Please connect your GitHub account first.',
      );
    });

    it('should throw UnauthorizedException on other HTTP errors', async () => {
      const error: Partial<AxiosError> = {
        response: {
          status: 500,
        } as AxiosResponse,
        message: 'Server error',
      };

      httpService.get.mockReturnValue(throwError(() => error));

      await expect(service.getGitHubTokenForUser(mockUserId)).rejects.toThrow(
        UnauthorizedException,
      );

      await expect(service.getGitHubTokenForUser(mockUserId)).rejects.toThrow(
        'Failed to authenticate with GitHub',
      );
    });

    it('should throw UnauthorizedException on network error', async () => {
      const error = new Error('Network error');

      httpService.get.mockReturnValue(throwError(() => error));

      await expect(service.getGitHubTokenForUser(mockUserId)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should use config values for URL and API key', async () => {
      httpService.get.mockReturnValue(of(mockTokenResponse as any));

      await service.getGitHubTokenForUser(mockUserId);

      expect(configService.get).toHaveBeenCalledWith('AUTH_SERVICE_URL');
      expect(configService.get).toHaveBeenCalledWith('INTERNAL_API_KEY');
    });

    it('should handle different user IDs correctly', async () => {
      const userId1 = 'user-abc';
      const userId2 = 'user-xyz';

      httpService.get.mockReturnValue(of(mockTokenResponse as any));

      await service.getGitHubTokenForUser(userId1);
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining(userId1),
        expect.any(Object),
      );

      await service.getGitHubTokenForUser(userId2);
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining(userId2),
        expect.any(Object),
      );
    });

    it('should handle response with multiple tokens correctly', async () => {
      const responseWithMultipleTokens = {
        data: {
          data: {
            accessToken: mockGithubToken,
            refreshToken: 'github_refresh_token_123',
            expiresIn: 3600,
            tokenType: 'bearer',
          },
        },
      };

      httpService.get.mockReturnValue(of(responseWithMultipleTokens as any));

      const result = await service.getGitHubTokenForUser(mockUserId);

      expect(result).toBe(mockGithubToken);
    });
  });

  describe('Error Handling', () => {
    it('should handle error without response object', async () => {
      const error: Partial<AxiosError> = {
        message: 'Connection refused',
      };

      httpService.get.mockReturnValue(throwError(() => error));

      await expect(service.getGitHubTokenForUser(mockUserId)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle error with response but no status', async () => {
      const error: Partial<AxiosError> = {
        response: {} as AxiosResponse,
        message: 'Unknown error',
      };

      httpService.get.mockReturnValue(throwError(() => error));

      await expect(service.getGitHubTokenForUser(mockUserId)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('Service Definition', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have getGitHubTokenForUser method', () => {
      expect(service.getGitHubTokenForUser).toBeDefined();
      expect(typeof service.getGitHubTokenForUser).toBe('function');
    });
  });
});
