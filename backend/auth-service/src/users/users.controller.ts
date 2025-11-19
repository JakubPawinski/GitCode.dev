import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AppPermission } from '../auth/enums/permissions.enum';
import { PermissionsGuards } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { User } from '../auth/decorators/current-user.decorator';
import { ApiResponseDto } from '../dto/api-response.dto';
import { PatchPreferencesDto, PreferencesDto } from './dtos/preferences.dto';
import { PatchUsersDto, UsersDto } from './dtos/users.dto';
import { patch } from 'axios';
import { GetUsersQueryDto } from './dtos/get-users-query.dto';

@Controller('users')
@ApiTags('Users management')
@ApiExtraModels(ApiResponseDto, PreferencesDto, UsersDto)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/me')
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.USER_READ)
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
              $ref: getSchemaPath(UsersDto),
            },
          },
        },
      ],
    },
  })
  /*
   * Get current user's profile
   */
  public getMe(@User() user: any) {
    return this.usersService.getUserProfile(user.id);
  }

  @Patch('/me')
  /*
   * Update current user's profile
   */
  public updateMe(@User() user: any, @Body() patchUsersDto: PatchUsersDto) {
    return this.usersService.updateUserProfile(user.id, patchUsersDto);
  }

  @Delete('/me')
  /*
   * Delete current user's account
   */
  public deleteMe(@User() user: any) {
    return this.usersService.softDeleteUserAccount(user.id);
  }

  @Get('/me/preferences')
  @UseGuards(JwtAuthGuard, PermissionsGuards)
  @RequirePermissions(AppPermission.USER_READ)
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
              $ref: getSchemaPath(PreferencesDto),
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
  public getPreferences(@User() user: any) {
    return this.usersService.getUserPreferences(user.id);
  }

  @Patch('/me/preferences')
  /*
   * Update current user's preferences
   */
  public updatePreferences(
    @User() user: any,
    @Body() patchPreferencesDto: PatchPreferencesDto,
  ) {
    return this.usersService.updateUserPreferences(
      user.id,
      patchPreferencesDto,
    );
  }

  @Get('/:id/profile')
  /*
   * Get user profile by ID
   */
  public getUserProfile(@Param('id') id: string) {
    return this.usersService.getUserProfile(id);
  }

  //Admin and moderator endpoints

  @Get()
  /*
   * Get all users
   */
  public getAllUsers(@Query() getUsersQueryDto: GetUsersQueryDto) {
    return this.usersService.getAllUsers(getUsersQueryDto);
  }

  @Get(':id')
  /*
   * Get user by ID
   */
  public getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  // @Delete(':id')
  // /*
  //  * Delete user by ID
  //  */
  // public deleteUserById() {
  //   return this.usersService.deleteUserById();
  // }
}
