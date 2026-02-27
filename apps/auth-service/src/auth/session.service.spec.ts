import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from './session.service';
import { RedisService } from '../redis/redis.service';

describe('SessionService', () => {
  let service: SessionService;
  let redisService: jest.Mocked<RedisService>;

  const mockRedisService = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    redisService = module.get(RedisService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveSessionData', () => {
    it('should save session data in Redis with default TTL', async () => {
      const token = 'refresh-token-123';
      const userId = 'user-id-456';
      const oauthTokenId = 'oauth-token-id-789';

      await service.saveSessionData(token, userId, oauthTokenId);

      expect(redisService.set).toHaveBeenCalledWith(
        `refresh_token:${token}`,
        JSON.stringify({ userId, oauthTokenId }),
        7 * 24 * 60 * 60, // 7 days default
      );
    });

    it('should save session data with custom TTL', async () => {
      const token = 'refresh-token-123';
      const userId = 'user-id-456';
      const oauthTokenId = 'oauth-token-id-789';
      const customTtl = 3600; // 1 hour

      await service.saveSessionData(token, userId, oauthTokenId, customTtl);

      expect(redisService.set).toHaveBeenCalledWith(
        `refresh_token:${token}`,
        JSON.stringify({ userId, oauthTokenId }),
        customTtl,
      );
    });

    it('should store correct JSON payload', async () => {
      const token = 'token-123';
      const userId = 'user-123';
      const oauthTokenId = 'oauth-123';

      await service.saveSessionData(token, userId, oauthTokenId);

      const callArgs = redisService.set.mock.calls[0];
      const storedPayload = JSON.parse(callArgs[1]);

      expect(storedPayload).toEqual({
        userId,
        oauthTokenId,
      });
    });

    it('should use correct Redis key format', async () => {
      const token = 'specific-refresh-token';
      const userId = 'user-id';
      const oauthTokenId = 'oauth-id';

      await service.saveSessionData(token, userId, oauthTokenId);

      const key = redisService.set.mock.calls[0][0];
      expect(key).toBe(`refresh_token:${token}`);
    });

    it('should handle multiple session saves independently', async () => {
      const session1 = {
        token: 'token-1',
        userId: 'user-1',
        oauthTokenId: 'oauth-1',
      };
      const session2 = {
        token: 'token-2',
        userId: 'user-2',
        oauthTokenId: 'oauth-2',
      };

      await service.saveSessionData(
        session1.token,
        session1.userId,
        session1.oauthTokenId,
      );
      await service.saveSessionData(
        session2.token,
        session2.userId,
        session2.oauthTokenId,
      );

      expect(redisService.set).toHaveBeenCalledTimes(2);
      expect(redisService.set).toHaveBeenNthCalledWith(
        1,
        `refresh_token:${session1.token}`,
        JSON.stringify({
          userId: session1.userId,
          oauthTokenId: session1.oauthTokenId,
        }),
        7 * 24 * 60 * 60,
      );
      expect(redisService.set).toHaveBeenNthCalledWith(
        2,
        `refresh_token:${session2.token}`,
        JSON.stringify({
          userId: session2.userId,
          oauthTokenId: session2.oauthTokenId,
        }),
        7 * 24 * 60 * 60,
      );
    });
  });

  describe('getSessionData', () => {
    it('should retrieve session data from Redis', async () => {
      const token = 'refresh-token-123';
      const sessionData = { userId: 'user-456', oauthTokenId: 'oauth-789' };

      (redisService.get as jest.Mock).mockResolvedValue(
        JSON.stringify(sessionData),
      );

      const result = await service.getSessionData(token);

      expect(result).toEqual(sessionData);
      expect(redisService.get).toHaveBeenCalledWith(`refresh_token:${token}`);
    });

    it('should return null when session not found', async () => {
      const token = 'non-existent-token';

      (redisService.get as jest.Mock).mockResolvedValue(null);

      const result = await service.getSessionData(token);

      expect(result).toBeNull();
    });

    it('should return null for invalid JSON data', async () => {
      const token = 'refresh-token-123';

      (redisService.get as jest.Mock).mockResolvedValue('invalid-json{');

      const result = await service.getSessionData(token);

      expect(result).toBeNull();
    });

    it('should handle empty string gracefully', async () => {
      const token = 'refresh-token-123';

      (redisService.get as jest.Mock).mockResolvedValue('');

      const result = await service.getSessionData(token);

      expect(result).toBeNull();
    });

    it('should parse complex session data correctly', async () => {
      const token = 'complex-token';
      const sessionData = {
        userId: 'user-with-dashes-123-456',
        oauthTokenId: 'oauth-token-id-with-special-chars_789',
      };

      (redisService.get as jest.Mock).mockResolvedValue(
        JSON.stringify(sessionData),
      );

      const result = await service.getSessionData(token);

      expect(result).toEqual(sessionData);
    });

    it('should not throw on malformed JSON', async () => {
      const token = 'token';

      (redisService.get as jest.Mock).mockResolvedValue(
        '{"userId": "user", invalid}',
      );

      await expect(service.getSessionData(token)).resolves.toBeNull();
    });
  });

  describe('deleteSession', () => {
    it('should delete session from Redis', async () => {
      const token = 'refresh-token-123';

      await service.deleteSession(token);

      expect(redisService.del).toHaveBeenCalledWith(`refresh_token:${token}`);
    });

    it('should use correct Redis key format', async () => {
      const token = 'specific-token-456';

      await service.deleteSession(token);

      const key = redisService.del.mock.calls[0][0];
      expect(key).toBe(`refresh_token:${token}`);
    });

    it('should handle deletion of non-existent session', async () => {
      const token = 'non-existent-token';

      (redisService.del as jest.Mock).mockResolvedValue(0);

      await service.deleteSession(token);

      expect(redisService.del).toHaveBeenCalledWith(`refresh_token:${token}`);
    });

    it('should delete multiple sessions independently', async () => {
      const token1 = 'token-1';
      const token2 = 'token-2';

      await service.deleteSession(token1);
      await service.deleteSession(token2);

      expect(redisService.del).toHaveBeenCalledTimes(2);
      expect(redisService.del).toHaveBeenNthCalledWith(
        1,
        `refresh_token:${token1}`,
      );
      expect(redisService.del).toHaveBeenNthCalledWith(
        2,
        `refresh_token:${token2}`,
      );
    });
  });

  describe('saveOAuthState', () => {
    it('should save OAuth state with default TTL', async () => {
      const state = 'state-123-abc';
      const provider = 'keycloak';

      await service.saveOAuthState(state, provider);

      expect(redisService.set).toHaveBeenCalledWith(
        `oauth_state:${state}`,
        provider,
        300, // 5 minutes default
      );
    });

    it('should save OAuth state with custom TTL', async () => {
      const state = 'state-456-def';
      const provider = 'github';
      const customTtl = 600; // 10 minutes

      await service.saveOAuthState(state, provider, customTtl);

      expect(redisService.set).toHaveBeenCalledWith(
        `oauth_state:${state}`,
        provider,
        customTtl,
      );
    });

    it('should use correct Redis key format', async () => {
      const state = 'specific-state-value';
      const provider = 'keycloak';

      await service.saveOAuthState(state, provider);

      const key = redisService.set.mock.calls[0][0];
      expect(key).toBe(`oauth_state:${state}`);
    });

    it('should store provider correctly', async () => {
      const state = 'state-123';
      const provider = 'custom-provider';

      await service.saveOAuthState(state, provider);

      const callArgs = redisService.set.mock.calls[0];
      expect(callArgs[1]).toBe(provider);
    });

    it('should handle long state values', async () => {
      const state = 'a'.repeat(256); // Very long state
      const provider = 'keycloak';

      await service.saveOAuthState(state, provider);

      const key = redisService.set.mock.calls[0][0];
      expect(key).toBe(`oauth_state:${state}`);
    });

    it('should save multiple OAuth states independently', async () => {
      const state1 = 'state-1';
      const state2 = 'state-2';
      const provider1 = 'keycloak';
      const provider2 = 'github';

      await service.saveOAuthState(state1, provider1);
      await service.saveOAuthState(state2, provider2);

      expect(redisService.set).toHaveBeenCalledTimes(2);
      expect(redisService.set).toHaveBeenNthCalledWith(
        1,
        `oauth_state:${state1}`,
        provider1,
        300,
      );
      expect(redisService.set).toHaveBeenNthCalledWith(
        2,
        `oauth_state:${state2}`,
        provider2,
        300,
      );
    });
  });

  describe('removeOAuthState', () => {
    it('should remove OAuth state from Redis', async () => {
      const state = 'state-123-abc';

      await service.removeOAuthState(state);

      expect(redisService.del).toHaveBeenCalledWith(`oauth_state:${state}`);
    });

    it('should use correct Redis key format', async () => {
      const state = 'specific-state-value';

      await service.removeOAuthState(state);

      const key = redisService.del.mock.calls[0][0];
      expect(key).toBe(`oauth_state:${state}`);
    });

    it('should handle removal of non-existent state', async () => {
      const state = 'non-existent-state';

      (redisService.del as jest.Mock).mockResolvedValue(0);

      await service.removeOAuthState(state);

      expect(redisService.del).toHaveBeenCalledWith(`oauth_state:${state}`);
    });

    it('should remove multiple OAuth states independently', async () => {
      const state1 = 'state-1';
      const state2 = 'state-2';

      await service.removeOAuthState(state1);
      await service.removeOAuthState(state2);

      expect(redisService.del).toHaveBeenCalledTimes(2);
      expect(redisService.del).toHaveBeenNthCalledWith(
        1,
        `oauth_state:${state1}`,
      );
      expect(redisService.del).toHaveBeenNthCalledWith(
        2,
        `oauth_state:${state2}`,
      );
    });
  });

  describe('Integration scenarios', () => {
    it('should save and retrieve session data', async () => {
      const token = 'token-123';
      const userId = 'user-123';
      const oauthTokenId = 'oauth-123';
      const sessionData = { userId, oauthTokenId };

      (redisService.get as jest.Mock).mockResolvedValue(
        JSON.stringify(sessionData),
      );

      await service.saveSessionData(token, userId, oauthTokenId);
      const result = await service.getSessionData(token);

      expect(redisService.set).toHaveBeenCalled();
      expect(result).toEqual(sessionData);
    });

    it('should save state and later remove it', async () => {
      const state = 'state-123';
      const provider = 'keycloak';

      await service.saveOAuthState(state, provider);
      await service.removeOAuthState(state);

      expect(redisService.set).toHaveBeenCalledWith(
        `oauth_state:${state}`,
        provider,
        300,
      );
      expect(redisService.del).toHaveBeenCalledWith(`oauth_state:${state}`);
    });

    it('should handle session save and delete flow', async () => {
      const token = 'session-token';
      const userId = 'user-id';
      const oauthTokenId = 'oauth-id';

      await service.saveSessionData(token, userId, oauthTokenId);
      await service.deleteSession(token);

      expect(redisService.set).toHaveBeenCalled();
      expect(redisService.del).toHaveBeenCalledWith(`refresh_token:${token}`);
    });
  });
});
