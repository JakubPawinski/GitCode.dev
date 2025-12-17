import type { UUID } from '@gitcode/types';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class FriendInvitePayload {
  @ApiProperty({ description: 'ID of the user who sent the friend invite' })
  @IsUUID()
  senderId: UUID;

  @ApiProperty({
    description: 'Username of the user who sent the friend invite',
  })
  @IsString()
  senderUsername: string;
}
