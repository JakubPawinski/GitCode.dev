import { UseGuards, applyDecorators } from '@nestjs/common';
import { InternalServiceGuard } from '../guards/internal-service.guard';

/**
 * Decorator to protect endpoints for internal service-to-service communication
 * Requires X-Internal-Api-Key header matching INTERNAL_API_KEY env variable
 */
export const InternalService = () => {
  return applyDecorators(UseGuards(InternalServiceGuard));
};
