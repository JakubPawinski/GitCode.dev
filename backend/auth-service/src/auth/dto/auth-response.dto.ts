import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ example: '2b2ad8c3-3e53-43d1-80b4-ddcb141ff965' })
  id: string;

  @ApiProperty({ example: 'testuser' })
  username: string;

  @ApiProperty({ example: 'test@example.com' })
  email: string;

  @ApiProperty({ example: 'Test', nullable: true })
  firstName?: string;

  @ApiProperty({ example: 'User', nullable: true })
  lastName?: string;

  @ApiProperty({
    example: 'https://avatar.example.com/test.jpg',
    nullable: true,
  })
  avatarUrl?: string;

  @ApiProperty({ example: true })
  emailVerified: boolean;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token (15min expiry)',
  })
  accessToken: string;

  @ApiProperty({ type: UserDto })
  user: UserDto;
}

export class LoginRedirectDto {
  @ApiProperty({ example: 'http://keycloak.../auth?client_id=...' })
  redirectUrl: string;
}

export class LogoutResponseDto {
  @ApiProperty({ example: 'Logged out successfully' })
  message: string;
}

export class RefreshResponseDto extends AuthResponseDto {}
