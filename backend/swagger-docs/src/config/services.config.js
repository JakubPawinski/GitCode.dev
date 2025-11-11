module.exports = {
	port: process.env.SWAGGER_DOCS_PORT || 4050,
	buildDelay: 0, 

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
	],
};
