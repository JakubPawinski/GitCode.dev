import { Controller, Patch, Post, Sse, UseGuards } from '@nestjs/common';
import { Get } from '@nestjs/common';
import {
  JwtAuthGuard,
  PermissionsGuards,
  RequirePermissions,
  User,
} from '@gitcode/auth';
import { RealtimeService } from '../realtime/realtime.service';
import { NotificationService } from './providers/notification.service';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AppPermission, type AuthenticatedUser } from '@gitcode/types';
import { UpdateNotificationPreferencesDto } from './dtos';

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly realtimeService: RealtimeService,
    private readonly notificationService: NotificationService,
  ) {}

  // TODO - remove this endpoint after adding proper health checks in common package
  /*
   * Endpoint to get the health status of the Notification Service
   */
  @Get('health')
  @ApiOperation({ summary: 'Get Notification Service status' })
  public getHealth() {
    return this.notificationService.getHealth();
  }

  /*
   * Server-Sent Events endpoint for real-time notifications
   */
  @Sse('sse')
  public streamNotifications(@User() user: any) {
    return this.realtimeService.getUserStream(user.id);
  }

  /*
   * Endpoint to get user notification preferences
   */
  @Get('preferences')
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.USER_READ_SELF)
  @ApiBearerAuth('Bearer Auth')
  public async getPreferences(@User() user: AuthenticatedUser) {
    return await this.notificationService.getUserPreferences(user.id);
  }

  /*
   * Endpoint to update user notification preferences
   */
  @Patch('preferences')
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.USER_UPDATE_SELF)
  @ApiBearerAuth('Bearer Auth')
  public async updatePreferences(
    @User() user: AuthenticatedUser,
    dto: UpdateNotificationPreferencesDto,
  ) {
    return await this.notificationService.updateUserPreferences(user.id, dto);
  }

  /*
   * Endpoint to create default notification preferences for the user
   */
  @Post('preferences/default')
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.USER_UPDATE_SELF)
  @ApiBearerAuth('Bearer Auth')
  public async createDefaultPreferences(@User() user: AuthenticatedUser) {
    return await this.notificationService.setDefaultPreferences(user.id);
  }
}
