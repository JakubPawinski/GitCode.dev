import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './providers/auth.service';
import { RedisService } from '../redis/redis.service';
import { AppService } from '../app.service';
import { ConfigService } from '@nestjs/config';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let redisService: jest.Mocked<RedisService>;
  let appService: jest.Mocked<AppService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockAuthService = {
      initiateLogin: jest.fn(),
      handleCallback: jest.fn(),
      refreshTokens: jest.fn(),
      logout: jest.fn(),
      initiateAccountUpdate: jest.fn(),
      handleAccountUpdateCallback: jest.fn(),
      getOAuthTokenForGithub: jest.fn(),
    };

    const mockRedisService = {
      get: jest.fn(),
      del: jest.fn(),
      set: jest.fn(),
    };

    const mockAppService = {
      getHealth: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
      getOrThrow: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: AppService,
          useValue: mockAppService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    redisService = module.get(RedisService);
    appService = module.get(AppService);
    configService = module.get(ConfigService);

    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return health status', () => {
      const mockHealth = { status: 'Auth Service is healthy' };
      appService.getHealth.mockReturnValue(mockHealth);

      const result = controller.getHealth();

      expect(result).toEqual(mockHealth);
      expect(appService.getHealth).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should initiate login and redirect with state cookie', async () => {
      // Arrange
      const mockResponse = {
        authUrl: 'https://keycloak/auth',
        state: 'test-state',
      } as any;
      authService.initiateLogin.mockResolvedValue(mockResponse);

      const res = {
        cookie: jest.fn(),
        redirect: jest.fn(),
      } as any;

      // Act
      await controller.login('keycloak', res);

      // Assert
      expect(authService.initiateLogin).toHaveBeenCalledWith('keycloak');
      expect(res.cookie).toHaveBeenCalledWith('oauth_state', 'test-state', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 300000,
      });
      expect(res.redirect).toHaveBeenCalledWith('https://keycloak/auth');
    });

    it('should use github provider when specified', async () => {
      // Arrange
      const mockResponse = {
        authUrl: 'https://github/oauth',
        state: 'github-state',
      } as any;
      authService.initiateLogin.mockResolvedValue(mockResponse);

      const res = {
        cookie: jest.fn(),
        redirect: jest.fn(),
      } as any;

      // Act
      await controller.login('github', res);

      // Assert
      expect(authService.initiateLogin).toHaveBeenCalledWith('github');
      expect(res.redirect).toHaveBeenCalledWith('https://github/oauth');
    });
  });

  describe('callback', () => {
    beforeEach(() => {
      redisService.get.mockResolvedValue('keycloak');
      redisService.del.mockResolvedValue(undefined);
    });

    it('should handle successful callback and set cookie', async () => {
      // Arrange
      const mockTokens = {
        accessToken: 'access',
        refreshToken: 'refresh',
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          avatarUrl: 'avatar.jpg',
        },
      };
      authService.handleCallback.mockResolvedValue(mockTokens);

      const req = {
        cookies: { oauth_state: 'test-state' },
        url: '/auth/callback',
      } as any;
      const res = {
        cookie: jest.fn(),
        redirect: jest.fn(),
        clearCookie: jest.fn(),
      } as any;

      // Act
      await controller.callback('code', 'test-state', req, res);

      // Assert
      expect(authService.handleCallback).toHaveBeenCalledWith('code');
      expect(redisService.get).toHaveBeenCalledWith('oauth_state:test-state');
      expect(redisService.del).toHaveBeenCalledWith('oauth_state:test-state');
      expect(res.cookie).toHaveBeenCalledWith(
        'gc_refresh',
        'refresh',
        expect.any(Object),
      );
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONTEND_URL}/auth/callback?success=true`,
      );
    });

    it('should handle error in callback', async () => {
      // Arrange
      const req = {
        cookies: { oauth_state: 'test-state' },
        url: '/auth/callback',
      } as any;
      const res = {
        redirect: jest.fn(),
        clearCookie: jest.fn(),
      } as any;

      // Act
      await controller.callback(
        'code',
        'test-state',
        req,
        res,
        'error',
        'description',
      );

      // Assert
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONTEND_URL}/login?error=error&description=description`,
      );
    });

    it('should handle missing code', async () => {
      // Arrange
      const req = {
        cookies: { oauth_state: 'test-state' },
        url: '/auth/callback',
      } as any;
      const res = {
        redirect: jest.fn(),
      } as any;

      // Act
      await controller.callback('', 'test-state', req, res);

      // Assert
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONTEND_URL}/login?error=missing_code`,
      );
    });

    it('should handle invalid state', async () => {
      // Arrange
      const req = {
        cookies: { oauth_state: 'wrong-state' },
        url: '/auth/callback',
      } as any;
      const res = {
        redirect: jest.fn(),
        clearCookie: jest.fn(),
      } as any;

      // Act
      await controller.callback('code', 'test-state', req, res);

      // Assert
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONTEND_URL}/login?error=invalid_state`,
      );
    });

    it('should handle missing oauth_state cookie', async () => {
      // Arrange
      const req = {
        cookies: {},
        url: '/auth/callback',
      } as any;
      const res = {
        redirect: jest.fn(),
        clearCookie: jest.fn(),
      } as any;

      // Act
      await controller.callback('code', 'test-state', req, res);

      // Assert
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONTEND_URL}/login?error=invalid_state`,
      );
    });

    it('should handle expired oauth_state in redis', async () => {
      // Arrange
      redisService.get.mockResolvedValue(null);

      const req = {
        cookies: { oauth_state: 'test-state' },
        url: '/auth/callback',
      } as any;
      const res = {
        redirect: jest.fn(),
        clearCookie: jest.fn(),
      } as any;

      // Act
      await controller.callback('code', 'test-state', req, res);

      // Assert
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONTEND_URL}/login?error=invalid_state`,
      );
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      // Arrange
      const mockTokens = {
        accessToken: 'access',
        refreshToken: 'new-refresh',
        user: {
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          avatarUrl: 'avatar.jpg',
        },
      };
      authService.refreshTokens.mockResolvedValue(mockTokens);

      const req = {
        cookies: { gc_refresh: 'old-refresh' },
        url: '/auth/refresh',
      } as any;
      const res = {
        cookie: jest.fn(),
        json: jest.fn(),
      } as any;

      // Act
      await controller.refresh(req, res);

      // Assert
      expect(authService.refreshTokens).toHaveBeenCalledWith('old-refresh');
      expect(res.cookie).toHaveBeenCalledWith(
        'gc_refresh',
        'new-refresh',
        expect.any(Object),
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        statusCode: 200,
        message: 'Token refreshed successfully',
        data: {
          accessToken: 'access',
          user: {
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            avatarUrl: 'avatar.jpg',
          },
        },
        timestamp: expect.any(String),
        path: '/auth/refresh',
      });
    });

    it('should handle missing refresh token', async () => {
      // Arrange
      const req = {
        cookies: {},
        url: '/auth/refresh',
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      // Act
      await controller.refresh(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        statusCode: 401,
        message: 'No refresh token provided',
        data: null,
        error: {
          code: 'NO_REFRESH_TOKEN',
          message: 'No refresh token provided',
        },
        timestamp: expect.any(String),
        path: '/auth/refresh',
      });
    });

    it('should handle invalid refresh token', async () => {
      // Arrange
      authService.refreshTokens.mockRejectedValue(new Error('Invalid token'));

      const req = {
        cookies: { gc_refresh: 'invalid' },
        url: '/auth/refresh',
      } as any;
      const res = {
        clearCookie: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      // Act
      await controller.refresh(req, res);

      // Assert
      expect(authService.refreshTokens).toHaveBeenCalledWith('invalid');
      expect(res.clearCookie).toHaveBeenCalledWith('gc_refresh', { path: '/' });
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        statusCode: 401,
        message: 'Invalid refresh token',
        data: null,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid token',
        },
        timestamp: expect.any(String),
        path: '/auth/refresh',
      });
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      // Arrange
      authService.logout.mockResolvedValue();

      const req = {
        cookies: { gc_refresh: 'token' },
        url: '/auth/logout',
      } as any;
      const res = {
        clearCookie: jest.fn(),
        json: jest.fn(),
      } as any;

      // Act
      await controller.logout(req, res);

      // Assert
      expect(authService.logout).toHaveBeenCalledWith('token');
      expect(res.clearCookie).toHaveBeenCalledWith('gc_refresh', { path: '/' });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        statusCode: 200,
        message: 'Logged out successfully',
        data: {
          message: 'Logged out successfully',
        },
        timestamp: expect.any(String),
        path: '/auth/logout',
      });
    });

    it('should logout without token', async () => {
      // Arrange
      const req = {
        cookies: {},
        url: '/auth/logout',
      } as any;
      const res = {
        clearCookie: jest.fn(),
        json: jest.fn(),
      } as any;

      // Act
      await controller.logout(req, res);

      // Assert
      expect(authService.logout).not.toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledWith('gc_refresh', { path: '/' });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        statusCode: 200,
        message: 'Logged out successfully',
        data: {
          message: 'Logged out successfully',
        },
        timestamp: expect.any(String),
        path: '/auth/logout',
      });
    });

    it('should handle logout error gracefully', async () => {
      // Arrange
      authService.logout.mockRejectedValue(new Error('Redis error'));

      const req = {
        cookies: { gc_refresh: 'token' },
        url: '/auth/logout',
      } as any;
      const res = {
        clearCookie: jest.fn(),
        json: jest.fn(),
      } as any;

      // Act
      await controller.logout(req, res);

      // Assert
      expect(res.clearCookie).toHaveBeenCalledWith('gc_refresh', { path: '/' });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        statusCode: 200,
        message: 'Logged out successfully',
        data: {
          message: 'Logged out successfully',
        },
        timestamp: expect.any(String),
        path: '/auth/logout',
      });
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      // Arrange
      const mockUser = { id: '1', username: 'test' };
      const req = {
        user: mockUser,
        url: '/auth/me',
      } as any;

      // Act
      const result = await controller.getProfile(req);

      // Assert
      expect(result).toEqual({
        success: true,
        statusCode: 200,
        message: 'User profile retrieved successfully',
        data: mockUser,
        timestamp: expect.any(String),
        path: '/auth/me',
      });
    });
  });

  describe('initiateAccountUpdate', () => {
    it('should initiate account update and redirect', async () => {
      // Arrange
      const mockUrl = { accountUpdateUrl: 'https://keycloak/account' };
      authService.initiateAccountUpdate.mockResolvedValue(mockUrl);

      const res = {
        redirect: jest.fn(),
      } as any;

      // Act
      await controller.initiateAccountUpdate(res);

      // Assert
      expect(authService.initiateAccountUpdate).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith('https://keycloak/account');
    });
  });

  describe('handleAccountUpdateCallback', () => {
    it('should handle account update callback and redirect on success', async () => {
      // Arrange
      const mockResult = { success: true, message: 'Updated' };
      authService.handleAccountUpdateCallback.mockResolvedValue(mockResult);

      const req = {
        user: { id: '1' },
      } as any;
      const res = {
        redirect: jest.fn(),
      } as any;

      // Act
      await controller.handleAccountUpdateCallback(req, res);

      // Assert
      expect(authService.handleAccountUpdateCallback).toHaveBeenCalledWith('1');
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONTEND_URL}/account?update=success`,
      );
    });

    it('should handle failed account update callback', async () => {
      // Arrange
      const mockResult = { success: false, message: 'Failed' };
      authService.handleAccountUpdateCallback.mockResolvedValue(mockResult);

      const req = {
        user: { id: '1' },
      } as any;
      const res = {
        redirect: jest.fn(),
      } as any;

      // Act
      await controller.handleAccountUpdateCallback(req, res);

      // Assert
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONTEND_URL}/account?update=failure`,
      );
    });
  });

  describe('getGitHubTokenForUser', () => {
    it('should get GitHub token for user', async () => {
      // Arrange
      const mockToken = {
        accessToken: 'github-token-123',
        scope: 'public_repo,read:user,user:email',
        tokenType: 'bearer',
      };
      authService.getOAuthTokenForGithub.mockResolvedValue(mockToken);

      // Act
      const result = await controller.getGitHubTokenForUser('user-123');

      // Assert
      expect(authService.getOAuthTokenForGithub).toHaveBeenCalledWith(
        'user-123',
      );
      expect(result).toEqual(mockToken);
    });

    it('should handle missing GitHub token', async () => {
      // Arrange
      const mockError = new Error('User not connected to GitHub');
      authService.getOAuthTokenForGithub.mockRejectedValue(mockError);

      // Act & Assert
      await expect(
        controller.getGitHubTokenForUser('user-123'),
      ).rejects.toThrow('User not connected to GitHub');
    });
  });
});
