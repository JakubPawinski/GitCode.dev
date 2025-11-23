import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FriendRequestStatus } from '../enums/friendRequest.enum';
import { GetFriendDto } from '../dtos/get-firend.dto';
import { InviteFriendDto } from '../dtos/invite-friend.dto';
import { UUID } from '../../types';
import { FriendRequestDto } from '../dtos/friend-request.dto';

@Injectable()
export class SocialService {
  constructor(private readonly prismaService: PrismaService) {}

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

    const mappedFriendRequest: FriendRequestDto = {
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

  public async respondToFriendRequest(
    userId: UUID,
    requesterId: UUID,
    respondFriendRequestDto: { status: FriendRequestStatus },
  ): Promise<FriendRequestDto> {
    const { status } = respondFriendRequestDto;

    const updatedFriendRequest = await this.prismaService.friendRequest.update({
      where: {
        requesterId_addresseeId: {
          requesterId,
          addresseeId: userId,
        },
      },
      data: {
        status,
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
        status: true,
      },
    });

    const mappedFriendRequest: FriendRequestDto = {
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

  public async removeFriend(
    userId: UUID,
    friendId: UUID,
  ): Promise<{ message: string; success: boolean; removedFriendIds: UUID }> {
    const removedFriend = await this.prismaService.friendRequest.deleteMany({
      where: {
        status: FriendRequestStatus.ACCEPTED,
        OR: [
          { requesterId: userId, addresseeId: friendId },
          { requesterId: friendId, addresseeId: userId },
        ],
      },
    });

    return {
      message: 'Friend removed successfully',
      success: true,
      removedFriendIds: friendId,
    };
  }

  public async getFriendRequests(userId: UUID): Promise<FriendRequestDto[]> {
    const foundRequests = await this.prismaService.friendRequest.findMany({
      where: {
        addresseeId: userId,
        status: FriendRequestStatus.PENDING || FriendRequestStatus.REJECTED,
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
        status: true,
      },
    });

    const mappedRequests: FriendRequestDto[] = foundRequests.map((request) => ({
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
