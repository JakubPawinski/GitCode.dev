import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  ACHIEVEMENT_PORT: parseInt(process.env.ACHIEVEMENT_PORT, 10) || 3000,
  environment: process.env.NODE_ENV || 'development',
  INTERNAL_API_KEY: process.env.INTERNAL_API_KEY,
  PROBLEM_SERVICE_URL: process.env.PROBLEM_SERVICE_URL
}));
