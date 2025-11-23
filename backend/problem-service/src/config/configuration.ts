export default () => ({
  port: parseInt(process.env.PORT || '4002', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://problem-redis:6379',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'super_secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
});
