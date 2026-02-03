import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../../auth/auth.service';
import {
  PatchProfileDto,
  PatchPreferencesDto,
  SearchUsersDto,
  SearchUsersAdminDto,
} from '../dtos';
import {
  AppRole,
  AppPermission,
  UserStatus,
  themeEnum,
  privacyLevelEnum,
} from '@gitcode/types';
import { PaginationQueryDto } from '@gitcode/common';
import { EventBus } from '@gitcode/messaging';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: jest.Mocked<PrismaService>;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        deleteMany: jest.fn(),
      },
      userPreferences: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      oAuthToken: {
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const mockAuthService = {
      revokeAllUserTokens: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get(PrismaService);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserProfile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: 'avatar.jpg',
        bio: 'Bio',
        emailVerified: true,
        roles: [AppRole.USER],
      };
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.getUserProfile('1');

      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: 'avatar.jpg',
        bio: 'Bio',
        emailVerified: true,
        roles: [AppRole.USER],
      });
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getUserProfile('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUserPublicProfile', () => {
    it('should return public profile for active user', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: 'avatar.jpg',
        bio: 'Bio',
        userStatus: UserStatus.ACTIVE,
      };
      jest.spyOn(service, 'getUserById').mockResolvedValue(mockUser as any);

      const result = await service.getUserPublicProfile('1');

      expect(result).toEqual({
        id: '1',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: 'avatar.jpg',
        bio: 'Bio',
      });
    });

    it('should throw NotFoundException if user not active', async () => {
      const mockUser = {
        id: '1',
        userStatus: UserStatus.BANNED,
      };
      jest.spyOn(service, 'getUserById').mockResolvedValue(mockUser as any);

      await expect(service.getUserPublicProfile('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateUserProfile', () => {
    it('should update and return user profile', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Updated',
        lastName: 'User',
        avatarUrl: 'avatar.jpg',
        bio: 'New Bio',
        emailVerified: true,
        roles: [AppRole.USER],
      };
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        bio: 'Updated bio',
      });

      const patchDto: PatchProfileDto = { bio: 'Updated bio' };
      const result = await service.updateUserProfile('1', patchDto);

      expect(result.bio).toBe('Updated bio');
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: patchDto,
        omit: { permissions: true },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateUserProfile('1', {} as PatchProfileDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDeleteUserAccount', () => {
    it('should soft delete user', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: 'avatar.jpg',
        bio: 'Bio',
        emailVerified: true,
        roles: [AppRole.USER],
      };
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        userStatus: UserStatus.DELETED,
      });

      const result = await service.softDeleteUserAccount('1');

      expect(result.id).toBe('1');
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { userStatus: UserStatus.DELETED },
        omit: { permissions: true },
      });
    });
  });

  describe('getUserPreferences', () => {
    it('should return user preferences', async () => {
      const mockPrefs = {
        theme: themeEnum.LIGHT,
        language: 'en',
        privacyLevel: privacyLevelEnum.PUBLIC,
      };
      (prismaService.userPreferences.findUnique as jest.Mock).mockResolvedValue(
        mockPrefs,
      );
      (prismaService.userPreferences.update as jest.Mock).mockResolvedValue(
        mockPrefs,
      );

      const result = await service.getUserPreferences('1');

      expect(result).toEqual(mockPrefs);
    });

    it('should throw NotFoundException if preferences not found', async () => {
      (prismaService.userPreferences.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(service.getUserPreferences('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateUserPreferences', () => {
    it('should update preferences', async () => {
      const mockPrefs = {
        theme: themeEnum.DARK,
        language: 'pl',
        notifications: false,
        privacyLevel: privacyLevelEnum.PRIVATE,
      };
      (prismaService.userPreferences.findUnique as jest.Mock).mockResolvedValue(
        mockPrefs,
      );
      (prismaService.userPreferences.update as jest.Mock).mockResolvedValue(
        mockPrefs,
      );

      const patchDto: PatchPreferencesDto = { theme: themeEnum.DARK };
      const result = await service.updateUserPreferences('1', patchDto);

      expect(result.theme).toBe(themeEnum.DARK);
    });
  });

  describe('getUserById', () => {
    it('should return full user data', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: 'avatar.jpg',
        bio: 'Bio',
        emailVerified: true,
        roles: [AppRole.USER],
        userStatus: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
        permissions: [AppPermission.USER_READ_SELF],
        preferences: {
          theme: themeEnum.LIGHT,
          language: 'en',
          notifications: true,
          privacyLevel: privacyLevelEnum.PUBLIC,
        },
      };
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.getUserById('1');

      expect(result.id).toBe('1');
      expect(result.preferences).toBeDefined();
    });
  });

  describe('getAllUsers', () => {
    it('should return paginated users', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          avatarUrl: 'avatar.jpg',
          bio: 'Bio',
          emailVerified: true,
          roles: [AppRole.USER],
          userStatus: UserStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: new Date(),
          permissions: [AppPermission.USER_READ_SELF],
          preferences: null,
        },
      ];
      (prismaService.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prismaService.user.count as jest.Mock).mockResolvedValue(1);

      const query: PaginationQueryDto = { page: 1, limit: 10 };
      const result = await service.getAllUsers(query);

      expect(result.data).toHaveLength(1);
      expect(result.meta.totalItems).toBe(1);
    });
  });

  describe('banUserById', () => {
    it('should ban user and revoke tokens', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: 'avatar.jpg',
        bio: 'Bio',
        emailVerified: true,
        roles: [AppRole.USER],
        userStatus: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
        permissions: [AppPermission.USER_READ_SELF],
        preferences: null,
      };
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      prismaService.$transaction.mockResolvedValue([
        {
          ...mockUser,
          userStatus: UserStatus.BANNED,
        },
      ]);

      const result = await service.banUserById('1');

      expect(result.userStatus).toBe(UserStatus.BANNED);
    });
  });

  describe('searchUsers', () => {
    it('should return paginated public profiles', async () => {
      const mockUsers = [
        {
          id: '1',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          avatarUrl: 'avatar.jpg',
          bio: 'Bio',
        },
      ];
      (prismaService.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prismaService.user.count as jest.Mock).mockResolvedValue(1);

      const searchDto: SearchUsersDto = {
        username: 'test',
        page: 1,
        limit: 10,
      };
      const result = await service.searchUsers(searchDto);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].username).toBe('testuser');
    });
  });

  describe('searchUsersAdmin', () => {
    it('should return paginated full user data for admin', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'test@example.com',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          avatarUrl: 'avatar.jpg',
          bio: 'Bio',
          emailVerified: true,
          roles: [AppRole.USER],
          userStatus: UserStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: new Date(),
          permissions: [AppPermission.USER_READ_SELF],
          preferences: null,
        },
      ];
      (prismaService.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prismaService.user.count as jest.Mock).mockResolvedValue(1);

      const searchDto: SearchUsersAdminDto = {
        username: 'test',
        page: 1,
        limit: 10,
      };
      const result = await service.searchUsersAdmin(searchDto);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].email).toBe('test@example.com');
    });
  });

  describe('restoreUserById', () => {
    it('should restore user', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: 'avatar.jpg',
        bio: 'Bio',
        emailVerified: true,
        roles: [AppRole.USER],
        userStatus: UserStatus.BANNED,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
        permissions: [AppPermission.USER_READ_SELF],
      };
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        userStatus: UserStatus.ACTIVE,
      });

      const result = await service.restoreUserById('1');

      expect(result.userStatus).toBe(UserStatus.ACTIVE);
    });
  });
});
