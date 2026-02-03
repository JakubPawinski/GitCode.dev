import { ApiProperty } from '@nestjs/swagger';

export class RepositoryResponseDto {
  @ApiProperty({ example: 'gitcode-solutions' })
  name: string;

  @ApiProperty({ example: 'jakubpakula1/gitcode-solutions' })
  fullName: string;

  @ApiProperty({ example: 'https://github.com/jakubpakula1/gitcode-solutions' })
  htmlUrl: string;

  @ApiProperty({ example: false })
  isPrivate: boolean;

  @ApiProperty({ example: true })
  created: boolean;
}

export class CommitResponseDto {
  @ApiProperty({ example: 'a1b2c3d4e5f6...' })
  sha: string;

  @ApiProperty({ example: 'Add solution for Two Sum problem' })
  message: string;

  @ApiProperty({ example: 'https://github.com/user/repo/commit/a1b2c3...' })
  url: string;

  @ApiProperty({ example: '2026-02-01T19:30:00Z' })
  committedAt: string;
}

export class ReadmeResponseDto {
  @ApiProperty({ example: 'README.md' })
  fileName: string;

  @ApiProperty({ example: 'Updated README successfully' })
  message: string;

  @ApiProperty({ example: 'https://github.com/user/repo/blob/main/README.md' })
  url: string;
}