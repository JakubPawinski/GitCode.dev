import { ApiProperty } from '@nestjs/swagger';

export class GitHubTokenDto {
  @ApiProperty({
    description: 'GitHub OAuth access token (decrypted)',
    example: 'gho_16C7e42F292c6912E7710c838347Ae178B4a',
  })
  accessToken: string;

  @ApiProperty({
    description: 'OAuth scopes granted for the token',
    example: 'public_repo,read:user,user:email',
  })
  scope: string;

  @ApiProperty({
    description: 'Token type',
    example: 'bearer',
    default: 'bearer',
  })
  tokenType: string;
}
