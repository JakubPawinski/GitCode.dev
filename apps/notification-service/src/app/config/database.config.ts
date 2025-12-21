import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url:
    process.env.NOTIFICATION_DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5434/notification_db',
}));
