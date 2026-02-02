const axios = require('axios');

async function waitForService(url, name, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Checking ${name} at ${url}`);
      await axios.get(`${url}`, { timeout: 2000 });
      console.log(`${name} is available`);
      return true;
    } catch (error) {
      console.log(`Waiting for ${name}... (${i + 1}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  console.warn(`${name} not available, continuing anyway...`);
  return false;
}

module.exports = {
  port: process.env.SWAGGER_DOCS_PORT || 4050,
  buildDelay: 0,
  waitForService,
  authServiceHealthUrl: `${process.env.AUTH_SERVICE_URL}/auth/health`,
  problemServiceHealthUrl: `${process.env.PROBLEM_SERVICE_URL}/problems/health`,
  notificationServiceHealthUrl: `${process.env.NOTIFICATION_SERVICE_URL}/notifications/health`,

  apiGatewaySpec: {
    openapi: '3.0.0',
    info: {
      title: 'GitCode API Gateway',
      version: '1.0.0',
      description: 'API documentation for all microservices',
    },
    servers: [
      { url: 'http://localhost:8080', description: 'API Gateway Server' },
    ],
  },

  services: [
    {
      name: 'Auth Service',
      url: `${process.env.AUTH_SERVICE_URL}/docs-json`,
      pathPrefix: '/api',
    },
    {
      name: 'Problem Service',
      url: `${process.env.PROBLEM_SERVICE_URL}/docs-json`,
      pathPrefix: '/api',
    },
    {
      name: 'Notification Service',
      url: `${process.env.NOTIFICATION_SERVICE_URL}/docs-json`,
      pathPrefix: '/api',
    },
    {
      name: 'AI Service',
      url: `${process.env.AI_SERVICE_URL}/openapi.json`,
      pathPrefix: '/api',
    },
  ],
};
