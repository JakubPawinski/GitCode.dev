import {
  Injectable,
  UnauthorizedException,
  Logger,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { mapRolesToPermissions } from '../mappers/permissions.mapper';
import { mapRealmRolesToAppRoles } from '../mappers/roles.mapper';
import { EventBus } from '@gitcode/messaging';
import { AUTH_PATTERNS, UserCreatedEvent } from '@gitcode/contracts';
import { GitHubTokenDto } from '../dto/github-token.dto';
import { OauthService } from './oauth.service';
import { SessionService } from './session.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { AppPermissions, AppRoles, UUID } from '@gitcode/types';
import { TokenName } from '../../shared/enums/nest-token.enum.ts';
import { PrismaClient } from '@prisma/client/extension';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @Inject(TokenName.PRISMA_CONNECTION) private prisma: PrismaClient,
    private jwtService: JwtService,
    private configService: ConfigService,
    private eventBus: EventBus,
    private oauthService: OauthService,
    private sessionService: SessionService,
  ) {}

  /**
   * Initiates the OAuth login process
   * @param provider - OAuth provider
   * @returns - Authorization URL and state for CSRF protection
   */
  async initiateLogin(provider: string = 'keycloak') {
    const state = crypto.randomBytes(32).toString('hex');

    await this.sessionService.saveOAuthState(state, provider);

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

  /**
   * Handle the OAuth callback after user authentication
   * @param code - the authorization code received from Keycloak after user login
   * @returns - an object containing the access token, refresh token, and user info
   */
  async handleCallback(code: string) {
    // Exchange code for tokens
    const tokens = await this.oauthService.exchangeCodeForTokens(code);
    const userInfo = await this.oauthService.getUserInfo(tokens.access_token);

    // Extract roles and permissions from Keycloak token and map to app's roles
    const realmRoles = this.oauthService.getRealmRoles(tokens.access_token);
    const appRoles = mapRealmRolesToAppRoles(realmRoles);
    const appPermissions = mapRolesToPermissions(realmRoles);

    this.logger.debug(
      `User info retrieved from Keycloak: ${JSON.stringify(userInfo)}`,
    );
    this.logger.debug(
      `Mapped app permissions: ${JSON.stringify(appPermissions)}`,
    );
    this.logger.debug(`Mapped app roles: ${JSON.stringify(appRoles)}`);

    // Check if user exists and is active before proceeding
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

    const userExists = !!existingUser;
    const { user, oAuthToken } = await this.upsertUser(
      { ...userInfo, roles: appRoles, permissions: appPermissions },
      tokens,
    );

    // Fetch and store GitHub token if available
    await this.storeGitHubTokenIfAvailable(user.id, tokens.access_token);

    // Publish UserCreatedEvent if this is a new user
    if (!userExists) {
      this.logger.log(
        `Publishing UserCreatedEvent for new user ${userInfo.sub}\n With data: \n${userInfo.sub}, ${userInfo.email}, ${userInfo.given_name}, ${userInfo.family_name}`,
      );
      await this.eventBus.publish(
        AUTH_PATTERNS.USER_CREATED,
        new UserCreatedEvent(
          user.id,
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
    const refreshToken = await this.generateRefreshToken(
      user.id,
      oAuthToken.id,
    );

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
   * Fetch and store the GitHub OAuth token from the Keycloak broker, if available.
   * @param userId - the ID of the user in our database for whom the token is stored
   * @param keycloakAccessToken - the Keycloak access token used to request the GitHub token from the broker
   */
  private async storeGitHubTokenIfAvailable(
    userId: string,
    keycloakAccessToken: string,
  ): Promise<void> {
    const githubToken =
      await this.oauthService.fetchGitHubTokenFromBroker(keycloakAccessToken);
    if (!githubToken?.access_token) return;

    // Encrypt the GitHub access token before storing it in the database
    const encryptedToken = this.oauthService.encryptToken(
      githubToken.access_token,
    );

    await this.prisma.oAuthToken.upsert({
      where: {
        userId_provider: {
          userId: userId,
          provider: 'github',
        },
      },
      update: {
        userId,
        provider: 'github',
        accessToken: encryptedToken,
        isActive: true,
        revokedAt: null,
        updatedAt: new Date(),
        scope: githubToken.scope,
        tokenType: githubToken.token_type || 'bearer',
      },
      create: {
        userId,
        provider: 'github',
        accessToken: encryptedToken,
        refreshToken: null,
        expiresAt: null,
        scope: githubToken.scope,
        tokenType: githubToken.token_type || 'bearer',
      },
    });

    this.logger.log(`GitHub token stored for user ${userId}`);
  }

  /**
   * Upsert user in the database based on Keycloak user info and store OAuth tokens
   * @param userInfo - the user information retrieved from Keycloak's userinfo endpoint
   * @param tokens - the access and refresh tokens received from Keycloak after authentication
   * @returns - the upserted user and the stored OAuth token record
   */
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

    // Keycloak tokens are not encrypted, unlike Github tokens
    const oAuthToken = await this.prisma.oAuthToken.upsert({
      where: {
        userId_provider: {
          userId: user.id,
          provider: 'keycloak',
        },
      },
      update: {
        userId: user.id,
        provider: 'keycloak',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
        scope: tokens.scope,
        tokenType: tokens.token_type,
        isActive: true,
        revokedAt: null,
        updatedAt: new Date(),
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

    return { user, oAuthToken };
  }

  /**
   * Generate a JWT access token for the authenticated user
   * @param user - the user object for whom to generate the token
   * @returns - a signed JWT access token containing user info and claims
   */
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

  /**
   * Generate a secure random refresh token, store it in Redis
   * @param userId - the ID of the user for whom to generate the refresh token
   * @param oauthTokenId - the ID of the associated OAuth token (for revocation tracking)
   * @returns - a securely generated random refresh token string
   */
  private async generateRefreshToken(userId: string, oauthTokenId: string) {
    const token = crypto.randomBytes(64).toString('hex');
    await this.sessionService.saveSessionData(token, userId, oauthTokenId);
    return token;
  }

  /**
   * Validate and refresh an existing session using a refresh token
   * @param userId - the ID of the user for whom to generate the refresh token
   * @param oauthTokenId - the ID of the associated OAuth token (for revocation tracking)
   * @returns - a securely generated random refresh token string
   */
  public async refreshTokens(refreshToken: string) {
    const sessionData = await this.sessionService.getSessionData(refreshToken);

    if (!sessionData) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Delete the old session
    await this.sessionService.deleteSession(refreshToken);

    // Validate the associated OAuth token is still active before proceeding
    const oauthToken = await this.getActiveOAuthToken(sessionData.oauthTokenId);

    if (!oauthToken || oauthToken.userId !== sessionData.userId) {
      this.logger.warn(
        `OAuth token not found or inactive for refresh token: ${refreshToken}`,
      );
      throw new UnauthorizedException('Invalid refresh token session');
    }

    // Get user
    const user = await this.validateUser(sessionData.userId);

    let newKeycloakTokens: any;
    try {
      newKeycloakTokens = await this.oauthService.exchangeRefreshTokenForTokens(
        oauthToken.refreshToken,
      );
    } catch (error) {
      this.logger.warn(
        `Keycloak rejected refresh token for user ${sessionData.userId}. Marking session as inactive.`,
      );

      await this.prisma.oAuthToken.update({
        where: { id: sessionData.oauthTokenId },
        data: { isActive: false, revokedAt: new Date() },
      });

      throw new UnauthorizedException(
        'Session expired or user disabled in Identity Provider',
      );
    }

    // Fetch user data and sync with keycloak
    const userInfo = await this.oauthService.getUserInfo(
      newKeycloakTokens.access_token,
    );
    const realmRoles = this.oauthService.getRealmRoles(
      newKeycloakTokens.access_token,
    );
    const appRoles = mapRealmRolesToAppRoles(realmRoles);
    const appPermissions = mapRolesToPermissions(realmRoles);

    const userDataToUpdate: UpdateUserDto = this.mapUserInfoToUpdate(
      userInfo,
      appRoles,
      appPermissions,
    );

    const updatedUser = await this.updateUser(user.id, userDataToUpdate);

    await this.prisma.oAuthToken.update({
      where: { id: sessionData.oauthTokenId },
      data: {
        accessToken: newKeycloakTokens.access_token,
        refreshToken: newKeycloakTokens.refresh_token,
        expiresAt: newKeycloakTokens.expires_in
          ? new Date(Date.now() + newKeycloakTokens.expires_in * 1000)
          : null,
        scope: newKeycloakTokens.scope,
        tokenType: newKeycloakTokens.token_type,
      },
    });

    // Generate new tokens
    const accessToken = this.generateAccessToken(updatedUser);
    const newRefreshToken = await this.generateRefreshToken(
      sessionData.userId,
      sessionData.oauthTokenId,
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        avatarUrl: updatedUser.avatarUrl,
      },
    };
  }

  /**
   * Logout the user by revoking the refresh token in Keycloak and deleting the session in Redis
   * @param refreshToken - the refresh token associated with the user's session to be logged out
   */
  async logout(refreshToken: string) {
    try {
      const sessionData =
        await this.sessionService.getSessionData(refreshToken);

      if (!sessionData) {
        this.logger.warn('Session data not found for refresh token');
        return;
      }

      const { userId, oauthTokenId } = sessionData;

      const oauthToken = await this.prisma.oAuthToken.findUnique({
        where: { id: oauthTokenId },
      });

      if (oauthToken?.refreshToken) {
        await this.oauthService.logoutFromKeycloak(oauthToken.refreshToken);

        this.logger.log(
          `Successfully logged out from Keycloak for user ${userId}`,
        );
      }

      await this.prisma.oAuthToken.update({
        where: { id: oauthTokenId },
        data: {
          revokedAt: new Date(),
          isActive: false,
        },
      });

      await this.sessionService.deleteSession(refreshToken);
    } catch (error) {
      this.logger.warn(`Failed to logout from Keycloak: ${error.message}`);
      await this.sessionService.deleteSession(refreshToken);
    }
  }

  /**
   * Validate the user by their ID, ensuring they exist and are active
   * @param userId - the ID of the user to validate
   */
  async validateUser(userId: string) {
    this.logger.debug(`Validating user (auth service): ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
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

  /**
   * Initiate the account update process by generating a Keycloak account management URL
   * @returns - an object containing the account management URL for the user to update their profile in Keycloak
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

  /**
   * Handle the account update callback by refreshing the user's profile data from Keycloak after they update their account information
   * @param userId - the ID of the user whose account was updated
   */
  async handleAccountUpdateCallback(userId: string) {
    try {
      // Retrieve stored OAuth tokens for the user
      const oauthToken = await this.prisma.oAuthToken.findFirst({
        where: {
          userId,
          provider: 'keycloak',
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      // If no tokens found, cannot refresh profile
      if (!oauthToken) {
        this.logger.warn(
          `No OAuth token found for user ${userId}, cannot refresh profile`,
        );
        return { message: 'Failed to update profile', success: false };
      }

      // Fetch updated user info using the access token
      const userInfo = await this.oauthService.getUserInfo(
        oauthToken.accessToken,
      );

      // Extract roles and permissions from Keycloak token and map to app's roles
      const realmRoles = this.oauthService.getRealmRoles(
        oauthToken.accessToken,
      );
      const appRoles = mapRealmRolesToAppRoles(realmRoles);
      const appPermissions = mapRolesToPermissions(realmRoles);

      const userDataToUpdate: UpdateUserDto = this.mapUserInfoToUpdate(
        userInfo,
        appRoles,
        appPermissions,
      );

      // Update user profile in the database
      await this.updateUser(userId, userDataToUpdate);

      return { message: 'Profile updated successfully', success: true };
    } catch (error) {
      this.logger.error('Account update callback error:', error);
      return { message: 'Failed to update profile', success: false };
    }
  }

  /**
   * Retrieve the GitHub OAuth token for the user, decrypting it before returning
   * @param userId - the ID of the user for whom to retrieve the GitHub token
   * @return - an GithubTokenDto containing the decrypted access token and related info, or throws an exception if not found/invalid
   */
  async getOAuthTokenForGithub(userId: string): Promise<GitHubTokenDto> {
    const oauthToken = await this.prisma.oAuthToken.findFirst({
      where: {
        userId,
        provider: 'github',
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!oauthToken) {
      throw new UnauthorizedException(
        'GitHub account not connected. Please connect your GitHub account first.',
      );
    }

    const decryptedAccessToken = this.oauthService.decryptToken(
      oauthToken.accessToken,
    );

    return {
      accessToken: decryptedAccessToken,
      scope: oauthToken.scope,
      tokenType: oauthToken.tokenType,
    };
  }

  /**
   * Helper method to get the active Oauth token
   * @param oauthTokenId - the ID of the OAuth token to validate
   * @returns the OAuth token record
   */
  private async getActiveOAuthToken(oauthTokenId: string) {
    const oauthToken = await this.prisma.oAuthToken.findFirst({
      where: { id: oauthTokenId, isActive: true },
    });
    if (!oauthToken) {
      this.logger.warn(`Active OAuth token not found with ID: ${oauthTokenId}`);
      return null
    }
    return oauthToken;
  }

  /**
   * Update the user record in the database
   * @param userId - the ID of the user to update
   * @param updateUserDto - the updated user information to save in the database
   * @returns
   */
  private async updateUser(userId: UUID, updateUserDto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        email: updateUserDto.email,
        username: updateUserDto.username,
        firstName: updateUserDto.firstName,
        lastName: updateUserDto.lastName,
        avatarUrl: updateUserDto.avatarUrl,
        emailVerified: updateUserDto.emailVerified,
        roles: updateUserDto.roles,
        permissions: updateUserDto.permissions,
      },
    });
  }

  /**
   * Maps user information to the update DTO
   * @param userInfo - the user information from the OAuth provider
   * @param appRoles - the mapped application roles
   * @param appPermissions - the mapped application permissions
   * @returns the updated user DTO
   */
  private mapUserInfoToUpdate(
    userInfo: any,
    appRoles: AppRoles,
    appPermissions: AppPermissions,
  ): UpdateUserDto {
    return {
      email: userInfo.email,
      username: userInfo.preferred_username,
      firstName: userInfo.given_name,
      lastName: userInfo.family_name,
      avatarUrl: userInfo.picture,
      emailVerified: userInfo.email_verified || false,
      roles: appRoles,
      permissions: appPermissions,
    };
  }
}
