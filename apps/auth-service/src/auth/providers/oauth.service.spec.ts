import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { OauthService } from './oauth.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('OauthService', () => {
  let service: OauthService;
  let configService: jest.Mocked<ConfigService>;

  const mockKeycloakConfig = {
    tokenUrl: 'https://keycloak/token',
    userInfoUrl: 'https://keycloak/userinfo',
    internalUrl: 'https://keycloak-internal',
    realm: 'gitcode-realm',
    clientId: 'gitcode-client',
    clientSecret: 'gitcode-secret',
  };

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OauthService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<OauthService>(OauthService);
    configService = module.get(ConfigService);

    configService.get.mockImplementation((key: string) => {
      if (key === 'keycloak') return mockKeycloakConfig;
      if (key === 'api.callbackAuthUrl')
        return 'https://api.example.com/auth/callback';
      if (key === 'ENCRYPTION_KEY') return 'a'.repeat(64); // 64 hex characters = 32 bytes
      return undefined;
    });

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('exchangeCodeForTokens', () => {
    it('should exchange authorization code for tokens', async () => {
      const mockResponse = {
        data: {
          access_token: 'access-token-123',
          refresh_token: 'refresh-token-123',
          expires_in: 3600,
          scope: 'openid profile email',
          token_type: 'Bearer',
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await service.exchangeCodeForTokens('auth-code-123');

      expect(result.access_token).toBe('access-token-123');
      expect(result.refresh_token).toBe('refresh-token-123');
      expect(result.expires_in).toBe(3600);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        mockKeycloakConfig.tokenUrl,
        expect.any(URLSearchParams),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );
    });

    it('should throw UnauthorizedException when code is invalid', async () => {
      mockedAxios.post.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'invalid_grant' },
        },
      });

      await expect(
        service.exchangeCodeForTokens('invalid-code'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token exchange fails', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network error'));

      await expect(service.exchangeCodeForTokens('code')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should include correct parameters in token exchange request', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          access_token: 'token',
          refresh_token: 'refresh',
          expires_in: 3600,
        },
      });

      await service.exchangeCodeForTokens('code-123');

      const callArgs = mockedAxios.post.mock.calls[0];
      const urlSearchParams = callArgs[1] as URLSearchParams;

      expect(urlSearchParams.get('grant_type')).toBe('authorization_code');
      expect(urlSearchParams.get('code')).toBe('code-123');
      expect(urlSearchParams.get('client_id')).toBe(
        mockKeycloakConfig.clientId,
      );
      expect(urlSearchParams.get('client_secret')).toBe(
        mockKeycloakConfig.clientSecret,
      );
    });
  });

  describe('exchangeRefreshTokenForTokens', () => {
    it('should exchange refresh token for new tokens', async () => {
      const mockResponse = {
        data: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
          scope: 'openid profile email',
          token_type: 'Bearer',
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result =
        await service.exchangeRefreshTokenForTokens('refresh-token-123');

      expect(result.access_token).toBe('new-access-token');
      expect(result.refresh_token).toBe('new-refresh-token');
      expect(mockedAxios.post).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      mockedAxios.post.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'invalid_grant' },
        },
      });

      await expect(
        service.exchangeRefreshTokenForTokens('invalid-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should include refresh_token grant type in request', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          access_token: 'token',
          refresh_token: 'refresh',
          expires_in: 3600,
        },
      });

      await service.exchangeRefreshTokenForTokens('refresh-123');

      const urlSearchParams = mockedAxios.post.mock
        .calls[0][1] as URLSearchParams;

      expect(urlSearchParams.get('grant_type')).toBe('refresh_token');
      expect(urlSearchParams.get('refresh_token')).toBe('refresh-123');
    });
  });

  describe('logoutFromKeycloak', () => {
    it('should revoke refresh token in Keycloak', async () => {
      mockedAxios.post.mockResolvedValue({ data: {} });

      await service.logoutFromKeycloak('refresh-token-123');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/protocol/openid-connect/logout'),
        expect.any(URLSearchParams),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );
    });

    it('should handle logout errors gracefully', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Logout failed'));

      // Should not throw
      await expect(
        service.logoutFromKeycloak('refresh-token'),
      ).resolves.not.toThrow();
    });

    it('should include correct logout parameters', async () => {
      mockedAxios.post.mockResolvedValue({ data: {} });

      await service.logoutFromKeycloak('refresh-123');

      const urlSearchParams = mockedAxios.post.mock
        .calls[0][1] as URLSearchParams;

      expect(urlSearchParams.get('client_id')).toBe(
        mockKeycloakConfig.clientId,
      );
      expect(urlSearchParams.get('client_secret')).toBe(
        mockKeycloakConfig.clientSecret,
      );
      expect(urlSearchParams.get('refresh_token')).toBe('refresh-123');
    });
  });

  describe('getRealmRoles', () => {
    it('should extract realm roles from JWT access token', () => {
      const payload = {
        sub: 'user-id',
        realm_access: {
          roles: ['user', 'admin'],
        },
      };

      const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString(
        'base64',
      );
      const token = `header.${payloadBase64}.signature`;

      const roles = service.getRealmRoles(token);

      expect(roles).toEqual(['user', 'admin']);
    });

    it('should return empty array when no realm_access', () => {
      const payload = {
        sub: 'user-id',
      };

      const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString(
        'base64',
      );
      const token = `header.${payloadBase64}.signature`;

      const roles = service.getRealmRoles(token);

      expect(roles).toEqual([]);
    });

    it('should return empty array when payload is malformed', () => {
      const token = 'header.invalid-base64!!!.signature';

      const roles = service.getRealmRoles(token);

      expect(roles).toEqual([]);
    });

    it('should return empty array when token has no payload', () => {
      const token = 'header.signature';

      const roles = service.getRealmRoles(token);

      expect(roles).toEqual([]);
    });
  });

  describe('encryptToken', () => {
    it('should encrypt token successfully', () => {
      const plainToken = 'secret-token-12345';

      const encrypted = service.encryptToken(plainToken);

      expect(encrypted).toBeDefined();
      expect(encrypted).toMatch(/^[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/); // iv:authTag:encrypted
    });

    it('should produce different results for same input (due to random IV)', () => {
      const plainToken = 'secret-token-12345';

      const encrypted1 = service.encryptToken(plainToken);
      const encrypted2 = service.encryptToken(plainToken);

      expect(encrypted1).not.toBe(encrypted2);
    });

  });

  describe('decryptToken', () => {
    it('should decrypt token successfully', () => {
      const plainToken = 'secret-token-12345';

      const encrypted = service.encryptToken(plainToken);
      const decrypted = service.decryptToken(encrypted);

      expect(decrypted).toBe(plainToken);
    });

    it('should throw error for corrupted ciphertext', () => {
      const plainToken = 'secret-token';
      const encrypted = service.encryptToken(plainToken);

      const [iv, authTag, ciphertext] = encrypted.split(':');
      const corruptedCiphertext = encrypted.replace(
        ciphertext,
        ciphertext.slice(0, -2) + 'ff',
      );

      expect(() => service.decryptToken(corruptedCiphertext)).toThrow();
    });

    it('should encrypt and decrypt multiple tokens independently', () => {
      const token1 = 'first-secret-token';
      const token2 = 'second-secret-token';

      const encrypted1 = service.encryptToken(token1);
      const encrypted2 = service.encryptToken(token2);

      const decrypted1 = service.decryptToken(encrypted1);
      const decrypted2 = service.decryptToken(encrypted2);

      expect(decrypted1).toBe(token1);
      expect(decrypted2).toBe(token2);
    });
  });

  describe('fetchGitHubTokenFromBroker', () => {
    it('should fetch GitHub token from Keycloak broker', async () => {
      const mockGitHubToken =
        'access_token=github-token-123&scope=repo,user&token_type=bearer';

      mockedAxios.get.mockResolvedValue({
        data: mockGitHubToken,
      });

      const result = await service.fetchGitHubTokenFromBroker(
        'keycloak-access-token',
      );

      expect(result.access_token).toBe('github-token-123');
      expect(result.scope).toBe('repo,user');
      expect(result.token_type).toBe('bearer');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/broker/github/token'),
        {
          headers: {
            Authorization: 'Bearer keycloak-access-token',
          },
        },
      );
    });

    it('should return null when user has no GitHub identity linked', async () => {
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 400,
        },
      });

      const result = await service.fetchGitHubTokenFromBroker(
        'keycloak-access-token',
      );

      expect(result).toBeNull();
    });

    it('should handle fetch errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      const result = await service.fetchGitHubTokenFromBroker(
        'keycloak-access-token',
      );

      expect(result).toBeNull();
    });

    it('should include expires_in when present', async () => {
      const mockGitHubToken =
        'access_token=token&expires_in=28800&scope=repo&token_type=bearer';

      mockedAxios.get.mockResolvedValue({
        data: mockGitHubToken,
      });

      const result = await service.fetchGitHubTokenFromBroker(
        'keycloak-access-token',
      );

      expect(result.expires_in).toBe(28800);
    });
  });

  describe('getUserInfo', () => {
    it('should retrieve user info from Keycloak', async () => {
      const mockUserInfo = {
        sub: 'keycloak-user-id',
        email: 'user@example.com',
        preferred_username: 'testuser',
        given_name: 'Test',
        family_name: 'User',
        picture: 'https://example.com/avatar.jpg',
        email_verified: true,
        roles: ['user'],
      };

      mockedAxios.get.mockResolvedValue({
        data: mockUserInfo,
      });

      const result = await service.getUserInfo('access-token-123');

      expect(result).toEqual(mockUserInfo);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        mockKeycloakConfig.userInfoUrl,
        {
          headers: {
            Authorization: 'Bearer access-token-123',
          },
        },
      );
    });

    it('should throw UnauthorizedException when access token is invalid', async () => {
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 401,
        },
      });

      await expect(service.getUserInfo('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException on network errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(service.getUserInfo('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
