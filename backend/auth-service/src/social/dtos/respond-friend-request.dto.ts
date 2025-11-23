import { IsEnum } from 'class-validator';
import { FriendRequestStatus } from '../enums/friendRequest.enum';
import { ApiProperty } from '@nestjs/swagger';

export class RespondFriendRequestDto {
  @IsEnum([FriendRequestStatus.ACCEPTED, FriendRequestStatus.REJECTED])
  @ApiProperty({
    enum: [FriendRequestStatus.ACCEPTED, FriendRequestStatus.REJECTED],
    description: 'Status of the friend request',
    example: FriendRequestStatus.ACCEPTED,
  })
  status: FriendRequestStatus.ACCEPTED | FriendRequestStatus.REJECTED;
}
