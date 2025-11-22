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
  /*
   * Get current user's profile
   */
  public getMe(@User() user: AuthenticatedUser): Promise<GetProfileDto> {
    return this.usersService.getUserProfile(user.id);
  }

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
  /*
   * Update current user's profile
   */
  public updateMe(
    @User() user: AuthenticatedUser,
    @Body() patchProfileDto: PatchProfileDto,
  ): Promise<GetProfileDto> {
    return this.usersService.updateUserProfile(user.id, patchProfileDto);
  }

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
  /*
   * Delete current user's account
   */
  public async deleteMe(@User() user: AuthenticatedUser) {
    const deletedUser = await this.usersService.softDeleteUserAccount(user.id);
    return { message: 'User account deleted successfully', data: deletedUser };
  }

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
  /*
   * Get current user's preferences
   */
  public getPreferences(
    @User() user: AuthenticatedUser,
  ): Promise<GetPreferencesDto> {
    return this.usersService.getUserPreferences(user.id);
  }

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
  /*
   * Update current user's preferences
   */
  public updatePreferences(
    @User() user: AuthenticatedUser,
    @Body() patchPreferencesDto: PatchPreferencesDto,
  ): Promise<GetPreferencesDto> {
    return this.usersService.updateUserPreferences(
      user.id,
      patchPreferencesDto,
    );
  }

  @Get('/:id/profile')
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.USER_READ_PUBLIC)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Get user profile by ID' })
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
  /*
   * Get user profile by ID
   */
  public getUserPublicProfile(
    @Param('id', new ParseUUIDPipe()) id: UUID,
  ): Promise<GetPublicProfileDto> {
    return this.usersService.getUserPublicProfile(id);
  }

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
  /*
   * Get all users
   */
  public getAllUsers(
    @Query() getUsersQueryDto: GetUsersQueryDto,
  ): Promise<PaginatedResult<GetUserDto>> {
    return this.usersService.getAllUsers(getUsersQueryDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.USER_READ_PRIVATE)
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Get user by ID' })
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
  /*
   * Get user by ID with all details
   */
  public getUserById(
    @Param('id', new ParseUUIDPipe()) id: UUID,
  ): Promise<GetUserDto> {
    return this.usersService.getUserById(id);
  }

  @Delete(':id/ban')
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.USER_MANAGE) // Require admin-level permission
  @ApiBearerAuth('Bearer Auth')
  @ApiOperation({ summary: 'Ban user by ID' })
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
  /*
   * Ban user by id
   */
  public async banUserById(
    @Param('id', new ParseUUIDPipe()) id: UUID,
  ): Promise<GetUserDto> {
    return this.usersService.banUserById(id);
  }

  @Get('/search')
  /*
   * Search users by username
   */
  public async searchUsers(
    @Query() searchUsersDto: SearchUsersDto,
  ): Promise<PaginatedResult<GetPublicProfileDto>> {
    return this.usersService.searchUsers(searchUsersDto);
  }

  @Get('/search/admin')
  public searchUsersAdmin(
    @Query() searchUsersAdminDto: SearchUsersAdminDto,
  ): Promise<PaginatedResult<GetUserDto>> {
    return this.usersService.searchUsersAdmin(searchUsersAdminDto);
  }

  @Post('/:id/restore')
  public restoreUser(@Param('id', new ParseUUIDPipe()) id: UUID) {
    return this.usersService.restoreUserById(id);
  }
}
