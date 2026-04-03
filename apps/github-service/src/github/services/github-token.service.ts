import {
  Injectable,
  UnauthorizedException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
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

      const githubToken = response.data?.data;

      // Simply check if the access token exists directly from the DTO structure
      if (!githubToken?.accessToken) {
        throw new NotFoundException(
          'GitHub account not connected. Please connect your GitHub account first.',
        );
      }

      return githubToken.accessToken;
    } catch (error) {
      // If the error is already our NotFoundException, rethrow it directly
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Failed to communicate with auth-service for user ${userId}: ${error.message}`,
      );

      // Any other error means the microservices failed to talk to each other
      // (e.g. auth service down, internal API key wrong, network issue)
      throw new UnauthorizedException(
        'Failed to verify GitHub connection status',
      );
    }
  }
}
