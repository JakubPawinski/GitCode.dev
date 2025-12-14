const express = require('express');
const config = require('./config/services.config');
const { buildSwagger } = require('./services/swagger-builder.service');
const rootRoutes = require('./routes/index.route');
const docsRoutes = require('./routes/docs.route');

const app = express();

// Routes
app.use('/', rootRoutes);
app.use('/docs', docsRoutes);

// Server startup
app.listen(config.port, '0.0.0.0', async () => {
  console.log('Swagger Docs Service');
  console.log(`Server running on port ${config.port}`);
  console.log(`Swagger UI: http://localhost:${config.port}/docs`);
  console.log(`Health check: http://localhost:${config.port}/health`);

  console.log('\nWaiting for microservices to be ready...');
  await config.waitForService(config.authServiceHealthUrl, 'Auth Service');
  await config.waitForService(
    config.problemServiceHealthUrl,
    'Problem Service',
  );
  console.log('\nAll services ready! Building Swagger specs...');
  await buildSwagger(config.apiGatewaySpec, config.services);
  console.log('Swagger documentation built successfully');
});
