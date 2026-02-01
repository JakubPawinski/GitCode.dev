import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * Guard for internal service-to-service authentication
 *
 * Protects endpoints that should only be accessible by other microservices
 * within the GitCode platform, not by external clients or users.
 * Requires X-Internal-Api-Key header matching INTERNAL_API_KEY env variable
 */

@Injectable()
export class InternalServiceGuard implements CanActivate {
  private readonly logger = new Logger(InternalServiceGuard.name);

  constructor(private configService: ConfigService) {}

  /**
   * Validates the internal API key from request headers
   *
   * Flow:
   * 1. Extract X-Internal-Api-Key from request headers
   * 2. Load expected key from INTERNAL_API_KEY env variable
   * 3. Compare keys using strict equality
   * 4. Allow or deny access based on match
   *
   * @param context - Execution context containing the HTTP request
   * @returns true if authentication succeeds
   * @throws UnauthorizedException if key is missing, invalid, or not configured
   */

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    // Extract API key from request header
    const apiKey = request.headers['x-internal-api-key'];

    if (!apiKey) {
      this.logger.warn('Missing X-Internal-Api-Key header');
      throw new UnauthorizedException('Internal API key is required');
    }

    // Load the expected API key from environment configuration
    const validApiKey = this.configService.get<string>('INTERNAL_API_KEY');

    if (!validApiKey) {
      this.logger.error('INTERNAL_API_KEY not configured in environment');
      throw new UnauthorizedException('Service authentication not configured');
    }
    // Validate: provided key must match configured key
    if (apiKey !== validApiKey) {
      this.logger.warn('Invalid internal API key provided');
      throw new UnauthorizedException('Invalid internal API key');
    }

    this.logger.debug('Internal service authenticated successfully');
    return true;
  }
}
