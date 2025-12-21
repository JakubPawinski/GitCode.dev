import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SocialService } from './social.service';
import { PrismaService } from '../../prisma/prisma.service';
import { FriendRequestStatus } from '../enums/friendRequest.enum';
import {
  GetFriendDto,
  InviteFriendDto,
  FriendRequestDto,
  RespondFriendRequestDto,
} from '../dtos';
import { EventBus } from '@gitcode/messaging';
describe('SocialService', () => {
  let service: SocialService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      friendRequest: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const mockEventBus = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    service = module.get<SocialService>(SocialService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFriends', () => {
    it('should return list of friends', async () => {
      const mockFriendRequests = [
        {
          requester: {
            id: '1',
            username: 'user1',
            avatarUrl: 'avatar1.jpg',
            firstName: 'First1',
            lastName: 'Last1',
          },
          addressee: {
            id: '2',
            username: 'user2',
            avatarUrl: 'avatar2.jpg',
            firstName: 'First2',
            lastName: 'Last2',
          },
        },
      ];
      (prismaService.friendRequest.findMany as jest.Mock).mockResolvedValue(
        mockFriendRequests,
      );

      const result = await service.getFriends('1');

      expect(result).toEqual([
        {
          id: '2',
          username: 'user2',
          avatarUrl: 'avatar2.jpg',
          firstName: 'First2',
          lastName: 'Last2',
        },
      ] as GetFriendDto[]);
      expect(prismaService.friendRequest.findMany).toHaveBeenCalledWith({
        where: {
          status: FriendRequestStatus.ACCEPTED,
          OR: [{ requesterId: '1' }, { addresseeId: '1' }],
        },
        select: {
          requester: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              firstName: true,
              lastName: true,
            },
          },
          addressee: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    });

    it('should return empty list if no friends', async () => {
      (prismaService.friendRequest.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getFriends('1');

      expect(result).toEqual([]);
    });
  });

  describe('sendFriendRequest', () => {
    it('should send friend request and return mapped request', async () => {
      const mockFriendRequest = {
        id: 'req1',
        requester: {
          id: '1',
          username: 'user1',
          avatarUrl: 'avatar1.jpg',
          firstName: 'First1',
          lastName: 'Last1',
        },
        addressee: {
          id: '2',
          username: 'user2',
          avatarUrl: 'avatar2.jpg',
          firstName: 'First2',
          lastName: 'Last2',
        },
        status: FriendRequestStatus.PENDING,
      };
      (prismaService.friendRequest.create as jest.Mock).mockResolvedValue(
        mockFriendRequest,
      );

      const inviteDto: InviteFriendDto = { addresseeId: '2' };
      const result = await service.sendFriendRequest('1', inviteDto);

      expect(result).toEqual({
        id: 'req1',
        requester: {
          requesterId: '1',
          username: 'user1',
          avatarUrl: 'avatar1.jpg',
          firstName: 'First1',
          lastName: 'Last1',
        },
        addressee: {
          addresseeId: '2',
          username: 'user2',
          avatarUrl: 'avatar2.jpg',
          firstName: 'First2',
          lastName: 'Last2',
        },
        status: FriendRequestStatus.PENDING,
      } as FriendRequestDto);
      expect(prismaService.friendRequest.create).toHaveBeenCalledWith({
        data: {
          requesterId: '1',
          addresseeId: '2',
          status: FriendRequestStatus.PENDING,
        },
        select: {
          id: true,
          requester: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              firstName: true,
              lastName: true,
            },
          },
          addressee: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              firstName: true,
              lastName: true,
            },
          },
          status: true,
        },
      });
    });
  });

  describe('respondToFriendRequest', () => {
    it('should respond to friend request and return updated request', async () => {
      const mockUpdatedRequest = {
        id: 'req1',
        requester: {
          id: '1',
          username: 'user1',
          avatarUrl: 'avatar1.jpg',
          firstName: 'First1',
          lastName: 'Last1',
        },
        addressee: {
          id: '2',
          username: 'user2',
          avatarUrl: 'avatar2.jpg',
          firstName: 'First2',
          lastName: 'Last2',
        },
        status: FriendRequestStatus.ACCEPTED,
      };
      (prismaService.friendRequest.update as jest.Mock).mockResolvedValue(
        mockUpdatedRequest,
      );

      const respondDto: RespondFriendRequestDto = {
        status: FriendRequestStatus.ACCEPTED,
      };
      const result = await service.respondToFriendRequest('req1', respondDto);

      expect(result).toEqual({
        id: 'req1',
        requester: {
          requesterId: '1',
          username: 'user1',
          avatarUrl: 'avatar1.jpg',
          firstName: 'First1',
          lastName: 'Last1',
        },
        addressee: {
          addresseeId: '2',
          username: 'user2',
          avatarUrl: 'avatar2.jpg',
          firstName: 'First2',
          lastName: 'Last2',
        },
        status: FriendRequestStatus.ACCEPTED,
      } as FriendRequestDto);
      expect(prismaService.friendRequest.update).toHaveBeenCalledWith({
        where: { id: 'req1' },
        data: { status: FriendRequestStatus.ACCEPTED },
        select: {
          id: true,
          requester: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              firstName: true,
              lastName: true,
            },
          },
          addressee: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              firstName: true,
              lastName: true,
            },
          },
          status: true,
        },
      });
    });
  });

  describe('removeFriend', () => {
    it('should remove friend and return success message', async () => {
      const mockFriendRequest = {
        id: 'req1',
        requesterId: '1',
        addresseeId: '2',
        status: FriendRequestStatus.ACCEPTED,
      };
      (prismaService.friendRequest.findFirst as jest.Mock).mockResolvedValue(
        mockFriendRequest,
      );
      (prismaService.friendRequest.deleteMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

      const result = await service.removeFriend('1', '2');

      expect(result).toEqual({
        message: 'Friend removed successfully',
        success: true,
        removedFriendIds: '2',
      });
      expect(prismaService.friendRequest.findFirst).toHaveBeenCalledWith({
        where: {
          status: FriendRequestStatus.ACCEPTED,
          OR: [
            { requesterId: '1', addresseeId: '2' },
            { requesterId: '2', addresseeId: '1' },
          ],
        },
      });
      expect(prismaService.friendRequest.deleteMany).toHaveBeenCalledWith({
        where: {
          status: FriendRequestStatus.ACCEPTED,
          OR: [
            { requesterId: '1', addresseeId: '2' },
            { requesterId: '2', addresseeId: '1' },
          ],
        },
      });
    });

    it('should throw NotFoundException if friend not found', async () => {
      (prismaService.friendRequest.findFirst as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(service.removeFriend('1', '2')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getFriendRequests', () => {
    it('should return list of friend requests', async () => {
      const mockRequests = [
        {
          id: 'req1',
          requester: {
            id: '1',
            username: 'user1',
            avatarUrl: 'avatar1.jpg',
            firstName: 'First1',
            lastName: 'Last1',
          },
          addressee: {
            id: '2',
            username: 'user2',
            avatarUrl: 'avatar2.jpg',
            firstName: 'First2',
            lastName: 'Last2',
          },
          status: FriendRequestStatus.PENDING,
        },
      ];
      (prismaService.friendRequest.findMany as jest.Mock).mockResolvedValue(
        mockRequests,
      );

      const result = await service.getFriendRequests('2');

      expect(result).toEqual([
        {
          id: 'req1',
          requester: {
            requesterId: '1',
            username: 'user1',
            avatarUrl: 'avatar1.jpg',
            firstName: 'First1',
            lastName: 'Last1',
          },
          addressee: {
            addresseeId: '2',
            username: 'user2',
            avatarUrl: 'avatar2.jpg',
            firstName: 'First2',
            lastName: 'Last2',
          },
          status: FriendRequestStatus.PENDING,
        },
      ] as FriendRequestDto[]);
      expect(prismaService.friendRequest.findMany).toHaveBeenCalledWith({
        where: {
          addresseeId: '2',
          status: {
            in: [FriendRequestStatus.PENDING, FriendRequestStatus.REJECTED],
          },
        },
        select: {
          id: true,
          requester: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              firstName: true,
              lastName: true,
            },
          },
          addressee: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              firstName: true,
              lastName: true,
            },
          },
          status: true,
        },
      });
    });

    it('should return empty list if no requests', async () => {
      (prismaService.friendRequest.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getFriendRequests('2');

      expect(result).toEqual([]);
    });
  });
});
