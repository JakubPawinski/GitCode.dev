export default () => ({
  port: parseInt(process.env.PORT || '4001', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  keycloak: {
    url: process.env.KEYCLOAK_URL, // External URL (for browser redirects)
    internalUrl: process.env.KEYCLOAK_INTERNAL_URL, // Internal URL (for backend API calls)
    realm: process.env.KEYCLOAK_REALM,
    clientId: process.env.KEYCLOAK_CLIENT_ID,
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
    authorizationUrl: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/auth`,
    tokenUrl: `${process.env.KEYCLOAK_INTERNAL_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
    userInfoUrl: `${process.env.KEYCLOAK_INTERNAL_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/userinfo`,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  api: {
    callbackUrl:
      process.env.API_CALLBACK_URL || 'http://localhost:4001/auth/callback',
  },
});
