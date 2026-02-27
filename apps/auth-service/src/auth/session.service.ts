import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Save session data in Redis with a TTL (default 7 days)
   * @param token - the refresh token to associate with the session
   * @param userId - the ID of the user associated with the session
   * @param oauthTokenId - the ID of the associated OAuth token (for revocation tracking)
   * @param ttlSeconds - time to live in seconds (default 7 days)
   */
  public async saveSessionData(
    token: string,
    userId: string,
    oauthTokenId: string,
    ttlSeconds: number = 7 * 24 * 60 * 60,
  ): Promise<void> {
    await this.redisService.set(
      `refresh_token:${token}`,
      JSON.stringify({ userId, oauthTokenId }),
      ttlSeconds,
    );
  }

  /**
   * Retrieve session data from Redis using the refresh token
   * @param token - the refresh token associated with the session
   * @returns an object containing userId and oauthTokenId, or null if not found/invalid
   */
  public async getSessionData(
    token: string,
  ): Promise<{ userId: string; oauthTokenId: string } | null> {
    const sessionData = await this.redisService.get(`refresh_token:${token}`);

    if (!sessionData) {
      return null;
    }

    try {
      return JSON.parse(sessionData);
    } catch (error) {
      this.logger.error(
        `Failed to parse session data for token ${token}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Delete session data from Redis, effectively logging the user out
   * @param token - the refresh token associated with the session to delete
   */
  public async deleteSession(token: string): Promise<void> {
    await this.redisService.del(`refresh_token:${token}`);
  }

  /**
   * Remove OAuth state from Redis after it has been used or expired
   * @param state - the OAuth state value to remove
   */
  public async removeOAuthState(state: string): Promise<void> {
    await this.redisService.del(`oauth_state:${state}`);
  }

  /**
   * Save OAuth state in Redis with a TTL (default 5 minutes)
   * @param state - the unique state value to associate with the OAuth flow
   * @param provider - the OAuth provider (e.g., 'github') associated with this state
   * @param ttlSeconds - time to live in seconds (default 5 minutes)
   */
  public async saveOAuthState(
    state: string,
    provider: string,
    ttlSeconds: number = 300,
  ): Promise<void> {
    await this.redisService.set(`oauth_state:${state}`, provider, ttlSeconds);
  }
}
