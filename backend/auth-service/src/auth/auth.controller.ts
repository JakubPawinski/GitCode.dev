import {
  Controller,
  Get,
  Post,
  Query,
  Res,
  Req,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import {
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  AuthResponseDto,
  UserDto,
  LogoutResponseDto,
} from './dto/auth-response.dto';
import { ApiResponseDto } from '../dto/api-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RedisService } from '../redis/redis.service';
import { AppService } from '../app.service';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly redis: RedisService,
    private readonly appService: AppService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Get Auth Service status' })
  public getHealth() {
    return this.appService.getHealth();
  }

  @Get('login')
  @ApiOperation({ summary: 'Initiate OAuth login flow' })
  @ApiQuery({ name: 'provider', enum: ['keycloak', 'github'], required: false })
  async login(
    @Query('provider') provider: string = 'keycloak',
    @Res() res: Response,
  ) {
    const { authUrl, state } = await this.authService.initiateLogin(provider);

    // Store state in secure cookie for CSRF protection
    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 5 * 60 * 1000, // 5 minutes
    });

    return res.redirect(authUrl);
  }

  @Get('callback')
  @ApiOperation({
    summary: 'OAuth callback endpoint - sets refresh token cookie',
  })
  @ApiQuery({ name: 'code', required: true })
  @ApiQuery({ name: 'state', required: true })
  @ApiQuery({ name: 'error', required: false })
  @ApiQuery({ name: 'error_description', required: false })
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('error') error?: string,
    @Query('error_description') errorDescription?: string,
  ) {
    try {
      // Check if Keycloak returned an error
      if (error) {
        console.error('Keycloak error:', error, errorDescription);
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=${error}&description=${encodeURIComponent(errorDescription || 'Unknown error')}`,
        );
      }

      // Check if code is present
      if (!code) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=missing_code`,
        );
      }

      // Verify state to prevent CSRF
      const cookieState = req.cookies['oauth_state'];

      if (!cookieState || cookieState !== state) {
        console.error(
          'State mismatch or missing cookie - possible CSRF attack',
        );
        res.clearCookie('oauth_state');
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=invalid_state`,
        );
      }

      const storedProvider = await this.redis.get(`oauth_state:${state}`);

      if (!storedProvider) {
        console.error('State not found in Redis or expired');
        res.clearCookie('oauth_state');
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=invalid_state`,
        );
      }

      // Delete state from Redis and cookie (one-time use)
      await this.redis.del(`oauth_state:${state}`);
      res.clearCookie('oauth_state');

      // Exchange code for tokens and create session
      const { accessToken, refreshToken, user } =
        await this.authService.handleCallback(code);

      // Set refresh token in HTTP-only cookie
      res.cookie('gc_refresh', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Redirect to frontend WITHOUT token in URL
      // Frontend will call POST /auth/refresh to get accessToken + user
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?success=true`,
      );
    } catch (error) {
      console.error('Callback error:', error);

      // Provide more specific error messages
      let errorMessage = 'auth_failed';
      if (error.message?.includes('code')) {
        errorMessage = 'invalid_code';
      } else if (error.message?.includes('token')) {
        errorMessage = 'token_exchange_failed';
      }

      // Redirect to login with error
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=${errorMessage}`,
      );
    }
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  @ApiSecurity('RefreshTokenCookie')
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'No refresh token provided or invalid token',
  })
  async refresh(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<ApiResponseDto<AuthResponseDto>>> {
    try {
      const refreshToken = req.cookies['gc_refresh'];

      if (!refreshToken) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'No refresh token provided',
          data: null,
          error: {
            code: 'NO_REFRESH_TOKEN',
            message: 'No refresh token provided',
          },
          timestamp: new Date().toISOString(),
          path: req.url,
        });
      }

      const {
        accessToken,
        refreshToken: newRefreshToken,
        user,
      } = await this.authService.refreshTokens(refreshToken);

      res.cookie('gc_refresh', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        statusCode: 200,
        message: 'Token refreshed successfully',
        data: {
          accessToken,
          user,
        },
        timestamp: new Date().toISOString(),
        path: req.url,
      });
    } catch (error) {
      res.clearCookie('gc_refresh', { path: '/' });
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid refresh token',
        data: null,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: error.message || 'Invalid refresh token',
        },
        timestamp: new Date().toISOString(),
        path: req.url,
      });
    }
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    type: LogoutResponseDto,
  })
  async logout(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<ApiResponseDto<LogoutResponseDto>>> {
    const refreshToken = req.cookies['gc_refresh'];

    if (refreshToken) {
      try {
        await this.authService.logout(refreshToken);
      } catch (error) {
        console.error('Logout error:', error);
        // Continue anyway - clear cookie even if Redis delete fails
      }
    }

    res.clearCookie('gc_refresh', { path: '/' });

    return res.json({
      success: true,
      statusCode: 200,
      message: 'Logged out successfully',
      data: {
        message: 'Logged out successfully',
      },
      timestamp: new Date().toISOString(),
      path: req.url,
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async getProfile(@Req() req: any): Promise<ApiResponseDto<UserDto>> {
    return {
      success: true,
      statusCode: 200,
      message: 'User profile retrieved successfully',
      data: req.user,
      timestamp: new Date().toISOString(),
      path: req.url,
    };
  }

  @Get('account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Initiate account update via Keycloak' })
  public async initiateAccountUpdate(@Res() res: Response) {
    const { accountUpdateUrl } = await this.authService.initiateAccountUpdate();
    return res.redirect(accountUpdateUrl);
  }

  @Get('account/callback')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Handle account update callback from Keycloak' })
  public async handleAccountUpdateCallback(
    @Req() req: any,
    @Res() res: Response,
  ) {
    // Process account update
    const result = await this.authService.handleAccountUpdateCallback(
      req.user.id,
    );

    // Redirect to frontend with update result
    return res.redirect(
      `${process.env.FRONTEND_URL}/account?update=${
        result.success ? 'success' : 'failure'
      }`,
    );
  }
}
