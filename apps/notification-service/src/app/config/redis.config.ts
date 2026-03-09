import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  url: `${process.env.NOTIFICATION_REDIS_URL || 'redis://localhost:6381'}`,
}));
