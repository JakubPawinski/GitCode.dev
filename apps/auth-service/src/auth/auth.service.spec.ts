import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AppRole, AppPermission } from '@gitcode/types';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let redisService: jest.Mocked<RedisService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
      },
      oAuthToken: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const mockRedisService = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    redisService = module.get(RedisService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initiateLogin', () => {
    it('should generate auth URL and store state', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'keycloak') {
          return {
            authorizationUrl: 'https://keycloak/auth',
            clientId: 'client-id',
          };
        }
        if (key === 'api.callbackAuthUrl') {
          return 'https://api/callback';
        }
        return undefined;
      });

      const result = await service.initiateLogin();

      expect(result.authUrl).toContain('https://keycloak/auth');
      expect(result.authUrl).toContain('client_id=client-id');
      expect(result.authUrl).toContain(
        'redirect_uri=https%3A%2F%2Fapi%2Fcallback',
      );
      expect(result.state).toBeDefined();
      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringContaining('oauth_state:'),
        'keycloak',
        300,
      );
    });
  });

  describe('handleCallback', () => {
    it('should handle callback and return tokens', async () => {
      const mockTokens = {
        access_token: 'access',
        refresh_token: 'refresh',
        expires_in: 3600,
      };
      const mockUserInfo = {
        sub: 'keycloak-id',
        email: 'test@example.com',
        preferred_username: 'testuser',
        given_name: 'Test',
        family_name: 'User',
        picture: 'avatar.jpg',
        email_verified: true,
      };
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: 'avatar.jpg',
        roles: [AppRole.USER],
        permissions: [AppPermission.USER_READ_PUBLIC],
      };

      jest
        .spyOn(service as any, 'exchangeCodeForTokens')
        .mockResolvedValue(mockTokens);
      jest.spyOn(service as any, 'getUserInfo').mockResolvedValue(mockUserInfo);
      jest.spyOn(service as any, 'getRealmRoles').mockReturnValue(['user']);
      jest.spyOn(service as any, 'upsertUser').mockResolvedValue(mockUser);
      jest
        .spyOn(service as any, 'generateAccessToken')
        .mockReturnValue('access-token');
      jest
        .spyOn(service as any, 'generateRefreshToken')
        .mockResolvedValue('refresh-token');

      const result = await service.handleCallback('code');

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user.id).toBe('1');
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: 'avatar.jpg',
        userStatus: 'ACTIVE',
      };

      redisService.get.mockResolvedValue('1');
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      jest
        .spyOn(service as any, 'generateAccessToken')
        .mockReturnValue('new-access');
      jest
        .spyOn(service as any, 'generateRefreshToken')
        .mockResolvedValue('new-refresh');

      const result = await service.refreshTokens('old-refresh');

      expect(result.accessToken).toBe('new-access');
      expect(result.refreshToken).toBe('new-refresh');
      expect(redisService.del).toHaveBeenCalledWith(
        'refresh_token:old-refresh',
      );
    });

    it('should throw if refresh token invalid', async () => {
      redisService.get.mockResolvedValue(null);

      await expect(service.refreshTokens('invalid')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw if user not active', async () => {
      const mockUser = { userStatus: 'BANNED' };
      redisService.get.mockResolvedValue('1');
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
        mockUser as any,
      );

      await expect(service.refreshTokens('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should revoke all tokens for user', async () => {
      await service.revokeAllUserTokens('1');

      expect(redisService.set).toHaveBeenCalledWith(
        'blacklist:user:1',
        expect.any(String),
        604800,
      );
    });
  });

  describe('logout', () => {
    it('should delete refresh token', async () => {
      await service.logout('token');

      expect(redisService.del).toHaveBeenCalledWith('refresh_token:token');
    });
  });

  describe('validateUser', () => {
    it('should validate active user', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        permissions: [],
        roles: [],
        userStatus: 'ACTIVE',
      };

      redisService.exists.mockResolvedValue(false); 
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.validateUser('1');

      expect(result.id).toBe('1');
    });

    it('should throw if user blacklisted', async () => {
      redisService.exists.mockResolvedValue(true); 

      await expect(service.validateUser('1')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw if user not found', async () => {
      redisService.exists.mockResolvedValue(false);
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.validateUser('1')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw if user not active', async () => {
      const mockUser = { userStatus: 'BANNED' };
      redisService.exists.mockResolvedValue(false); 
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
        mockUser as any,
      );

      await expect(service.validateUser('1')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('initiateAccountUpdate', () => {
    it('should generate account update URL', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'keycloak') {
          return {
            url: 'https://keycloak',
            realm: 'realm',
            clientId: 'client-id',
          };
        }
        if (key === 'api.callbackAccountUrl') {
          return 'https://api/callback';
        }
        return undefined;
      });

      const result = await service.initiateAccountUpdate();

      expect(result.accountUpdateUrl).toContain(
        'https://keycloak/realms/realm/account',
      );
      expect(result.accountUpdateUrl).toContain('referrer=client-id');
      expect(result.accountUpdateUrl).toContain(
        'referrer_uri=https%3A%2F%2Fapi%2Fcallback',
      );
    });
  });

  describe('handleAccountUpdateCallback', () => {
    it('should update profile successfully', async () => {
      const mockToken = {
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresAt: new Date(),
        scope: 'scope',
        tokenType: 'Bearer',
      };
      const mockUserInfo = { email: 'updated@example.com' };

      (prismaService.oAuthToken.findUnique as jest.Mock).mockResolvedValue(
        mockToken as any,
      );
      jest.spyOn(service as any, 'getUserInfo').mockResolvedValue(mockUserInfo);
      jest.spyOn(service as any, 'upsertUser').mockResolvedValue(undefined);

      const result = await service.handleAccountUpdateCallback('1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Profile updated successfully');
    });

    it('should return failure if no token', async () => {
      (prismaService.oAuthToken.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      const result = await service.handleAccountUpdateCallback('1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to update profile');
    });
  });
});
