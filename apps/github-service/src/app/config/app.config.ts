import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  DB_URL: process.env.GITHUB_DATABASE_URL,
}));
