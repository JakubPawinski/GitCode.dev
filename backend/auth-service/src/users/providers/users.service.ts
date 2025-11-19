import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GetUsersQueryDto } from '../dtos/get-users-query.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  /*
   * Get current user's profile
   */
  public async getUserProfile(id) {
    const userProfile = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!userProfile) {
      throw new NotFoundException('User not found');
    }
    return userProfile;
  }

  /*
   * Update current user's profile
   */
  public async updateUserProfile(userId, patchUsersDto) {
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
        roles: true,
      },
    });
    return updatedUser;
  }

  /*
   * Soft delete current user's account
   */
  public async softDeleteUserAccount(userId) {
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
        roles: true,
      },
    });
    return softDeletedUser;
  }

  /*
   * Get current user's preferences
   */
  public async getUserPreferences(userId) {
    const userPreferences = await this.prismaService.userPreferences.findUnique(
      {
        where: { userId: userId },
      },
    );

    if (!userPreferences) {
      throw new NotFoundException('User preferences not found');
    }
    return userPreferences;
  }

  /*
   * Update current user's preferences
   */
  public async updateUserPreferences(userId, patchPreferencesDto) {
    const existingPreferences =
      await this.prismaService.userPreferences.findUnique({
        where: { userId },
      });

    if (!existingPreferences) {
      throw new NotFoundException('User preferences not found');
    }

    return this.prismaService.userPreferences.update({
      where: { userId },
      data: {
        ...patchPreferencesDto,
      },
    });
  }

  //Admin routes

  /*
   * Get user by ID
   */
  public async getUserById(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      include: { preferences: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
  /*
   * Get all users
   */
  public async getAllUsers(query: GetUsersQueryDto) {
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

    return {
      data: users,
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

  // public deleteUserById() {}
}
