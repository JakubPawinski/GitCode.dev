import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UsersController } from './users.controller';
import { UsersService } from './providers/users.service';
import {
  PatchProfileDto,
  GetPreferencesDto,
  PatchPreferencesDto,
  GetPublicProfileDto,
  GetUserDto,
  SearchUsersDto,
  SearchUsersAdminDto,
  GetProfileDto,
} from './dtos';
import {
  PaginatedResult,
  privacyLevelEnum,
  themeEnum,
  UserStatus,
} from '@gitcode/types';
import type { AuthenticatedUser, UUID } from '@gitcode/types';
import { PaginationQueryDto } from '@gitcode/common';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;
  let configService: jest.Mocked<ConfigService>;

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

    const mockConfigService = {
      get: jest.fn(),
      getOrThrow: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMe', () => {
    it('should return user profile', async () => {
      // Arrange
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

      // Act
      const result = await controller.getMe(mockUser);

      // Assert
      expect(result).toEqual(mockProfile);
      expect(usersService.getUserProfile).toHaveBeenCalledWith('1');
    });
  });

  describe('updateMe', () => {
    it('should update user profile', async () => {
      // Arrange
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

      // Act
      const result = await controller.updateMe(mockUser, patchDto);

      // Assert
      expect(result).toEqual(mockProfile);
      expect(usersService.updateUserProfile).toHaveBeenCalledWith('1', patchDto);
    });

    it('should update user avatar', async () => {
      // Arrange
      const mockUser: AuthenticatedUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        roles: [],
        permissions: [],
      };
      const patchDto: PatchProfileDto = {
        avatarUrl: 'https://example.com/new-avatar.jpg',
      };
      const mockProfile: GetProfileDto = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: 'https://example.com/new-avatar.jpg',
        bio: 'Bio',
        emailVerified: true,
        roles: [],
      };
      usersService.updateUserProfile.mockResolvedValue(mockProfile);

      // Act
      const result = await controller.updateMe(mockUser, patchDto);

      // Assert
      expect(result).toEqual(mockProfile);
      expect(usersService.updateUserProfile).toHaveBeenCalledWith('1', patchDto);
    });
  });

  describe('deleteMe', () => {
    it('should delete user account', async () => {
      // Arrange
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

      // Act
      const result = await controller.deleteMe(mockUser);

      // Assert
      expect(result).toEqual({
        message: 'User account deleted successfully',
        data: mockProfile,
      });
      expect(usersService.softDeleteUserAccount).toHaveBeenCalledWith('1');
    });
  });

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      // Arrange
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
        privacyLevel: privacyLevelEnum.PUBLIC,
      };
      usersService.getUserPreferences.mockResolvedValue(mockPrefs);

      // Act
      const result = await controller.getPreferences(mockUser);

      // Assert
      expect(result).toEqual(mockPrefs);
      expect(usersService.getUserPreferences).toHaveBeenCalledWith('1');
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      // Arrange
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
        privacyLevel: privacyLevelEnum.PUBLIC,
      };
      usersService.updateUserPreferences.mockResolvedValue(mockPrefs);

      // Act
      const result = await controller.updatePreferences(mockUser, patchDto);

      // Assert
      expect(result).toEqual(mockPrefs);
      expect(usersService.updateUserPreferences).toHaveBeenCalledWith(
        '1',
        patchDto,
      );
    });

    it('should update multiple preferences', async () => {
      // Arrange
      const mockUser: AuthenticatedUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        roles: [],
        permissions: [],
      };
      const patchDto: PatchPreferencesDto = {
        theme: themeEnum.DARK,
        language: 'pl',
      };
      const mockPrefs: GetPreferencesDto = {
        theme: themeEnum.DARK,
        language: 'pl',
        privacyLevel: privacyLevelEnum.PUBLIC,
      };
      usersService.updateUserPreferences.mockResolvedValue(mockPrefs);

      // Act
      const result = await controller.updatePreferences(mockUser, patchDto);

      // Assert
      expect(result).toEqual(mockPrefs);
      expect(usersService.updateUserPreferences).toHaveBeenCalledWith(
        '1',
        patchDto,
      );
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      // Arrange
      const query: PaginationQueryDto = { page: 1, limit: 10 };
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

      // Act
      const result = await controller.getAllUsers(query);

      // Assert
      expect(result).toEqual(mockResult);
      expect(usersService.getAllUsers).toHaveBeenCalledWith(query);
    });

    it('should return paginated users', async () => {
      // Arrange
      const query: PaginationQueryDto = { page: 2, limit: 20 };
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
      const mockResult: PaginatedResult<GetUserDto> = {
        data: [mockUser],
        meta: {
          totalItems: 1,
          totalPages: 1,
          currentPage: 2,
          pageSize: 20,
          hasNextPage: false,
          hasPreviousPage: true,
        },
      };
      usersService.getAllUsers.mockResolvedValue(mockResult);

      // Act
      const result = await controller.getAllUsers(query);

      // Assert
      expect(result).toEqual(mockResult);
      expect(usersService.getAllUsers).toHaveBeenCalledWith(query);
    });
  });

  describe('searchUsers', () => {
    it('should search users', async () => {
      // Arrange
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

      // Act
      const result = await controller.searchUsers(searchDto);

      // Assert
      expect(result).toEqual(mockResult);
      expect(usersService.searchUsers).toHaveBeenCalledWith(searchDto);
    });

    it('should search users with results', async () => {
      // Arrange
      const searchDto: SearchUsersDto = {
        username: 'test',
        page: 1,
        limit: 10,
      };
      const mockProfile: GetPublicProfileDto = {
        id: '1',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: 'avatar.jpg',
        bio: 'Bio',
      };
      const mockResult: PaginatedResult<GetPublicProfileDto> = {
        data: [mockProfile],
        meta: {
          totalItems: 1,
          pageSize: 10,
          totalPages: 1,
          currentPage: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
      usersService.searchUsers.mockResolvedValue(mockResult);

      // Act
      const result = await controller.searchUsers(searchDto);

      // Assert
      expect(result).toEqual(mockResult);
      expect(usersService.searchUsers).toHaveBeenCalledWith(searchDto);
    });
  });

  describe('searchUsersAdmin', () => {
    it('should search users for admin', async () => {
      // Arrange
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

      // Act
      const result = await controller.searchUsersAdmin(searchDto);

      // Assert
      expect(result).toEqual(mockResult);
      expect(usersService.searchUsersAdmin).toHaveBeenCalledWith(searchDto);
    });
  });

  describe('getUserPublicProfile', () => {
    it('should return public profile by id', async () => {
      // Arrange
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

      // Act
      const result = await controller.getUserPublicProfile(id);

      // Assert
      expect(result).toEqual(mockProfile);
      expect(usersService.getUserPublicProfile).toHaveBeenCalledWith(id);
    });
  });

  describe('banUserById', () => {
    it('should ban user by id', async () => {
      // Arrange
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

      // Act
      const result = await controller.banUserById(id);

      // Assert
      expect(result).toEqual(mockUser);
      expect(result.userStatus).toBe(UserStatus.BANNED);
      expect(usersService.banUserById).toHaveBeenCalledWith(id);
    });
  });

  describe('restoreUser', () => {
    it('should restore user by id', async () => {
      // Arrange
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

      // Act
      const result = await controller.restoreUser(id);

      // Assert
      expect(result).toEqual(mockUser);
      expect(result.userStatus).toBe(UserStatus.ACTIVE);
      expect(usersService.restoreUserById).toHaveBeenCalledWith(id);
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      // Arrange
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

      // Act
      const result = await controller.getUserById(id);

      // Assert
      expect(result).toEqual(mockUser);
      expect(usersService.getUserById).toHaveBeenCalledWith(id);
    });

    it('should return user by id - internal endpoint', async () => {
      // Arrange
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

      // Act
      const result = await controller.getUserByIdInternal(id);

      // Assert
      expect(result).toEqual(mockUser);
      expect(usersService.getUserById).toHaveBeenCalledWith(id);
    });
  });
});