import { IsUUID } from 'class-validator';
import type { UUID } from '../../types';
import { ApiProperty } from '@nestjs/swagger';

export class InviteFriendDto {
  @IsUUID()
  @ApiProperty({
    description: 'ID of the user to invite as a friend',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  addresseeId: UUID;
}
