import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { OauthService } from './oauth.service';
import { SessionService } from './session.service';
import { EventBus } from '@gitcode/messaging';
import { AUTH_PATTERNS, UserCreatedEvent } from '@gitcode/contracts';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let oauthService: jest.Mocked<OauthService>;
  let sessionService: jest.Mocked<SessionService>;
  let eventBus: jest.Mocked<EventBus>;

  const mockUser = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    avatarUrl: 'avatar.jpg',
    roles: ['user'],
    permissions: ['user:read'],
    userStatus: 'ACTIVE',
  };

  const mockOAuthToken = {
    id: 'oauth-token-id',
    userId: '1',
    provider: 'keycloak',
    accessToken: 'keycloak-access',
    refreshToken: 'keycloak-refresh',
    expiresAt: new Date(Date.now() + 3600000),
    scope: 'openid profile email',
    tokenType: 'Bearer',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    revokedAt: null,
  };

  const mockTokens = {
    access_token: 'keycloak-access',
    refresh_token: 'keycloak-refresh',
    expires_in: 3600,
    scope: 'openid profile email',
    token_type: 'Bearer',
  };

  const mockUserInfo = {
    sub: 'keycloak-id',
    email: 'test@example.com',
    preferred_username: 'testuser',
    given_name: 'Test',
    family_name: 'User',
    picture: 'avatar.jpg',
    email_verified: true,
    roles: ['user'],
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      oAuthToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockOauthService = {
      exchangeCodeForTokens: jest.fn(),
      getUserInfo: jest.fn(),
      getRealmRoles: jest.fn(),
      exchangeRefreshTokenForTokens: jest.fn(),
      logoutFromKeycloak: jest.fn(),
      encryptToken: jest.fn(),
      decryptToken: jest.fn(),
      fetchGitHubTokenFromBroker: jest.fn(),
    };

    const mockSessionService = {
      saveOAuthState: jest.fn(),
      getSessionData: jest.fn(),
      deleteSession: jest.fn(),
      saveSessionData: jest.fn(),
      removeOAuthState: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: OauthService,
          useValue: mockOauthService,
        },
        {
          provide: SessionService,
          useValue: mockSessionService,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    oauthService = module.get(OauthService);
    sessionService = module.get(SessionService);
    eventBus = module.get(EventBus);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initiateLogin', () => {
    it('should generate auth URL and store state', async () => {
      const keycloakConfig = {
        authorizationUrl: 'https://keycloak/auth',
        clientId: 'client-id',
      };

      configService.get.mockImplementation((key: string) => {
        if (key === 'keycloak') return keycloakConfig;
        if (key === 'api.callbackAuthUrl') return 'https://api/callback';
        return undefined;
      });

      const result = await service.initiateLogin();

      expect(result.authUrl).toContain('https://keycloak/auth');
      expect(result.authUrl).toContain('client_id=client-id');
      expect(result.state).toBeDefined();
      expect(sessionService.saveOAuthState).toHaveBeenCalledWith(
        result.state,
        'keycloak',
      );
    });
  });

  describe('handleCallback', () => {
    it('should handle callback and return tokens for new user', async () => {
      (oauthService.exchangeCodeForTokens as jest.Mock).mockResolvedValue(
        mockTokens,
      );
      (oauthService.getUserInfo as jest.Mock).mockResolvedValue(mockUserInfo);
      (oauthService.getRealmRoles as jest.Mock).mockReturnValue(['user']);
      (oauthService.fetchGitHubTokenFromBroker as jest.Mock).mockResolvedValue(
        null,
      );
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.user.upsert as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.oAuthToken.create as jest.Mock).mockResolvedValue(
        mockOAuthToken,
      );
      (jwtService.sign as jest.Mock).mockReturnValue('access-token-jwt');
      (sessionService.saveSessionData as jest.Mock).mockResolvedValue(
        undefined,
      );

      const result = await service.handleCallback('auth-code');

      expect(result.accessToken).toBe('access-token-jwt');
      expect(result.refreshToken).toBeDefined();
      expect(result.user.id).toBe('1');
      expect(eventBus.publish).toHaveBeenCalledWith(
        AUTH_PATTERNS.USER_CREATED,
        expect.any(UserCreatedEvent),
      );
    });

    it('should throw if user not active', async () => {
      const inactiveUser = { ...mockUser, userStatus: 'BANNED' };

      (oauthService.exchangeCodeForTokens as jest.Mock).mockResolvedValue(
        mockTokens,
      );
      (oauthService.getUserInfo as jest.Mock).mockResolvedValue(mockUserInfo);
      (oauthService.getRealmRoles as jest.Mock).mockReturnValue(['user']);
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
        inactiveUser,
      );

      await expect(service.handleCallback('auth-code')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle existing user login', async () => {
      (oauthService.exchangeCodeForTokens as jest.Mock).mockResolvedValue(
        mockTokens,
      );
      (oauthService.getUserInfo as jest.Mock).mockResolvedValue(mockUserInfo);
      (oauthService.getRealmRoles as jest.Mock).mockReturnValue(['user']);
      (oauthService.fetchGitHubTokenFromBroker as jest.Mock).mockResolvedValue(
        null,
      );
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.upsert as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.oAuthToken.create as jest.Mock).mockResolvedValue(
        mockOAuthToken,
      );
      (jwtService.sign as jest.Mock).mockReturnValue('access-token-jwt');
      (sessionService.saveSessionData as jest.Mock).mockResolvedValue(
        undefined,
      );

      const result = await service.handleCallback('auth-code');

      expect(result.user.id).toBe('1');
      expect(eventBus.publish).not.toHaveBeenCalled(); // Nie publikuj dla istniejącego użytkownika
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully and sync user data', async () => {
      const sessionData = {
        userId: '1',
        oauthTokenId: 'oauth-token-id',
      };

      const newTokens = {
        access_token: 'new-keycloak-access',
        refresh_token: 'new-keycloak-refresh',
        expires_in: 3600,
        scope: 'openid profile email',
        token_type: 'Bearer',
      };

      (sessionService.getSessionData as jest.Mock).mockResolvedValue(
        sessionData,
      );
      (sessionService.deleteSession as jest.Mock).mockResolvedValue(undefined);
      (prismaService.oAuthToken.findUnique as jest.Mock).mockResolvedValue(
        mockOAuthToken,
      );
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (
        oauthService.exchangeRefreshTokenForTokens as jest.Mock
      ).mockResolvedValue(newTokens);
      (oauthService.getUserInfo as jest.Mock).mockResolvedValue(mockUserInfo);
      (oauthService.getRealmRoles as jest.Mock).mockReturnValue(['user']);
      (prismaService.user.update as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.oAuthToken.update as jest.Mock).mockResolvedValue(
        mockOAuthToken,
      );
      (jwtService.sign as jest.Mock).mockReturnValue('new-access-token');
      (sessionService.saveSessionData as jest.Mock).mockResolvedValue(
        undefined,
      );

      const result = await service.refreshTokens('old-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBeDefined();
      expect(prismaService.user.update).toHaveBeenCalled();
      expect(prismaService.oAuthToken.update).toHaveBeenCalled();
      expect(sessionService.deleteSession).toHaveBeenCalledWith(
        'old-refresh-token',
      );
    });

    it('should throw if refresh token invalid', async () => {
      (sessionService.getSessionData as jest.Mock).mockResolvedValue(null);

      await expect(service.refreshTokens('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should mark token as inactive if Keycloak rejects refresh', async () => {
      const sessionData = {
        userId: '1',
        oauthTokenId: 'oauth-token-id',
      };

      (sessionService.getSessionData as jest.Mock).mockResolvedValue(
        sessionData,
      );
      (sessionService.deleteSession as jest.Mock).mockResolvedValue(undefined);
      (prismaService.oAuthToken.findUnique as jest.Mock).mockResolvedValue(
        mockOAuthToken,
      );
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (
        oauthService.exchangeRefreshTokenForTokens as jest.Mock
      ).mockRejectedValue(new Error('Invalid refresh token'));

      await expect(service.refreshTokens('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(prismaService.oAuthToken.update).toHaveBeenCalledWith({
        where: { id: 'oauth-token-id' },
        data: { isActive: false, revokedAt: expect.any(Date) },
      });
    });

    it('should throw if user not active', async () => {
      const sessionData = {
        userId: '1',
        oauthTokenId: 'oauth-token-id',
      };
      const inactiveUser = { ...mockUser, userStatus: 'BANNED' };

      (sessionService.getSessionData as jest.Mock).mockResolvedValue(
        sessionData,
      );
      (sessionService.deleteSession as jest.Mock).mockResolvedValue(undefined);
      (prismaService.oAuthToken.findUnique as jest.Mock).mockResolvedValue(
        mockOAuthToken,
      );
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
        inactiveUser,
      );

      await expect(service.refreshTokens('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should logout and revoke tokens', async () => {
      const sessionData = {
        userId: '1',
        oauthTokenId: 'oauth-token-id',
      };

      (sessionService.getSessionData as jest.Mock).mockResolvedValue(
        sessionData,
      );
      (prismaService.oAuthToken.findUnique as jest.Mock).mockResolvedValue(
        mockOAuthToken,
      );
      (oauthService.logoutFromKeycloak as jest.Mock).mockResolvedValue(
        undefined,
      );
      (prismaService.oAuthToken.update as jest.Mock).mockResolvedValue(
        mockOAuthToken,
      );
      (sessionService.deleteSession as jest.Mock).mockResolvedValue(undefined);

      await service.logout('refresh-token');

      expect(oauthService.logoutFromKeycloak).toHaveBeenCalledWith(
        mockOAuthToken.refreshToken,
      );
      expect(prismaService.oAuthToken.update).toHaveBeenCalledWith({
        where: { id: 'oauth-token-id' },
        data: { revokedAt: expect.any(Date), isActive: false },
      });
      expect(sessionService.deleteSession).toHaveBeenCalledWith(
        'refresh-token',
      );
    });

    it('should handle missing session gracefully', async () => {
      (sessionService.getSessionData as jest.Mock).mockResolvedValue(null);

      await service.logout('invalid-token');

      expect(sessionService.deleteSession).not.toHaveBeenCalled();
    });

    it('should delete session even if Keycloak logout fails', async () => {
      const sessionData = {
        userId: '1',
        oauthTokenId: 'oauth-token-id',
      };

      (sessionService.getSessionData as jest.Mock).mockResolvedValue(
        sessionData,
      );
      (prismaService.oAuthToken.findUnique as jest.Mock).mockResolvedValue(
        mockOAuthToken,
      );
      (oauthService.logoutFromKeycloak as jest.Mock).mockRejectedValue(
        new Error('Keycloak error'),
      );
      (prismaService.oAuthToken.update as jest.Mock).mockResolvedValue(
        mockOAuthToken,
      );
      (sessionService.deleteSession as jest.Mock).mockResolvedValue(undefined);

      await service.logout('refresh-token');

      expect(sessionService.deleteSession).toHaveBeenCalledWith(
        'refresh-token',
      );
    });
  });

  describe('validateUser', () => {
    it('should validate active user', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.validateUser('1');

      expect(result.id).toBe('1');
      expect(result.userStatus).toBe('ACTIVE');
    });

    it('should throw if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.validateUser('1')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw if user not active', async () => {
      const inactiveUser = { ...mockUser, userStatus: 'BANNED' };
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(
        inactiveUser,
      );

      await expect(service.validateUser('1')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('initiateAccountUpdate', () => {
    it('should generate account update URL', async () => {
      const keycloakConfig = {
        url: 'https://keycloak',
        realm: 'gitcode-realm',
        clientId: 'gitcode-client',
      };

      configService.get.mockImplementation((key: string) => {
        if (key === 'keycloak') return keycloakConfig;
        if (key === 'api.callbackAccountUrl')
          return 'https://api/account-callback';
        return undefined;
      });

      const result = await service.initiateAccountUpdate();

      expect(result.accountUpdateUrl).toContain(
        'https://keycloak/realms/gitcode-realm/account',
      );
      expect(result.accountUpdateUrl).toContain('referrer=gitcode-client');
      expect(result.accountUpdateUrl).toContain(
        'referrer_uri=https%3A%2F%2Fapi%2Faccount-callback',
      );
    });
  });

  describe('handleAccountUpdateCallback', () => {
    it('should update profile successfully', async () => {
      (prismaService.oAuthToken.findFirst as jest.Mock).mockResolvedValue(
        mockOAuthToken,
      );
      (oauthService.getUserInfo as jest.Mock).mockResolvedValue(mockUserInfo);
      (oauthService.getRealmRoles as jest.Mock).mockReturnValue(['user']);
      (prismaService.user.upsert as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.oAuthToken.create as jest.Mock).mockResolvedValue(
        mockOAuthToken,
      );

      const result = await service.handleAccountUpdateCallback('1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Profile updated successfully');
      expect(prismaService.oAuthToken.findFirst).toHaveBeenCalledWith({
        where: {
          userId: '1',
          provider: 'keycloak',
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return failure if no active token', async () => {
      (prismaService.oAuthToken.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.handleAccountUpdateCallback('1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to update profile');
    });

    it('should handle errors gracefully', async () => {
      (prismaService.oAuthToken.findFirst as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.handleAccountUpdateCallback('1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to update profile');
    });
  });

  describe('getOAuthTokenForGithub', () => {
    it('should return decrypted GitHub token', async () => {
      const githubToken = {
        id: 'github-token-id',
        userId: '1',
        provider: 'github',
        accessToken: 'encrypted-github-token',
        scope: 'repo,user',
        tokenType: 'Bearer',
        isActive: true,
        createdAt: new Date(),
      };

      (prismaService.oAuthToken.findFirst as jest.Mock).mockResolvedValue(
        githubToken,
      );
      (oauthService.decryptToken as jest.Mock).mockReturnValue(
        'decrypted-github-token',
      );

      const result = await service.getOAuthTokenForGithub('1');

      expect(result.accessToken).toBe('decrypted-github-token');
      expect(result.scope).toBe('repo,user');
      expect(prismaService.oAuthToken.findFirst).toHaveBeenCalledWith({
        where: {
          userId: '1',
          provider: 'github',
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should throw if GitHub token not connected', async () => {
      (prismaService.oAuthToken.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getOAuthTokenForGithub('1')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
