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
    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL');
    const apiKey = this.configService.get<string>('INTERNAL_API_KEY');

    try {
      this.logger.debug(`Fetching GitHub token for user ${userId}`);

      const response = await firstValueFrom(
        this.httpService.get(
          `${authServiceUrl}/auth/internal/oauth-token/${userId}/github`,
          {
            headers: {
              'X-Internal-Api-Key': apiKey,
            },
          },
        ),
      );

      const githubToken = response.data.data;

      if (!githubToken || !githubToken.accessToken) {
        throw new UnauthorizedException(
          'GitHub account not connected for this user',
        );
      }

      return githubToken.accessToken;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(
        `Failed to fetch GitHub token for user ${userId}: ${error.message}`,
      );

      if (error.response?.status === 404 || error.response?.status === 401) {
        throw new UnauthorizedException(
          'GitHub account not connected. Please connect your GitHub account first.',
        );
      }

      throw new UnauthorizedException('Failed to authenticate with GitHub');
    }
  }
}
