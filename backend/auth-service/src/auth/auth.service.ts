import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import axios from 'axios';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async initiateLogin(provider: string = 'keycloak') {
    const state = crypto.randomBytes(32).toString('hex');

    // Store state in Redis with short TTL
    await this.redis.set(`oauth_state:${state}`, provider, 300); // 5 minutes

    const keycloakConfig = this.configService.get('keycloak');
    const callbackUrl = this.configService.get('api.callbackUrl');

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

    // Create or update user in database
    const user = await this.upsertUser(userInfo, tokens);

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

  private async exchangeCodeForTokens(code: string) {
    const keycloakConfig = this.configService.get('keycloak');
    const callbackUrl = this.configService.get('api.callbackUrl');

    console.log('Exchanging code for tokens...');
    console.log('Token URL:', keycloakConfig.tokenUrl);
    console.log('Callback URL:', callbackUrl);
    console.log('Code:', code.substring(0, 50) + '...');

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

      console.log('Token exchange successful!');
      console.log(
        'Access token:',
        response.data.access_token.substring(0, 50) + '...',
      );
      console.log('Token type:', response.data.token_type);
      console.log('Expires in:', response.data.expires_in);

      return response.data;
    } catch (error) {
      console.error('Token exchange error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });

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
      console.log('Fetching user info from:', keycloakConfig.userInfoUrl);
      console.log('Using access token:', accessToken.substring(0, 50) + '...');

      const response = await axios.get(keycloakConfig.userInfoUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      console.log('User info received:', response.data);
      return response.data;
    } catch (error) {
      console.error('UserInfo error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
      });
      throw new UnauthorizedException('Failed to get user info');
    }
  }

  private async upsertUser(userInfo: any, tokens: any) {
    const user = await this.prisma.user.upsert({
      where: { keycloakId: userInfo.sub },
      update: {
        email: userInfo.email,
        username: userInfo.preferred_username || userInfo.email.split('@')[0],
        firstName: userInfo.given_name,
        lastName: userInfo.family_name,
        avatarUrl: userInfo.picture,
        emailVerified: userInfo.email_verified || false,
      },
      create: {
        keycloakId: userInfo.sub,
        email: userInfo.email,
        username: userInfo.preferred_username || userInfo.email.split('@')[0],
        firstName: userInfo.given_name,
        lastName: userInfo.family_name,
        avatarUrl: userInfo.picture,
        emailVerified: userInfo.email_verified || false,
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
    };

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

    if (!user) {
      throw new UnauthorizedException('User not found');
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
    await this.redis.del(`refresh_token:${refreshToken}`);
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        emailVerified: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
