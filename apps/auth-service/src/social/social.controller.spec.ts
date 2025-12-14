import { Test, TestingModule } from '@nestjs/testing';
import { SocialController } from './social.controller';
import { SocialService } from './providers/social.service';
import { GetFriendDto } from './dtos/get-friend.dto';
import { InviteFriendDto } from './dtos/invite-friend.dto';
import { FriendRequestDto } from './dtos/friend-request.dto';
import { RespondFriendRequestDto } from './dtos/respond-friend-request.dto';
import { FriendRequestStatus } from './enums/friendRequest.enum';
import type { AuthenticatedUser, UUID } from '@gitcode/types';

describe('SocialController', () => {
  let controller: SocialController;
  let socialService: jest.Mocked<SocialService>;

  beforeEach(async () => {
    const mockSocialService = {
      getFriends: jest.fn(),
      getFriendRequests: jest.fn(),
      sendFriendRequest: jest.fn(),
      respondToFriendRequest: jest.fn(),
      removeFriend: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SocialController],
      providers: [
        {
          provide: SocialService,
          useValue: mockSocialService,
        },
      ],
    }).compile();

    controller = module.get<SocialController>(SocialController);
    socialService = module.get(SocialService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFriends', () => {
    it('should return list of friends', async () => {
      const mockUser: AuthenticatedUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        roles: [],
        permissions: [],
      };
      const mockFriends: GetFriendDto[] = [
        {
          id: '2',
          username: 'friend1',
          firstName: 'Friend',
          lastName: 'One',
          avatarUrl: 'avatar1.jpg',
        },
      ];
      socialService.getFriends.mockResolvedValue(mockFriends);

      const result = await controller.getFriends(mockUser);

      expect(result).toEqual(mockFriends);
      expect(socialService.getFriends).toHaveBeenCalledWith('1');
    });
  });

  describe('getFriendRequests', () => {
    it('should return list of friend requests', async () => {
      const mockUser: AuthenticatedUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        roles: [],
        permissions: [],
      };
      const mockRequests: FriendRequestDto[] = [
        {
          id: 'req1',
          requester: {
            requesterId: '2',
            username: 'requester1',
            avatarUrl: 'avatar2.jpg',
            firstName: 'Requester',
            lastName: 'One',
          },
          addressee: {
            addresseeId: '1',
            username: 'testuser',
            avatarUrl: 'avatar1.jpg',
            firstName: 'Test',
            lastName: 'User',
          },
          status: FriendRequestStatus.PENDING,
        },
      ];
      socialService.getFriendRequests.mockResolvedValue(mockRequests);

      const result = await controller.getFriendRequests(mockUser);

      expect(result).toEqual(mockRequests);
      expect(socialService.getFriendRequests).toHaveBeenCalledWith('1');
    });
  });

  describe('sendFriendRequest', () => {
    it('should send friend request and return request data', async () => {
      const mockUser: AuthenticatedUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        roles: [],
        permissions: [],
      };
      const inviteDto: InviteFriendDto = { addresseeId: '2' };
      const mockRequest: FriendRequestDto = {
        id: 'req1',
        requester: {
          requesterId: '1',
          username: 'testuser',
          avatarUrl: 'avatar1.jpg',
          firstName: 'Test',
          lastName: 'User',
        },
        addressee: {
          addresseeId: '2',
          username: 'friend1',
          avatarUrl: 'avatar2.jpg',
          firstName: 'Friend',
          lastName: 'One',
        },
        status: FriendRequestStatus.PENDING,
      };
      socialService.sendFriendRequest.mockResolvedValue(mockRequest);

      const result = await controller.sendFriendRequest(mockUser, inviteDto);

      expect(result).toEqual(mockRequest);
      expect(socialService.sendFriendRequest).toHaveBeenCalledWith(
        '1',
        inviteDto,
      );
    });
  });

  describe('respondToFriendRequest', () => {
    it('should respond to friend request and return updated request', async () => {
      const requestId: UUID = '123e4567-e89b-12d3-a456-426614174000';
      const respondDto: RespondFriendRequestDto = {
        status: FriendRequestStatus.ACCEPTED,
      };
      const mockUpdatedRequest: FriendRequestDto = {
        id: 'req1',
        requester: {
          requesterId: '2',
          username: 'requester1',
          avatarUrl: 'avatar2.jpg',
          firstName: 'Requester',
          lastName: 'One',
        },
        addressee: {
          addresseeId: '1',
          username: 'testuser',
          avatarUrl: 'avatar1.jpg',
          firstName: 'Test',
          lastName: 'User',
        },
        status: FriendRequestStatus.ACCEPTED,
      };
      socialService.respondToFriendRequest.mockResolvedValue(
        mockUpdatedRequest,
      );

      const result = await controller.respondToFriendRequest(
        requestId,
        respondDto,
      );

      expect(result).toEqual(mockUpdatedRequest);
      expect(socialService.respondToFriendRequest).toHaveBeenCalledWith(
        requestId,
        respondDto,
      );
    });
  });

  describe('removeFriend', () => {
    it('should remove friend and return success message', async () => {
      const mockUser: AuthenticatedUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        roles: [],
        permissions: [],
      };
      const userId: UUID = '123e4567-e89b-12d3-a456-426614174000';
      const mockResponse = {
        message: 'Friend removed successfully',
        success: true,
        removedFriendIds: '2',
      };
      socialService.removeFriend.mockResolvedValue(mockResponse);

      const result = await controller.removeFriend(mockUser, userId);

      expect(result).toEqual(mockResponse);
      expect(socialService.removeFriend).toHaveBeenCalledWith('1', userId);
    });
  });

  describe('getLeaderboard', () => {
    it('should be defined but not implemented', async () => {
      // TODO: implement test when leaderboard is ready
      const result = await controller.getLeaderboard();
      expect(result).toBeUndefined();
    });
  });
});
