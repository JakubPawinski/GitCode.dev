import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class OauthService {
  private readonly logger = new Logger(OauthService.name);
  private readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';

  constructor(private readonly configService: ConfigService) {}

  /**
   * Exchange the authorization code for access and refresh tokens from Keycloak
   * @param code - the authorization code received from Keycloak after user login
   * @returns an object containing the access token, refresh token, and related info, or throws an exception on failure
   */
  public async exchangeCodeForTokens(code: string) {
    const keycloakConfig = this.configService.get('keycloak');
    const callbackUrl = this.configService.get('api.callbackAuthUrl');

    try {
      const response = await axios.post(
        keycloakConfig.tokenUrl,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: callbackUrl,
          client_id: keycloakConfig.clientId,
          client_secret: keycloakConfig.clientSecret,
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error('Token exchange error', error);

      // Provide specific error messages
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.error === 'invalid_grant') {
          throw new UnauthorizedException(
            'Authorization code expired or already used. Please try logging in again.',
          );
        }
      }

      throw new UnauthorizedException('Failed to exchange code for tokens');
    }
  }

  /**
   * Exchange a Keycloak refresh token for new access and refresh tokens
   * @param keycloakRefreshToken - the refresh token issued by Keycloak
   * @returns an object containing the new tokens and related info, or throws an exception on failure
   */
  public async exchangeRefreshTokenForTokens(keycloakRefreshToken: string) {
    const keycloakConfig = this.configService.get('keycloak');

    try {
      const response = await axios.post(
        keycloakConfig.tokenUrl,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: keycloakRefreshToken,
          client_id: keycloakConfig.clientId,
          client_secret: keycloakConfig.clientSecret,
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error('Refresh token exchange error', error);
      throw new UnauthorizedException('Failed to refresh tokens');
    }
  }

  /**
   * Logout from Keycloak by revoking the refresh token
   * @param refreshToken - the refresh token to revoke in Keycloak
   */
  public async logoutFromKeycloak(refreshToken: string): Promise<void> {
    try {
      const keycloakConfig = this.configService.get('keycloak');
      const logoutUrl = `${keycloakConfig.internalUrl}/realms/${keycloakConfig.realm}/protocol/openid-connect/logout`;

      await axios.post(
        logoutUrl,
        new URLSearchParams({
          client_id: keycloakConfig.clientId,
          client_secret: keycloakConfig.clientSecret,
          refresh_token: refreshToken,
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );

      this.logger.log('Successfully logged out from Keycloak');
    } catch (error) {
      this.logger.warn(`Failed to logout from Keycloak: ${error.message}`);
    }
  }

  /**
   * Extract realm roles from the Keycloak access token
   * @param accessToken - the JWT access token issued by Keycloak
   * @returns an array of realm role names, or an empty array if none found or on error
   */
  public getRealmRoles(accessToken: string): string[] {
    try {
      const [, payloadBase64] = accessToken.split('.');
      if (!payloadBase64) return [];

      const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
      const payload = JSON.parse(payloadJson);
      return payload.realm_access?.roles ?? [];
    } catch (error) {
      this.logger.error('Failed to extract realm roles', error);
      return [];
    }
  }

  /**
   * Enrypt the given token using AES-256-GCM
   * @param token - the plaintext token to encrypt
   * @returns the encrypted token in the format iv:authTag:encrypted
   * @throws Error if encryption fails or if the ENCRYPTION_KEY is not properly configured
   */
  public encryptToken(token: string): string {
    try {
      const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');

      if (!encryptionKey || encryptionKey.length !== 64) {
        throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
      }

      const key = Buffer.from(encryptionKey, 'hex');
      const iv = crypto.randomBytes(16);

      const cipher = crypto.createCipheriv(this.ENCRYPTION_ALGORITHM, key, iv);
      let encrypted = cipher.update(token, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      // Format: iv:authTag:encrypted
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      this.logger.error('Token encryption failed', error);
      throw new Error('Failed to encrypt token');
    }
  }

  /**
   * Decrypt the encrypted token using AES-256-GCM
   * @param encryptedToken - the token string in the format iv:authTag:encrypted
   * @throws Error if decryption fails or if the input format is invalid
   */
  public decryptToken(encryptedToken: string): string {
    try {
      const [ivHex, authTagHex, encrypted] = encryptedToken.split(':');

      if (!ivHex || !authTagHex || !encrypted) {
        throw new Error('Invalid encrypted token format');
      }

      const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');

      if (!encryptionKey || encryptionKey.length !== 64) {
        throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
      }

      const key = Buffer.from(encryptionKey, 'hex');

      const decipher = crypto.createDecipheriv(
        this.ENCRYPTION_ALGORITHM,
        key,
        Buffer.from(ivHex, 'hex'),
      );

      decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error('Token decryption failed', error);
      throw new Error('Failed to decrypt token');
    }
  }

  /**
   * Fetch Github access token from Keycloak
   * @param keycloakAccessToken - the keycloak access token
   **/
  public async fetchGitHubTokenFromBroker(
    keycloakAccessToken: string,
  ): Promise<any> {
    try {
      const keycloakConfig = this.configService.get('keycloak');
      const url = `${keycloakConfig.internalUrl}/realms/${keycloakConfig.realm}/broker/github/token`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${keycloakAccessToken}` },
      });

      const params = new URLSearchParams(response.data);
      return {
        access_token: params.get('access_token'),
        refresh_token: params.get('refresh_token'),
        expires_in: params.get('expires_in')
          ? parseInt(params.get('expires_in'))
          : null,
        scope: params.get('scope'),
        token_type: params.get('token_type'),
      };
    } catch (error) {
      this.logger.warn(`Failed to fetch GitHub token: ${error.message}`);
      if (error.response?.status === 400) {
        this.logger.debug('User probably has no GitHub identity linked');
      }
      return null;
    }
  }

  /**
   * Retrieve user info from Keycloak using the access token
   * @param accessToken - the access token after keycloak authentication
   */
  public async getUserInfo(accessToken: string) {
    const keycloakConfig = this.configService.get('keycloak');

    try {
      const response = await axios.get(keycloakConfig.userInfoUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      return response.data;
    } catch (error) {
      this.logger.error('UserInfo error', error);
      throw new UnauthorizedException('Failed to get user info');
    }
  }
}
