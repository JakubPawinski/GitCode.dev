import {
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
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
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  AppPermission,
  type UUID,
  type AuthenticatedUser,
  PaginatedResult,
} from '@gitcode/types';
import {
  GetNotificationDto,
  GetNotificationPreferencesDto,
  UpdateNotificationPreferencesDto,
} from './dtos';
import {
  ApiResponseDto,
  PaginatedResponseDto,
  PaginationQueryDto,
  ResponseInterceptor,
} from '@gitcode/common';

@Controller('notifications')
@UseInterceptors(ResponseInterceptor)
@ApiTags('Notifications')
@ApiExtraModels(
  ApiResponseDto,
  GetNotificationDto,
  GetNotificationPreferencesDto,
  PaginatedResponseDto,
)
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
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.USER_READ_SELF)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({
    summary: 'Stream real-time notifications via Server-Sent Events',
  })
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
  @ApiOperation({ summary: 'Get user notification preferences' })
  @ApiResponse({
    status: 200,
    description: 'User notification preferences retrieved successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(GetNotificationPreferencesDto),
              type: 'object',
            },
          },
        },
      ],
    },
  })
  public async getPreferences(
    @User() user: AuthenticatedUser,
  ): Promise<GetNotificationPreferencesDto> {
    return await this.notificationService.getUserPreferences(user.id);
  }

  /*
   * Endpoint to update user notification preferences
   */
  @Patch('preferences')
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.USER_UPDATE_SELF)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Update user notification preferences' })
  @ApiResponse({
    status: 200,
    description: 'User notification preferences updated successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(GetNotificationPreferencesDto),
              type: 'object',
            },
          },
        },
      ],
    },
  })
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
  @ApiOperation({ summary: 'Create default notification preferences for user' })
  @ApiResponse({
    status: 200,
    description:
      'Default notification preferences created successfully for the user',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(GetNotificationPreferencesDto),
              type: 'object',
            },
          },
        },
      ],
    },
  })
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
  @ApiOperation({ summary: 'Get all notifications for the user' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of user notifications retrieved successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(GetNotificationDto) },
            },
          },
        },
      ],
    },
  })
  public async getAllNotifications(
    @Query() paginationQueryDto: PaginationQueryDto,
    @User() user: AuthenticatedUser,
  ): Promise<PaginatedResult<GetNotificationDto>> {
    return await this.notificationService.getAllNotifications(
      user.id,
      paginationQueryDto,
    );
  }

  @Get('unread')
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.USER_READ_SELF)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Get unread notifications for the user' })
  @ApiResponse({
    status: 200,
    description:
      'Paginated list of unread user notifications retrieved successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(GetNotificationDto) },
            },
          },
        },
      ],
    },
  })
  public async getUnreadNotifications(
    @User() user: AuthenticatedUser,
  ): Promise<PaginatedResult<GetNotificationDto>> {
    return this.notificationService.getUnreadNotifications(user.id);
  }

  /*
   * Endpoint to get the count of unread notifications for the user
   */
  @Get('unread-count')
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.USER_READ_SELF)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Get count of unread notifications for the user' })
  @ApiResponse({
    status: 200,
    description: 'Count of unread user notifications retrieved successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              type: 'number',
              example: 5,
            },
          },
        },
      ],
    },
  })
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
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read successfully',
    schema: {
      allOf: [{ $ref: getSchemaPath(ApiResponseDto) }],
    },
  })
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
  @ApiOperation({ summary: 'Mark a specific notification as read' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(GetNotificationDto),
              type: 'object',
            },
          },
        },
      ],
    },
  })
  public async markAsRead(
    @User() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: UUID,
  ): Promise<GetNotificationDto> {
    return await this.notificationService.markAsRead(user.id, id);
  }

  /*
   * Endpoint to get a specific notification by ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.USER_READ_SELF)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Get a specific notification by ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification retrieved successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(GetNotificationDto),
              type: 'object',
            },
          },
        },
      ],
    },
  })
  public async getNotificationById(
    @User() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: UUID,
  ): Promise<GetNotificationDto> {
    return await this.notificationService.getNotificationById(user.id, id);
  }
}
