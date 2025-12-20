import type { UUID } from '@gitcode/types';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { GenericNotificationPayload } from './generic.payload';

export class FriendInvitePayload extends GenericNotificationPayload {
  @ApiProperty({ description: 'ID of the user who sent the friend invite' })
  @IsUUID()
  requesterId: UUID;

  @IsString()
  @IsNotEmpty()
  requesterUsername: string;

  @ApiProperty({
    description: 'Username of the user who sent the friend invite',
  })
  @IsString()
  @IsNotEmpty()
  addresseeUsername: string;

  @IsUUID()
  @IsNotEmpty()
  addresseeId: UUID;

  @IsUUID()
  @IsNotEmpty()
  requestId: UUID;
}
