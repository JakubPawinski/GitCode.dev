import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GetUsersQueryDto } from '../dtos/get-users-query.dto';
import { GetProfileDto } from '../dtos/get-profile.dto';
import { App } from 'supertest/types';
import { AppRole } from '../../auth/enums/roles.enum';
import { UUID } from '../../types';
import { PatchProfileDto } from '../dtos/patch-profile.dto';
import { GetPreferencesDto } from '../dtos/get-preferences.dto';
import { privacyLevelEnum } from '../enums/privacyLevel.enum';
import { themeEnum } from '../enums/theme.enum';
import { PatchPreferencesDto } from '../dtos/patch-preferences.dto';
import { GetPublicProfileDto } from '../dtos/get-public-profile.dto';
import { GetUserDto } from '../dtos/get-user.dto';
import { AppPermission } from '../../auth/enums/permissions.enum';
import { SearchUsersDto } from '../dtos/search-users.dto';
import { contains } from 'class-validator';
import { Prisma } from '@prisma/client';
import { PaginatedResult } from '../../types/pagination.interface';
import { SearchUsersAdminDto } from '../dtos/search-users-admin.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  /*
   * Get current user's profile
   */
  public async getUserProfile(id): Promise<GetProfileDto> {
    const userProfile = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!userProfile) {
      throw new NotFoundException('User not found');
    }
    const profileDto: GetProfileDto = {
      id: userProfile.id,
      email: userProfile.email,
      username: userProfile.username,
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      avatarUrl: userProfile.avatarUrl,
      bio: userProfile.bio,
      emailVerified: userProfile.emailVerified,
      roles: userProfile.roles as AppRole[],
    };
    return profileDto;
  }

  /*
   * Get user public profile by ID
   */
  public async getUserPublicProfile(id: UUID): Promise<GetPublicProfileDto> {
    const userProfile = await this.getUserById(id);

    if (!userProfile) {
      throw new NotFoundException('User not found');
    }

    const publicProfileDto: GetPublicProfileDto = {
      id: userProfile.id,
      username: userProfile.username,
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      avatarUrl: userProfile.avatarUrl,
      bio: userProfile.bio,
    };
    return publicProfileDto;
  }

  /*
   * Update current user's profile
   */
  public async updateUserProfile(
    userId: UUID,
    patchUsersDto: PatchProfileDto,
  ): Promise<GetProfileDto> {
    const existingUser = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        ...patchUsersDto,
      },
      omit: {
        permissions: true,
      },
    });

    const profileDto: GetProfileDto = {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      avatarUrl: updatedUser.avatarUrl,
      bio: updatedUser.bio,
      emailVerified: updatedUser.emailVerified,
      roles: updatedUser.roles as AppRole[],
    };
    return profileDto;
  }

  /*
   * Soft delete current user's account
   */
  public async softDeleteUserAccount(userId: UUID): Promise<GetProfileDto> {
    const existingUser = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const softDeletedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        isActive: false,
      },
      omit: {
        permissions: true,
      },
    });

    const profileDto: GetProfileDto = {
      id: softDeletedUser.id,
      email: softDeletedUser.email,
      username: softDeletedUser.username,
      firstName: softDeletedUser.firstName,
      lastName: softDeletedUser.lastName,
      avatarUrl: softDeletedUser.avatarUrl,
      bio: softDeletedUser.bio,
      emailVerified: softDeletedUser.emailVerified,
      roles: softDeletedUser.roles as AppRole[],
    };
    return profileDto;
  }

  /*
   * Get current user's preferences
   */
  public async getUserPreferences(userId: UUID): Promise<GetPreferencesDto> {
    const userPreferences = await this.prismaService.userPreferences.findUnique(
      {
        where: { userId: userId },
      },
    );

    if (!userPreferences) {
      throw new NotFoundException('User preferences not found');
    }
    const preferencesDto: GetPreferencesDto = {
      theme: userPreferences.theme as themeEnum,
      language: userPreferences.language,
      notifications: userPreferences.notifications,
      privacyLevel: userPreferences.privacyLevel as privacyLevelEnum,
    };
    return preferencesDto;
  }

  /*
   * Update current user's preferences
   */
  public async updateUserPreferences(
    userId: UUID,
    patchPreferencesDto: PatchPreferencesDto,
  ): Promise<GetPreferencesDto> {
    const existingPreferences =
      await this.prismaService.userPreferences.findUnique({
        where: { userId },
      });

    if (!existingPreferences) {
      throw new NotFoundException('User preferences not found');
    }
    const updatedPreferences = await this.prismaService.userPreferences.update({
      where: { userId },
      data: {
        ...patchPreferencesDto,
      },
    });
    const preferencesDto: GetPreferencesDto = {
      theme: updatedPreferences.theme as themeEnum,
      language: updatedPreferences.language,
      notifications: updatedPreferences.notifications,
      privacyLevel: updatedPreferences.privacyLevel as privacyLevelEnum,
    };
    return preferencesDto;
  }

  /*
   * Get user by ID with all details
   */
  public async getUserById(id: UUID): Promise<GetUserDto> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      include: { preferences: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    const userDto: GetUserDto = {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      emailVerified: user.emailVerified,
      roles: user.roles as AppRole[],
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
      preferences: user.preferences
        ? {
            theme: user.preferences.theme as themeEnum,
            language: user.preferences.language,
            notifications: user.preferences.notifications,
            privacyLevel: user.preferences.privacyLevel as privacyLevelEnum,
          }
        : null,
      permissions: user.permissions as AppPermission[],
    };
    return userDto;
  }
  /*
   * Get all users
   */
  public async getAllUsers(
    query: GetUsersQueryDto,
  ): Promise<PaginatedResult<GetUserDto>> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [users, totalItems] = await Promise.all([
      this.prismaService.user.findMany({
        skip,
        take: limit,
        include: { preferences: true },
      }),
      this.prismaService.user.count(),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    const mappedUsers: GetUserDto[] = users.map((user) => ({
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      emailVerified: user.emailVerified,
      roles: user.roles as AppRole[],
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
      preferences: user.preferences
        ? {
            theme: user.preferences.theme as themeEnum,
            language: user.preferences.language,
            notifications: user.preferences.notifications,
            privacyLevel: user.preferences.privacyLevel as privacyLevelEnum,
          }
        : null,
      permissions: user.permissions as AppPermission[],
    }));

    return {
      data: mappedUsers,
      meta: {
        currentPage: page,
        pageSize: limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /*
   * Ban user by ID (delete from database)
   */
  public async banUserById(id: string): Promise<GetUserDto> {
    const userToBan = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!userToBan) {
      throw new NotFoundException('User not found');
    }

    // TODO: remove from keycloak

    const bannedUser = await this.prismaService.user.delete({
      where: { id },
      include: { preferences: true },
    });

    const userDto: GetUserDto = {
      id: bannedUser.id,
      email: bannedUser.email,
      username: bannedUser.username,
      firstName: bannedUser.firstName,
      lastName: bannedUser.lastName,
      avatarUrl: bannedUser.avatarUrl,
      bio: bannedUser.bio,
      emailVerified: bannedUser.emailVerified,
      roles: bannedUser.roles as AppRole[],
      isActive: bannedUser.isActive,
      createdAt: bannedUser.createdAt.toISOString(),
      updatedAt: bannedUser.updatedAt.toISOString(),
      lastLogin: bannedUser.lastLogin
        ? bannedUser.lastLogin.toISOString()
        : null,
      preferences: bannedUser.preferences
        ? {
            theme: bannedUser.preferences.theme as themeEnum,
            language: bannedUser.preferences.language,
            notifications: bannedUser.preferences.notifications,
            privacyLevel: bannedUser.preferences
              .privacyLevel as privacyLevelEnum,
          }
        : null,
      permissions: bannedUser.permissions as AppPermission[],
    };
    return userDto;
  }

  /*
   * Search users by username
   */
  public async searchUsers(
    searchUsersDto: SearchUsersDto,
  ): Promise<PaginatedResult<GetPublicProfileDto>> {
    const { username } = searchUsersDto;
    const { limit = 10, page = 1 } = searchUsersDto;
    const skip = (page - 1) * limit;

    const whereCondition: Prisma.UserWhereInput = {
      username: {
        contains: username,
        mode: 'insensitive',
      },
      isActive: true,
    };

    const [usersFound, totalItems] = await Promise.all([
      this.prismaService.user.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { username: 'asc' },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          bio: true,
        },
      }),
      this.prismaService.user.count({
        where: whereCondition,
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    const publicProfiles = usersFound.map((user) => ({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
    }));
    return {
      data: publicProfiles,
      meta: {
        currentPage: page,
        pageSize: limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /*
   * Search users by email and username (admin)
   */
  public async searchUsersAdmin(
    searchUsersAdminDto: SearchUsersAdminDto,
  ): Promise<PaginatedResult<GetUserDto>> {
    const { username, email } = searchUsersAdminDto;
    const { limit = 10, page = 1 } = searchUsersAdminDto;
    const skip = (page - 1) * limit;

    const whereCondition: Prisma.UserWhereInput = {
      AND: [
        username
          ? {
              username: {
                contains: username,
                mode: 'insensitive',
              },
            }
          : {},
        email
          ? {
              email: {
                contains: email,
                mode: 'insensitive',
              },
            }
          : {},
      ],
    };

    const [usersFound, totalItems] = await Promise.all([
      this.prismaService.user.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { username: 'asc' },
        include: { preferences: true },
      }),
      this.prismaService.user.count({
        where: whereCondition,
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    const mappedUsers: GetUserDto[] = usersFound.map((user) => ({
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      emailVerified: user.emailVerified,
      roles: user.roles as AppRole[],
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
      preferences: user.preferences
        ? {
            theme: user.preferences.theme as themeEnum,
            language: user.preferences.language,
            notifications: user.preferences.notifications,
            privacyLevel: user.preferences.privacyLevel as privacyLevelEnum,
          }
        : null,
      permissions: user.permissions as AppPermission[],
    }));

    return {
      data: mappedUsers,
      meta: {
        currentPage: page,
        pageSize: limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
}
