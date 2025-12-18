import {
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Sse,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
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
import {
  AppPermission,
  type UUID,
  type AuthenticatedUser,
} from '@gitcode/types';
import { GetNotificationDto, UpdateNotificationPreferencesDto } from './dtos';
import { ResponseInterceptor } from '@gitcode/common';

@Controller('notifications')
@UseInterceptors(ResponseInterceptor)
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

  /*
   * Endpoint to get all notifications for the user
   */
  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.USER_READ_SELF)
  @ApiBearerAuth('Bearer Auth')
  public async getAllNotifications(
    @User() user: AuthenticatedUser,
  ): Promise<GetNotificationDto[]> {
    return await this.notificationService.getAllNotifications(user.id);
  }

  @Get('unread')
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.USER_READ_SELF)
  @ApiBearerAuth('Bearer Auth')
  public async getUnreadNotifications(
    @User() user: AuthenticatedUser,
  ): Promise<GetNotificationDto[]> {
    return this.notificationService.getUnreadNotifications(user.id);
  }

  /*
   * Endpoint to get the count of unread notifications for the user
   */
  @Get('unread-count')
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.USER_READ_SELF)
  @ApiBearerAuth('Bearer Auth')
  public async getUnreadNotificationCount(
    @User() user: AuthenticatedUser,
  ): Promise<number> {
    return await this.notificationService.getUnreadNotificationCount(user.id);
  }

  /*
   * Endpoint to mark all notifications as read
   */
  @Patch('read-all')
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.USER_UPDATE_SELF)
  @ApiBearerAuth('Bearer Auth')
  public async markAllAsRead(@User() user: AuthenticatedUser) {
    return await this.notificationService.markAllAsRead(user.id);
  }

  /*
   * Endpoint to mark a specific notification as read
   */
  @Patch(':id/mark-as-read')
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.USER_UPDATE_SELF)
  @ApiBearerAuth('Bearer Auth')
  public async markAsRead(
    @User() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: UUID,
  ) {
    return await this.notificationService.markAsRead(user.id, id);
  }

  /*
   * Endpoint to get a specific notification by ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.USER_READ_SELF)
  @ApiBearerAuth('Bearer Auth')
  public async getNotificationById(
    @User() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: UUID,
  ): Promise<GetNotificationDto> {
    return await this.notificationService.getNotificationById(user.id, id);
  }
}
