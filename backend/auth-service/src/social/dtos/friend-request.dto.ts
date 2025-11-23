import { RequesterDto } from './requester.dto';
import { AddresseeDto } from './addressee.dto';
import { FriendRequestStatus } from '../enums/friendRequest.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class FriendRequestDto {
  @ApiProperty({ description: 'Unique identifier of the friend request' })
  id: string;
  @ApiProperty({ type: RequesterDto })
  requester: RequesterDto;
  @ApiProperty({ type: AddresseeDto })
  addressee: AddresseeDto;
  @ApiProperty({
    enum: FriendRequestStatus,
    description: 'Status of the friend request',
    example: FriendRequestStatus.PENDING,
  })
  @IsEnum(FriendRequestStatus)
  status: FriendRequestStatus;
}
