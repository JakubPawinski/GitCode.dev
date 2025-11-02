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
import { ApiOperation, ApiTags, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller()
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  @ApiOperation({ summary: 'OAuth callback endpoint' })
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
      const storedState = req.cookies['oauth_state'];
      if (!storedState || storedState !== state) {
        console.error('State mismatch:', {
          stored: storedState,
          received: state,
        });
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=invalid_state&hint=try_again`,
        );
      }

      // Clear state cookie
      res.clearCookie('oauth_state');

      // Exchange code for tokens and create session
      const { accessToken, refreshToken, user } =
        await this.authService.handleCallback(code);

      // Set refresh token in HTTP-only cookie
      res.cookie('gc_refresh', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      //TODO RES WITH JSON CONTAINIG ACCESS TOKEN
      // Redirect to frontend with access token
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}`,
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

      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=${errorMessage}&hint=try_again`,
      );
    }
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async refresh(@Req() req: Request, @Res() res: Response) {
    try {
      const refreshToken = req.cookies['gc_refresh'];

      if (!refreshToken) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          message: 'No refresh token provided',
        });
      }

      const {
        accessToken,
        refreshToken: newRefreshToken,
        user,
      } = await this.authService.refreshTokens(refreshToken);

      // Rotate refresh token
      res.cookie('gc_refresh', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({ accessToken, user });
    } catch (error) {
      res.clearCookie('gc_refresh');
      return res.status(HttpStatus.UNAUTHORIZED).json({
        message: 'Invalid refresh token',
      });
    }
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  async logout(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies['gc_refresh'];

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    res.clearCookie('gc_refresh', { path: '/auth/refresh' });
    return res.json({ message: 'Logged out successfully' });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async getProfile(@Req() req: any) {
    return {
      user: req.user,
    };
  }
}
