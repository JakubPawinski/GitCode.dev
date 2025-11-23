import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, IsUUID } from 'class-validator';

export class AddresseeDto {
  @IsUUID()
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique identifier of the addressee user',
  })
  addresseeId: string;

  @ApiProperty({
    description: 'Username of the addressee user',
    example: 'jane_doe',
  })
  @IsString()
  username: string;

  @ApiProperty({
    description: 'Avatar URL of the addressee user',
    example: 'https://example.com/avatar.jpg',
  })
  @IsUrl()
  avatarUrl: string | null;

  @ApiProperty({
    description: 'First name of the addressee user',
    example: 'Jane',
  })
  @IsString()
  firstName: string | null;

  @ApiProperty({
    description: 'Last name of the addressee user',
    example: 'Doe',
  })
  @IsString()
  lastName: string | null;
}
