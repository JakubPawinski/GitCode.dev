export default () => ({
  port: parseInt(process.env.PROBLEM_PORT || '4002', 10),
  database: {
    url: process.env.PROBLEM_DATABASE_URL,
  },
  redis: {
    url: process.env.PROBLEM_REDIS_URL || 'redis://localhost:6380',
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
