import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './providers/users.service';
import { Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiExtraModels,
  getSchemaPath,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AppPermission } from '../auth/enums/permissions.enum';
import { PermissionsGuards } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { User } from '../auth/decorators/current-user.decorator';
import { ApiResponseDto } from '../dto/api-response.dto';
import { patch } from 'axios';
import { GetUsersQueryDto } from './dtos/get-users-query.dto';
import { GetProfileDto } from './dtos/get-profile.dto';
import { PatchProfileDto } from './dtos/patch-profile.dto';
import type { AuthenticatedUser, UUID } from '../types';
import { GetPreferencesDto } from './dtos/get-preferences.dto';
import { PatchPreferencesDto } from './dtos/patch-preferences.dto';
import { GetPublicProfileDto } from './dtos/get-public-profile.dto';
import { GetUserDto } from './dtos/get-user.dto';
import { SearchUsersDto } from './dtos/search-users.dto';
import { SearchUsersAdminDto } from './dtos/search-users-admin.dto';
import { PaginatedResult } from '../types/pagination.interface';

@Controller('users')
@ApiTags('Users management')
@ApiExtraModels(
  ApiResponseDto,
  GetPreferencesDto,
  PatchProfileDto,
  GetProfileDto,
  PatchPreferencesDto,
  GetPublicProfileDto,
  GetUserDto,
)
@UseGuards(JwtAuthGuard, PermissionsGuards)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /*
   * Get current user's profile
   */
  @Get('/me')
  @RequirePermissions(AppPermission.USER_READ_SELF)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: "Get current user's profile" })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(GetProfileDto),
            },
          },
        },
      ],
    },
  })
  public getMe(@User() user: AuthenticatedUser): Promise<GetProfileDto> {
    return this.usersService.getUserProfile(user.id);
  }

  /*
   * Update current user's profile
   */
  @Patch('/me')
  @RequirePermissions(AppPermission.USER_UPDATE_SELF)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: "Update current user's profile" })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(GetProfileDto),
            },
          },
        },
      ],
    },
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        bio: { type: 'string', example: 'Updated bio' },
        avatarUrl: {
          type: 'string',
          example: 'https://example.com/new-avatar.jpg',
        },
      },
    },
  })
  public updateMe(
    @User() user: AuthenticatedUser,
    @Body() patchProfileDto: PatchProfileDto,
  ): Promise<GetProfileDto> {
    return this.usersService.updateUserProfile(user.id, patchProfileDto);
  }

  /*
   * Delete current user's account
   */
  @Delete('/me')
  @RequirePermissions(AppPermission.USER_DELETE_SELF)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: "Soft delete current user's account" })
  @ApiResponse({
    status: 200,
    description: 'User account deleted successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(GetProfileDto),
            },
          },
        },
      ],
    },
  })
  public async deleteMe(@User() user: AuthenticatedUser) {
    const deletedUser = await this.usersService.softDeleteUserAccount(user.id);
    return { message: 'User account deleted successfully', data: deletedUser };
  }

  /*
   * Get current user's preferences
   */
  @Get('/me/preferences')
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.USER_PREFERENCE_READ)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: "Get current user's preferences" })
  @ApiResponse({
    status: 200,
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(GetPreferencesDto),
            },
          },
        },
      ],
    },
    description: "User's preferences retrieved successfully",
  })
  public getPreferences(
    @User() user: AuthenticatedUser,
  ): Promise<GetPreferencesDto> {
    return this.usersService.getUserPreferences(user.id);
  }

  /*
   * Update current user's preferences
   */
  @Patch('/me/preferences')
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.USER_PREFERENCE_UPDATE)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: "Update current user's preferences" })
  @ApiResponse({
    status: 200,
    description: "User's preferences updated successfully",
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(GetPreferencesDto),
            },
          },
        },
      ],
    },
  })
  public updatePreferences(
    @User() user: AuthenticatedUser,
    @Body() patchPreferencesDto: PatchPreferencesDto,
  ): Promise<GetPreferencesDto> {
    return this.usersService.updateUserPreferences(
      user.id,
      patchPreferencesDto,
    );
  }

  /*
   * Get user profile by ID
   */
  @Get('/:id/profile')
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.USER_READ_PUBLIC)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Get user profile by ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the user',
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(GetPublicProfileDto),
            },
          },
        },
      ],
    },
  })
  public getUserPublicProfile(
    @Param('id', new ParseUUIDPipe()) id: UUID,
  ): Promise<GetPublicProfileDto> {
    return this.usersService.getUserPublicProfile(id);
  }

  /*
   * Get all users
   */
  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.USER_MANAGE) // Require admin-level permission
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(GetUserDto) },
            },
          },
        },
      ],
    },
  })
  public getAllUsers(
    @Query() getUsersQueryDto: GetUsersQueryDto,
  ): Promise<PaginatedResult<GetUserDto>> {
    return this.usersService.getAllUsers(getUsersQueryDto);
  }

  /*
   * Get user by ID with all details
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.USER_READ_PRIVATE)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the user to retrieve',
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(GetUserDto),
            },
          },
        },
      ],
    },
  })
  public getUserById(
    @Param('id', new ParseUUIDPipe()) id: UUID,
  ): Promise<GetUserDto> {
    return this.usersService.getUserById(id);
  }

  /*
   * Ban user by id
   */
  @Post(':id/ban')
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.USER_MANAGE) // Require admin-level permission
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Ban user by ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the user to ban',
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'User banned successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(GetUserDto),
            },
          },
        },
      ],
    },
  })
  public async banUserById(
    @Param('id', new ParseUUIDPipe()) id: UUID,
  ): Promise<GetUserDto> {
    return this.usersService.banUserById(id);
  }

  /*
   * Search users by username
   */
  @Get('/search')
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.USER_READ_PUBLIC)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Search users by username' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(GetPublicProfileDto) },
            },
          },
        },
      ],
    },
  })
  public async searchUsers(
    @Query() searchUsersDto: SearchUsersDto,
  ): Promise<PaginatedResult<GetPublicProfileDto>> {
    return this.usersService.searchUsers(searchUsersDto);
  }

  /*
   * Admin search users with more detailed info
   */
  @Get('/search/admin')
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.USER_MANAGE) // Require admin-level permission
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Admin search users with detailed info' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(GetUserDto) },
            },
          },
        },
      ],
    },
  })
  public searchUsersAdmin(
    @Query() searchUsersAdminDto: SearchUsersAdminDto,
  ): Promise<PaginatedResult<GetUserDto>> {
    return this.usersService.searchUsersAdmin(searchUsersAdminDto);
  }

  /*
   * Restore a soft-deleted user by ID
   */
  @Post('/:id/restore')
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.USER_MANAGE) // Require admin-level permission
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Restore a soft-deleted user by ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the user to restore',
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'User restored successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiResponseDto) },
        {
          properties: {
            data: {
              $ref: getSchemaPath(GetUserDto),
            },
          },
        },
      ],
    },
  })
  public restoreUser(@Param('id', new ParseUUIDPipe()) id: UUID) {
    return this.usersService.restoreUserById(id);
  }
}
