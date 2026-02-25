import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import axios from 'axios';
import * as crypto from 'crypto';
import { mapRolesToPermissions } from './mappers/permissions.mapper';
import { mapRealmRolesToAppRoles } from './mappers/roles.mapper';
import { EventBus } from '@gitcode/messaging';
import { AUTH_PATTERNS, UserCreatedEvent } from '@gitcode/contracts';
import { URLSearchParams } from 'url';
import { GitHubTokenDto } from './dto/github-token.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private eventBus: EventBus,
  ) {}
  private readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';

  async initiateLogin(provider: string = 'keycloak') {
    const state = crypto.randomBytes(32).toString('hex');

    // Store state in Redis with short TTL
    await this.redis.set(`oauth_state:${state}`, provider, 300); // 5 minutes

    const keycloakConfig = this.configService.get('keycloak');
    const callbackUrl = this.configService.get('api.callbackAuthUrl');

    const authUrl = new URL(keycloakConfig.authorizationUrl);
    authUrl.searchParams.append('client_id', keycloakConfig.clientId);
    authUrl.searchParams.append('redirect_uri', callbackUrl);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'openid profile email');
    authUrl.searchParams.append('state', state);

    return { authUrl: authUrl.toString(), state };
  }

  async handleCallback(code: string) {
    // Exchange code for tokens
    const tokens = await this.exchangeCodeForTokens(code);

    // Get user info from IdP
    const userInfo = await this.getUserInfo(tokens.access_token);
    this.logger.debug(`Userinfo: ${JSON.stringify(userInfo)}`);

    // Extract and map roles
    const realmRoles = this.getRealmRoles(tokens.access_token);
    const appRoles = mapRealmRolesToAppRoles(realmRoles);
    const appPermissions = mapRolesToPermissions(realmRoles);
    this.logger.debug(
      `Mapped app permissions: ${JSON.stringify(appPermissions)}`,
    );
    this.logger.debug(`Mapped app roles: ${JSON.stringify(appRoles)}`);

    // Check if user exists, if not, publish UserCreatedEvent
    const existingUser = await this.prisma.user.findUnique({
      where: { keycloakId: userInfo.sub },
      select: { userStatus: true, id: true },
    });

    if (existingUser && existingUser.userStatus !== 'ACTIVE') {
      this.logger.warn(
        `User ${userInfo.sub} attempted login but is not active`,
      );
      throw new UnauthorizedException('User account is not active');
    }

    // Check if user existed before
    const userExists = !!existingUser;

    // Create or update user in database
    const user = await this.upsertUser(
      { ...userInfo, roles: appRoles, permissions: appPermissions },
      tokens,
    );
    // Fetch and store GitHub token if available
    await this.fetchAndStoreGitHubToken(user.id, tokens.access_token);

    if (!userExists) {
      this.logger.log(
        `Publishing UserCreatedEvent for new user ${userInfo.sub}\n With data: \n${userInfo.sub}, ${userInfo.email}, ${userInfo.given_name}, ${userInfo.family_name}`,
      );
      await this.eventBus.publish(
        AUTH_PATTERNS.USER_CREATED,
        new UserCreatedEvent(
          userInfo.sub,
          userInfo.preferred_username,
          userInfo.email,
          userInfo.given_name,
          userInfo.family_name,
        ),
      );
    }

    // Generate our own JWT access token
    const accessToken = this.generateAccessToken(user);

    // Generate and store refresh token
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  /**
   * Fetch GitHub OAuth token from Keycloak broker and store it encrypted
   * Called after user logs in through GitHub via Keycloak
   * Only fetches if token doesn't already exist in database
   */
  private async fetchAndStoreGitHubToken(
    userId: string,
    keycloakAccessToken: string,
  ): Promise<void> {
    try {
      const keycloakConfig = this.configService.get('keycloak');

      // Keycloak broker endpoint to retrieve external provider tokens
      const url = `${keycloakConfig.internalUrl}/realms/${keycloakConfig.realm}/broker/github/token`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${keycloakAccessToken}`,
        },
      });

      // Parse URL-encoded response (access_token=...&scope=...&token_type=...)
      const params = new URLSearchParams(response.data);
      const githubToken = {
        access_token: params.get('access_token'),
        refresh_token: params.get('refresh_token'),
        expires_in: params.get('expires_in')
          ? parseInt(params.get('expires_in'))
          : null,
        scope: params.get('scope'),
        token_type: params.get('token_type'),
      };

      if (githubToken.access_token) {
        this.logger.log(
          `GitHub token retrieved successfully for user ${userId}`,
        );

        // Encrypt the sensitive token before storing
        const encryptedAccessToken = this.encryptToken(
          githubToken.access_token,
        );

        // Store encrypted GitHub token in database
        await this.prisma.oAuthToken.upsert({
          where: {
            userId_provider: { userId, provider: 'github' },
          },
          update: {
            accessToken: encryptedAccessToken,
            refreshToken: null,
            expiresAt: null,
            scope: githubToken.scope,
            tokenType: githubToken.token_type || 'bearer',
          },
          create: {
            userId,
            provider: 'github',
            accessToken: encryptedAccessToken,
            refreshToken: null,
            expiresAt: null,
            scope: githubToken.scope,
            tokenType: githubToken.token_type || 'bearer',
          },
        });

        this.logger.log(`GitHub token stored (encrypted) for user ${userId}`);
      }
    } catch (error) {
      // Don't throw - user might log in without GitHub connection
      this.logger.warn(
        `Could not fetch GitHub token for user ${userId}: ${error.message}`,
      );

      if (error.response?.status === 400) {
        this.logger.debug('User probably has no GitHub identity linked');
      }
    }
  }

  private async exchangeCodeForTokens(code: string) {
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

  private async getUserInfo(accessToken: string) {
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

  /*
   * Extract realm and client roles from access token
   */
  private getRealmRoles(accessToken: string) {
    const [, payloadBase64] = accessToken.split('.');
    if (!payloadBase64) {
      return [];
    }

    const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
    const payload = JSON.parse(payloadJson);

    // const keycloakConfig = this.configService.get('keycloak');
    // const clientId = keycloakConfig.clientId;

    const realmRoles = payload.realm_access?.roles ?? [];

    return realmRoles;
  }

  private async upsertUser(userInfo: any, tokens: any) {
    this.logger.debug(`Upserting user: ${JSON.stringify(userInfo)}`);

    const user = await this.prisma.user.upsert({
      where: { keycloakId: userInfo.sub },
      update: {
        email: userInfo.email,
        username: userInfo.preferred_username,
        firstName: userInfo.given_name,
        lastName: userInfo.family_name,
        avatarUrl: userInfo.picture,
        emailVerified: userInfo.email_verified || false,
        roles: userInfo.roles,
        permissions: userInfo.permissions,
        bio: userInfo.bio,
      },
      create: {
        keycloakId: userInfo.sub,
        email: userInfo.email,
        username: userInfo.preferred_username || userInfo.email.split('@')[0],
        firstName: userInfo.given_name,
        lastName: userInfo.family_name,
        avatarUrl: userInfo.picture,
        emailVerified: userInfo.email_verified || false,
        roles: userInfo.roles,
        permissions: userInfo.permissions,
        bio: userInfo.bio,
        preferences: {
          create: {
            theme: 'LIGHT',
            language: 'en',
            privacyLevel: 'PUBLIC',
          },
        },
      },
    });

    // Store OAuth tokens (encrypted in production)
    await this.prisma.oAuthToken.upsert({
      where: {
        userId_provider: {
          userId: user.id,
          provider: 'keycloak',
        },
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
        scope: tokens.scope,
        tokenType: tokens.token_type,
      },
      create: {
        userId: user.id,
        provider: 'keycloak',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
        scope: tokens.scope,
        tokenType: tokens.token_type,
      },
    });

    return user;
  }

  private generateAccessToken(user: any) {
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
    };
    this.logger.debug(
      `Generating access token with payload: ${JSON.stringify(payload)}`,
    );

    return this.jwtService.sign(payload, {
      secret: this.configService.get('jwt.secret'),
      expiresIn: this.configService.get('jwt.accessExpiresIn'),
    });
  }

  private async generateRefreshToken(userId: string) {
    const token = crypto.randomBytes(64).toString('hex');

    await this.redis.set(`refresh_token:${token}`, userId, 7 * 24 * 60 * 60);

    return token;
  }

  async refreshTokens(refreshToken: string) {
    // Find in Redis
    const userId = await this.redis.get(`refresh_token:${refreshToken}`);

    if (!userId) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Token rotation (dlete old one)
    await this.redis.del(`refresh_token:${refreshToken}`);

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    this.logger.debug(`User found for refresh token: ${JSON.stringify(user)}`);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user is active
    if (user.userStatus !== 'ACTIVE') {
      throw new UnauthorizedException('User account is not active');
    }

    // Generate new tokens
    const accessToken = this.generateAccessToken(user);
    const newRefreshToken = await this.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  async logout(refreshToken: string) {
    try {
      const userId = await this.redis.get(`refresh_token:${refreshToken}`);

      if (!userId) {
        this.logger.warn('User ID not found for refresh token');
        return;
      }

      // Get keycloak access token
      const oauthToken = await this.prisma.oAuthToken.findUnique({
        where: {
          userId_provider: {
            userId,
            provider: 'keycloak',
          },
        },
      });

      if (oauthToken?.refreshToken) {
        const keycloakConfig = this.configService.get('keycloak');
        const logoutUrl = `${keycloakConfig.internalUrl}/realms/${keycloakConfig.realm}/protocol/openid-connect/logout`;

        await axios.post(
          logoutUrl,
          new URLSearchParams({
            client_id: keycloakConfig.clientId,
            client_secret: keycloakConfig.clientSecret,
            refresh_token: oauthToken.refreshToken,
          }),
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          },
        );

        this.logger.log(
          `Successfully logged out from Keycloak for user ${userId}`,
        );
      }

      await this.redis.del(`refresh_token:${refreshToken}`);
    } catch (error) {
      this.logger.warn(`Failed to logout from Keycloak: ${error.message}`);
      await this.redis.del(`refresh_token:${refreshToken}`);
    }
  }

  async validateUser(userId: string) {
    this.logger.debug(`Validating user (auth service): ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        permissions: true,
        roles: true,
        userStatus: true,
      },
    });

    if (!user) {
      this.logger.log(`User ${userId} not found`);

      throw new UnauthorizedException('User not found');
    }

    if (user.userStatus !== 'ACTIVE') {
      throw new UnauthorizedException('User account is not active');
    }

    this.logger.log(`User ${userId} validated successfully (auth service)`);
    return user;
  }

  /*
   * Initiate account update by redirecting to Keycloak account management
   */
  async initiateAccountUpdate() {
    this.logger.debug('Initiating account update process');
    const keycloakConfig = this.configService.get('keycloak');

    // Create account management URL
    const accountUpdateUrl = new URL(
      `${keycloakConfig.url}/realms/${keycloakConfig.realm}/account`,
    );

    const callbackUrl = this.configService.get('api.callbackAccountUrl');

    accountUpdateUrl.searchParams.append('referrer', keycloakConfig.clientId); // Client ID as referrer
    accountUpdateUrl.searchParams.append('referrer_uri', callbackUrl); // Redirect back after update
    return { accountUpdateUrl: accountUpdateUrl.toString() };
  }

  /*
   * Handle account update callback from Keycloak
   */
  async handleAccountUpdateCallback(userId: string) {
    try {
      // Retrieve stored OAuth tokens for the user
      const oauthToken = await this.prisma.oAuthToken.findUnique({
        where: { userId_provider: { userId, provider: 'keycloak' } },
      });

      // If no tokens found, cannot refresh profile
      if (!oauthToken) {
        this.logger.warn(
          `No OAuth token found for user ${userId}, cannot refresh profile`,
        );
        return { message: 'Failed to update profile', success: false };
      }

      // Fetch updated user info using the access token
      const userInfo = await this.getUserInfo(oauthToken.accessToken);

      // Update user profile in the database
      const tokens = {
        access_token: oauthToken.accessToken,
        refresh_token: oauthToken.refreshToken,
        expires_in: oauthToken.expiresAt
          ? Math.floor((oauthToken.expiresAt.getTime() - Date.now()) / 1000)
          : null,
        scope: oauthToken.scope,
        token_type: oauthToken.tokenType,
      };
      await this.upsertUser(userInfo, tokens);

      return { message: 'Profile updated successfully', success: true };
    } catch (error) {
      this.logger.error('Account update callback error:', error);
      return { message: 'Failed to update profile', success: false };
    }
  }

  /**
   * Get decrypted GitHub OAuth token for a user (internal service use)
   * Called by github-service to perform GitHub API operations
   */
  async getOAuthTokenForGithub(userId: string): Promise<GitHubTokenDto> {
    const oauthToken = await this.prisma.oAuthToken.findUnique({
      where: { userId_provider: { userId, provider: 'github' } },
    });

    // If no token found, user has not connected GitHub
    if (!oauthToken) {
      throw new UnauthorizedException(
        'GitHub account not connected. Please connect your GitHub account first.',
      );
    }

    // Decrypt tokens before returning
    const decryptedAccessToken = this.decryptToken(oauthToken.accessToken);

    return {
      accessToken: decryptedAccessToken,
      scope: oauthToken.scope,
      tokenType: oauthToken.tokenType,
    };
  }

  /**
   * Encrypt sensitive token data using AES-256-GCM
   */
  private encryptToken(token: string): string {
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
   * Decrypt token encrypted with encryptToken()
   */
  private decryptToken(encryptedToken: string): string {
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
}
