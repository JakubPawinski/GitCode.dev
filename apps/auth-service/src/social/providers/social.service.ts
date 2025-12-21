import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FriendRequestStatus } from '../enums/friendRequest.enum';
import { UUID } from '@gitcode/types';
import {
  GetFriendDto,
  InviteFriendDto,
  FriendRequestDto,
  RespondFriendRequestDto,
} from '../dtos';
import { EventBus } from '@gitcode/messaging';
import {
  FriendshipAcceptedEvent,
  FriendshipDeclinedEvent,
  FriendshipRequestedEvent,
  SOCIAL_PATTERNS,
} from '@gitcode/contracts';
@Injectable()
export class SocialService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  /*
   * Get all friends for a user
   */
  public async getFriends(userId: string): Promise<GetFriendDto[]> {
    const foundFriends = await this.prismaService.friendRequest.findMany({
      where: {
        status: FriendRequestStatus.ACCEPTED,
        OR: [{ requesterId: userId }, { addresseeId: userId }],
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

    const mappedFriends = foundFriends.map((friendRequest) => {
      const friend =
        friendRequest.requester.id === userId
          ? friendRequest.addressee
          : friendRequest.requester;

      return {
        id: friend.id,
        username: friend.username,
        avatarUrl: friend.avatarUrl,
        firstName: friend.firstName,
        lastName: friend.lastName,
      };
    });

    return mappedFriends;
  }

  /*
   * Send a friend request
   */
  public async sendFriendRequest(
    senderId: UUID,
    inviteFriendDto: InviteFriendDto,
  ): Promise<FriendRequestDto> {
    const { addresseeId } = inviteFriendDto;

    const friendRequest = await this.prismaService.friendRequest.create({
      data: {
        requesterId: senderId,
        addresseeId,
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

    // Create event for friend request sent
    await this.eventBus.publish(
      SOCIAL_PATTERNS.FRIENDSHIP_REQUESTED,
      new FriendshipRequestedEvent(
        friendRequest.id,
        senderId,
        friendRequest.requester.username,
        addresseeId,
        friendRequest.addressee.username,
      ),
    );

    const mappedFriendRequest: FriendRequestDto = {
      id: friendRequest.id,
      requester: {
        requesterId: friendRequest.requester.id,
        username: friendRequest.requester.username,
        avatarUrl: friendRequest.requester.avatarUrl,
        firstName: friendRequest.requester.firstName,
        lastName: friendRequest.requester.lastName,
      },
      addressee: {
        addresseeId: friendRequest.addressee.id,
        username: friendRequest.addressee.username,
        avatarUrl: friendRequest.addressee.avatarUrl,
        firstName: friendRequest.addressee.firstName,
        lastName: friendRequest.addressee.lastName,
      },
      status: friendRequest.status as FriendRequestStatus,
    };

    return mappedFriendRequest;
  }

  /*
   * Respond to a friend request
   */
  public async respondToFriendRequest(
    requestId: UUID,
    respondFriendRequestDto: RespondFriendRequestDto,
  ): Promise<FriendRequestDto> {
    const { status } = respondFriendRequestDto;

    const updatedFriendRequest = await this.prismaService.friendRequest.update({
      where: {
        id: requestId,
      },
      data: {
        status,
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

    // Create event for friend request response
    switch (status) {
      case FriendRequestStatus.ACCEPTED:
        await this.eventBus.publish(
          SOCIAL_PATTERNS.FRIENDSHIP_ACCEPTED,
          new FriendshipAcceptedEvent(
            updatedFriendRequest.id,
            updatedFriendRequest.requester.id,
            updatedFriendRequest.requester.username,
            updatedFriendRequest.addressee.id,
            updatedFriendRequest.addressee.username,
          ),
        );
        break;
      case FriendRequestStatus.REJECTED:
        await this.eventBus.publish(
          SOCIAL_PATTERNS.FRIENDSHIP_DECLINED,
          new FriendshipDeclinedEvent(
            updatedFriendRequest.id,
            updatedFriendRequest.requester.id,
            updatedFriendRequest.requester.username,
            updatedFriendRequest.addressee.id,
            updatedFriendRequest.addressee.username,
          ),
        );
        break;
      default:
        break;
    }

    const mappedFriendRequest: FriendRequestDto = {
      id: updatedFriendRequest.id,
      requester: {
        requesterId: updatedFriendRequest.requester.id,
        username: updatedFriendRequest.requester.username,
        avatarUrl: updatedFriendRequest.requester.avatarUrl,
        firstName: updatedFriendRequest.requester.firstName,
        lastName: updatedFriendRequest.requester.lastName,
      },
      addressee: {
        addresseeId: updatedFriendRequest.addressee.id,
        username: updatedFriendRequest.addressee.username,
        avatarUrl: updatedFriendRequest.addressee.avatarUrl,
        firstName: updatedFriendRequest.addressee.firstName,
        lastName: updatedFriendRequest.addressee.lastName,
      },
      status: updatedFriendRequest.status as FriendRequestStatus,
    };

    return mappedFriendRequest;
  }

  /*
   * Remove a friend
   */
  public async removeFriend(
    userId: UUID,
    friendId: UUID,
  ): Promise<{ message: string; success: boolean; removedFriendIds: UUID }> {
    const whereCondition = {
      status: FriendRequestStatus.ACCEPTED,
      OR: [
        { requesterId: userId, addresseeId: friendId },
        { requesterId: friendId, addresseeId: userId },
      ],
    };
    const friendFound = await this.prismaService.friendRequest.findFirst({
      where: whereCondition,
    });

    if (!friendFound) {
      throw new NotFoundException('Friend relationship not found');
    }

    await this.prismaService.friendRequest.deleteMany({
      where: whereCondition,
    });

    return {
      message: 'Friend removed successfully',
      success: true,
      removedFriendIds: friendId,
    };
  }

  /*
   * Get incoming or rejected friend requests
   */
  public async getFriendRequests(userId: UUID): Promise<FriendRequestDto[]> {
    const foundRequests = await this.prismaService.friendRequest.findMany({
      where: {
        addresseeId: userId,
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

    const mappedRequests: FriendRequestDto[] = foundRequests.map((request) => ({
      id: request.id,
      requester: {
        requesterId: request.requester.id,
        username: request.requester.username,
        avatarUrl: request.requester.avatarUrl,
        firstName: request.requester.firstName,
        lastName: request.requester.lastName,
      },
      addressee: {
        addresseeId: request.addressee.id,
        username: request.addressee.username,
        avatarUrl: request.addressee.avatarUrl,
        firstName: request.addressee.firstName,
        lastName: request.addressee.lastName,
      },
      status: request.status as FriendRequestStatus,
    }));

    return mappedRequests;
  }
}
