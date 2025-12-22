import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SocialService } from './providers/social.service';
import {
  User,
  PermissionsGuards,
  RequirePermissions,
  JwtAuthGuard,
} from '@gitcode/auth';
import type { AuthenticatedUser, UUID } from '@gitcode/types';
import { AppPermission } from '@gitcode/types';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiResponseDto } from '@gitcode/common';
import {
  GetFriendDto,
  InviteFriendDto,
  FriendRequestDto,
  RespondFriendRequestDto,
} from './dtos';

@Controller('social')
@ApiTags('Social')
@UseGuards(JwtAuthGuard, PermissionsGuards)
@ApiExtraModels(ApiResponseDto, GetFriendDto, FriendRequestDto)
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  /*
   * Get all user's friends
   */
  @Get('/friends')
  @RequirePermissions(AppPermission.SOCIAL_FRIEND_LIST)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Get list of friends for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'List of friends retrieved successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(GetFriendDto),
              type: 'array',
            },
          },
        },
      ],
    },
  })
  public async getFriends(
    @User() user: AuthenticatedUser,
  ): Promise<GetFriendDto[]> {
    return this.socialService.getFriends(user.id);
  }

  /*
   * Get social leaderboard
   */
  @Get('/leaderboard')
  @RequirePermissions(AppPermission.SOCIAL_LEADERBOARD_VIEW)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Get social leaderboard' })
  @ApiResponse({
    status: 501,
    description: 'Not implemented',
  })
  public async getLeaderboard() {
    // TODO: implement leaderboard
  }

  /*
   * Get incoming friend requests
   */
  @Get('/friends/requests')
  @RequirePermissions(AppPermission.SOCIAL_FRIEND_LIST)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({
    summary: 'Get incoming friend requests for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Incoming friend requests retrieved successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(FriendRequestDto),
              type: 'array',
            },
          },
        },
      ],
    },
  })
  public async getFriendRequests(@User() user: AuthenticatedUser) {
    return this.socialService.getFriendRequests(user.id);
  }

  /*
   * Send a friend request to a user
   */
  @Post('/friends/invite')
  @RequirePermissions(AppPermission.SOCIAL_FRIEND_INVITE)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Send a friend request to a user' })
  @ApiResponse({
    status: 201,
    description: 'Friend request sent successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(FriendRequestDto),
            },
          },
        },
      ],
    },
  })
  @ApiBody({ type: InviteFriendDto })
  public async sendFriendRequest(
    @User() user: AuthenticatedUser,
    @Body() inviteFriendDto: InviteFriendDto,
  ) {
    return this.socialService.sendFriendRequest(user.id, inviteFriendDto);
  }

  /*
   * Respond to a friend request
   */
  @Patch('/friends/respond/:requestId')
  @RequirePermissions(AppPermission.SOCIAL_FRIEND_RESPOND)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Respond to a friend request' })
  @ApiResponse({
    status: 200,
    description: 'Friend request responded successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(FriendRequestDto),
            },
          },
        },
      ],
    },
  })
  @ApiBody({ type: RespondFriendRequestDto })
  public async respondToFriendRequest(
    @Param('requestId', ParseUUIDPipe) requestId: UUID,
    @Body() respondFriendRequestDto: RespondFriendRequestDto,
  ) {
    return this.socialService.respondToFriendRequest(
      requestId,
      respondFriendRequestDto,
    );
  }

  /*
   * Remove a friend
   */
  @Delete('/friends/:userId')
  @RequirePermissions(AppPermission.SOCIAL_FRIEND_REMOVE)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Remove a friend from the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Friend removed successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Friend removed successfully',
                },
                success: { type: 'boolean', example: true },
                removedUserId: { type: 'string', format: 'uuid' },
              },
            },
          },
        },
      ],
    },
  })
  public async removeFriend(
    @User() user: AuthenticatedUser,
    @Param('userId', ParseUUIDPipe) userId: UUID,
  ) {
    return this.socialService.removeFriend(user.id, userId);
  }
}
