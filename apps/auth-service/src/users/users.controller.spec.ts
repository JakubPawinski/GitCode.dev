import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './providers/users.service';
import { GetUsersQueryDto } from './dtos/get-users-query.dto';
import { PatchProfileDto } from './dtos/patch-profile.dto';
import { PatchPreferencesDto } from './dtos/patch-preferences.dto';
import { SearchUsersDto } from './dtos/search-users.dto';
import { SearchUsersAdminDto } from './dtos/search-users-admin.dto';
import { GetProfileDto } from './dtos/get-profile.dto';
import { GetPreferencesDto } from './dtos/get-preferences.dto';
import { GetPublicProfileDto } from './dtos/get-public-profile.dto';
import { GetUserDto } from './dtos/get-user.dto';
import {
  PaginatedResult,
  privacyLevelEnum,
  themeEnum,
  UserStatus,
} from '@gitcode/types';
import type { AuthenticatedUser, UUID } from '@gitcode/types';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const mockUsersService = {
      getUserProfile: jest.fn(),
      updateUserProfile: jest.fn(),
      softDeleteUserAccount: jest.fn(),
      getUserPreferences: jest.fn(),
      updateUserPreferences: jest.fn(),
      getAllUsers: jest.fn(),
      searchUsers: jest.fn(),
      searchUsersAdmin: jest.fn(),
      getUserPublicProfile: jest.fn(),
      banUserById: jest.fn(),
      restoreUserById: jest.fn(),
      getUserById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMe', () => {
    it('should return user profile', async () => {
      const mockUser: AuthenticatedUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        roles: [],
        permissions: [],
      };
      const mockProfile: GetProfileDto = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: 'avatar.jpg',
        bio: 'Bio',
        emailVerified: true,
        roles: [],
      };
      usersService.getUserProfile.mockResolvedValue(mockProfile);

      const result = await controller.getMe(mockUser);

      expect(result).toEqual(mockProfile);
      expect(usersService.getUserProfile).toHaveBeenCalledWith('1');
    });
  });

  describe('updateMe', () => {
    it('should update user profile', async () => {
      const mockUser: AuthenticatedUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        roles: [],
        permissions: [],
      };
      const patchDto: PatchProfileDto = { bio: 'Updated bio' };
      const mockProfile: GetProfileDto = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: 'avatar.jpg',
        bio: 'Updated bio',
        emailVerified: true,
        roles: [],
      };
      usersService.updateUserProfile.mockResolvedValue(mockProfile);

      const result = await controller.updateMe(mockUser, patchDto);

      expect(result).toEqual(mockProfile);
      expect(usersService.updateUserProfile).toHaveBeenCalledWith(
        '1',
        patchDto,
      );
    });
  });

  describe('deleteMe', () => {
    it('should delete user account', async () => {
      const mockUser: AuthenticatedUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        roles: [],
        permissions: [],
      };
      const mockProfile: GetProfileDto = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: 'avatar.jpg',
        bio: 'Bio',
        emailVerified: true,
        roles: [],
      };
      usersService.softDeleteUserAccount.mockResolvedValue(mockProfile);

      const result = await controller.deleteMe(mockUser);

      expect(result).toEqual({
        message: 'User account deleted successfully',
        data: mockProfile,
      });
      expect(usersService.softDeleteUserAccount).toHaveBeenCalledWith('1');
    });
  });

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      const mockUser: AuthenticatedUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        roles: [],
        permissions: [],
      };
      const mockPrefs: GetPreferencesDto = {
        theme: themeEnum.LIGHT,
        language: 'en',
        notifications: true,
        privacyLevel: privacyLevelEnum.PUBLIC,
      };
      usersService.getUserPreferences.mockResolvedValue(mockPrefs);

      const result = await controller.getPreferences(mockUser);

      expect(result).toEqual(mockPrefs);
      expect(usersService.getUserPreferences).toHaveBeenCalledWith('1');
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      const mockUser: AuthenticatedUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        roles: [],
        permissions: [],
      };
      const patchDto: PatchPreferencesDto = { theme: themeEnum.DARK };
      const mockPrefs: GetPreferencesDto = {
        theme: themeEnum.DARK,
        language: 'en',
        notifications: true,
        privacyLevel: privacyLevelEnum.PUBLIC,
      };
      usersService.updateUserPreferences.mockResolvedValue(mockPrefs);

      const result = await controller.updatePreferences(mockUser, patchDto);

      expect(result).toEqual(mockPrefs);
      expect(usersService.updateUserPreferences).toHaveBeenCalledWith(
        '1',
        patchDto,
      );
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const query: GetUsersQueryDto = { page: 1, limit: 10 };
      const mockResult: PaginatedResult<GetUserDto> = {
        data: [],
        meta: {
          totalItems: 0,
          totalPages: 0,
          currentPage: 1,
          pageSize: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
      usersService.getAllUsers.mockResolvedValue(mockResult);

      const result = await controller.getAllUsers(query);

      expect(result).toEqual(mockResult);
      expect(usersService.getAllUsers).toHaveBeenCalledWith(query);
    });
  });

  describe('searchUsers', () => {
    it('should search users', async () => {
      const searchDto: SearchUsersDto = {
        username: 'test',
        page: 1,
        limit: 10,
      };
      const mockResult: PaginatedResult<GetPublicProfileDto> = {
        data: [],
        meta: {
          totalItems: 0,
          pageSize: 0,
          totalPages: 0,
          currentPage: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
      usersService.searchUsers.mockResolvedValue(mockResult);

      const result = await controller.searchUsers(searchDto);

      expect(result).toEqual(mockResult);
      expect(usersService.searchUsers).toHaveBeenCalledWith(searchDto);
    });
  });

  describe('searchUsersAdmin', () => {
    it('should search users for admin', async () => {
      const searchDto: SearchUsersAdminDto = {
        username: 'test',
        page: 1,
        limit: 10,
      };
      const mockResult: PaginatedResult<GetUserDto> = {
        data: [],
        meta: {
          totalItems: 0,
          pageSize: 0,
          totalPages: 0,
          currentPage: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
      usersService.searchUsersAdmin.mockResolvedValue(mockResult);

      const result = await controller.searchUsersAdmin(searchDto);

      expect(result).toEqual(mockResult);
      expect(usersService.searchUsersAdmin).toHaveBeenCalledWith(searchDto);
    });
  });

  describe('getUserPublicProfile', () => {
    it('should return public profile by id', async () => {
      const id: UUID = '123e4567-e89b-12d3-a456-426614174000';
      const mockProfile: GetPublicProfileDto = {
        id: '1',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: 'avatar.jpg',
        bio: 'Bio',
      };
      usersService.getUserPublicProfile.mockResolvedValue(mockProfile);

      const result = await controller.getUserPublicProfile(id);

      expect(result).toEqual(mockProfile);
      expect(usersService.getUserPublicProfile).toHaveBeenCalledWith(id);
    });
  });

  describe('banUserById', () => {
    it('should ban user by id', async () => {
      const id: UUID = '123e4567-e89b-12d3-a456-426614174000';
      const mockUser: GetUserDto = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: 'avatar.jpg',
        bio: 'Bio',
        emailVerified: true,
        roles: [],
        userStatus: UserStatus.BANNED,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        lastLogin: '2023-01-01T00:00:00Z',
        permissions: [],
      };
      usersService.banUserById.mockResolvedValue(mockUser);

      const result = await controller.banUserById(id);

      expect(result).toEqual(mockUser);
      expect(usersService.banUserById).toHaveBeenCalledWith(id);
    });
  });

  describe('restoreUser', () => {
    it('should restore user by id', async () => {
      const id: UUID = '123e4567-e89b-12d3-a456-426614174000';
      const mockUser: GetUserDto = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: 'avatar.jpg',
        bio: 'Bio',
        emailVerified: true,
        roles: [],
        userStatus: UserStatus.ACTIVE,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        lastLogin: '2023-01-01T00:00:00Z',
        permissions: [],
      };
      usersService.restoreUserById.mockResolvedValue(mockUser);

      const result = await controller.restoreUser(id);

      expect(result).toEqual(mockUser);
      expect(usersService.restoreUserById).toHaveBeenCalledWith(id);
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const id: UUID = '123e4567-e89b-12d3-a456-426614174000';
      const mockUser: GetUserDto = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: 'avatar.jpg',
        bio: 'Bio',
        emailVerified: true,
        roles: [],
        userStatus: UserStatus.ACTIVE,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        lastLogin: '2023-01-01T00:00:00Z',
        permissions: [],
      };
      usersService.getUserById.mockResolvedValue(mockUser);

      const result = await controller.getUserById(id);

      expect(result).toEqual(mockUser);
      expect(usersService.getUserById).toHaveBeenCalledWith(id);
    });
  });
});
