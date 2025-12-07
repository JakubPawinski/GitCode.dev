import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RedisService } from '../redis/redis.service';
import { AppService } from '../app.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let redisService: jest.Mocked<RedisService>;
  let appService: jest.Mocked<AppService>;

  beforeEach(async () => {
    const mockAuthService = {
      initiateLogin: jest.fn(),
      handleCallback: jest.fn(),
      refreshTokens: jest.fn(),
      logout: jest.fn(),
      initiateAccountUpdate: jest.fn(),
      handleAccountUpdateCallback: jest.fn(),
    };

    const mockRedisService = {
      get: jest.fn(),
      del: jest.fn(),
    };

    const mockAppService = {
      getHealth: jest.fn(),
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
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    redisService = module.get(RedisService);
    appService = module.get(AppService);

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
      const mockResponse = {
        authUrl: 'https://keycloak/auth',
        state: 'test-state',
      } as any;
      authService.initiateLogin.mockResolvedValue(mockResponse);

      const res = {
        cookie: jest.fn(),
        redirect: jest.fn(),
      } as any;

      await controller.login('keycloak', res);

      expect(authService.initiateLogin).toHaveBeenCalledWith('keycloak');
      expect(res.cookie).toHaveBeenCalledWith('oauth_state', 'test-state', {
        httpOnly: true,
        secure: false, // should be true in production
        sameSite: 'lax',
        maxAge: 300000,
      });
      expect(res.redirect).toHaveBeenCalledWith('https://keycloak/auth');
    });
  });

  describe('callback', () => {
    it('should handle successful callback and set cookie', async () => {
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
      redisService.get.mockResolvedValue('keycloak');

      const req = {
        cookies: { oauth_state: 'test-state' },
        url: '/auth/callback',
      } as any;
      const res = {
        cookie: jest.fn(),
        redirect: jest.fn(),
        clearCookie: jest.fn(),
      } as any;

      await controller.callback('code', 'test-state', req, res);

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
      const req = {
        cookies: { oauth_state: 'test-state' },
        url: '/auth/callback',
      } as any;
      const res = {
        redirect: jest.fn(),
        clearCookie: jest.fn(),
      } as any;

      await controller.callback(
        'code',
        'test-state',
        req,
        res,
        'error',
        'description',
      );

      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONTEND_URL}/login?error=error&description=description`,
      );
    });

    it('should handle missing code', async () => {
      const req = {
        cookies: { oauth_state: 'test-state' },
        url: '/auth/callback',
      } as any;
      const res = {
        redirect: jest.fn(),
      } as any;

      await controller.callback('', 'test-state', req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONTEND_URL}/login?error=missing_code`,
      );
    });

    it('should handle invalid state', async () => {
      const req = {
        cookies: { oauth_state: 'wrong-state' },
        url: '/auth/callback',
      } as any;
      const res = {
        redirect: jest.fn(),
        clearCookie: jest.fn(),
      } as any;

      await controller.callback('code', 'test-state', req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONTEND_URL}/login?error=invalid_state`,
      );
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
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

      await controller.refresh(req, res);

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
      const req = {
        cookies: {},
        url: '/auth/refresh',
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      await controller.refresh(req, res);

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

      await controller.refresh(req, res);

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
      authService.logout.mockResolvedValue();

      const req = {
        cookies: { gc_refresh: 'token' },
        url: '/auth/logout',
      } as any;
      const res = {
        clearCookie: jest.fn(),
        json: jest.fn(),
      } as any;

      await controller.logout(req, res);

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
      const req = {
        cookies: {},
        url: '/auth/logout',
      } as any;
      const res = {
        clearCookie: jest.fn(),
        json: jest.fn(),
      } as any;

      await controller.logout(req, res);

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
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = { id: '1', username: 'test' };
      const req = {
        user: mockUser,
        url: '/auth/me',
      } as any;

      const result = await controller.getProfile(req);

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
      const mockUrl = { accountUpdateUrl: 'https://keycloak/account' };
      authService.initiateAccountUpdate.mockResolvedValue(mockUrl);

      const res = {
        redirect: jest.fn(),
      } as any;

      await controller.initiateAccountUpdate(res);

      expect(authService.initiateAccountUpdate).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith('https://keycloak/account');
    });
  });

  describe('handleAccountUpdateCallback', () => {
    it('should handle account update callback and redirect', async () => {
      const mockResult = { success: true, message: 'Updated' };
      authService.handleAccountUpdateCallback.mockResolvedValue(mockResult);

      const req = {
        user: { id: '1' },
      } as any;
      const res = {
        redirect: jest.fn(),
      } as any;

      await controller.handleAccountUpdateCallback(req, res);

      expect(authService.handleAccountUpdateCallback).toHaveBeenCalledWith('1');
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONTEND_URL}/account?update=success`,
      );
    });

    it('should handle failed account update callback', async () => {
      const mockResult = { success: false, message: 'Failed' };
      authService.handleAccountUpdateCallback.mockResolvedValue(mockResult);

      const req = {
        user: { id: '1' },
      } as any;
      const res = {
        redirect: jest.fn(),
      } as any;

      await controller.handleAccountUpdateCallback(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONTEND_URL}/account?update=failure`,
      );
    });
  });
});
