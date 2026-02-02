import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GithubTokenService {
  private readonly logger = new Logger(GithubTokenService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getGitHubTokenForUser(userId: string): Promise<string> {
    const authServiceUrl = this.configService.get<string>('auth.serviceUrl');
    const apiKey = this.configService.get<string>('auth.internalApiKey');

    try {
      this.logger.debug(`Fetching GitHub token for user ${userId}`);

      const response = await firstValueFrom(
        this.httpService.get(
          `${authServiceUrl}/api/auth/internal/oauth-token/${userId}/github`,
          {
            headers: {
              'X-Internal-Api-Key': apiKey,
            },
          },
        ),
      );

      if (!response.data || !response.data.accessToken) {
        throw new UnauthorizedException(
          'GitHub account not connected for this user',
        );
      }

      return response.data.accessToken;
    } catch (error) {
      this.logger.error(
        `Failed to fetch GitHub token for user ${userId}`,
        error.message,
      );

      if (error.response?.status === 404) {
        throw new UnauthorizedException(
          'GitHub account not connected. Please connect your GitHub account first.',
        );
      }

      throw new UnauthorizedException('Failed to authenticate with GitHub');
    }
  }
}
