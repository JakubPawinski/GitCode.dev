import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  url: `redis://localhost:${process.env.NOTIFICATION_REDIS_PORT || 6381}`,
}));
