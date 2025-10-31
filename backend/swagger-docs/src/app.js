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
app.listen(config.port, async () => {
	console.log('Swagger Docs Service');
	console.log(`Server running on port ${config.port}`);
	console.log(`Swagger UI: http://localhost:${config.port}/docs`);
	console.log(`Health check: http://localhost:${config.port}/health`);

	console.log(`Waiting ${config.buildDelay / 1000}s before building specs...`);
	setTimeout(async () => {
		await buildSwagger(config.apiGatewaySpec, config.services);
	}, config.buildDelay);
});
