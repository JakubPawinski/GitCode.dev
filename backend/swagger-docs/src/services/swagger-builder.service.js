const { merge } = require('openapi-merge');
const { fetchServiceSpecs } = require('./docs-fetcher.service');

let mergedSpec = null;

/*
 * Build the merged OpenAPI specification
 */
async function buildSwagger(apiGatewaySpec, servicesConfig) {
	try {
		console.log('Building swagger documentation...');

		// Fetch specs from services
		const serviceSpecs = await fetchServiceSpecs(servicesConfig);

		if (serviceSpecs.length === 0) {
			console.warn('No service specs fetched, using only gateway spec');
			mergedSpec = apiGatewaySpec;
			return;
		}

		// Merge specs
		const mergeResult = merge([{ oas: apiGatewaySpec }, ...serviceSpecs]);

		if (mergeResult.output) {
			mergedSpec = mergeResult.output;

			// Add security schemes to merged spec
			mergedSpec.components = mergedSpec.components ?? {};
			mergedSpec.components.securitySchemes = {
				...mergedSpec.components.securitySchemes,
				'Bearer Auth': {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
				},
				RefreshTokenCookie: {
					type: 'apiKey',
					in: 'cookie',
					name: 'gc_refresh',
				},
			};
			console.log('Swagger documentation merged successfully');
		} else {
			console.error('Failed to merge OpenAPI specs');
		}
	} catch (error) {
		console.error('Error building swagger:', error.message);
	}
}

/*
 * Get the merged OpenAPI specification
 */
function getMergedSpec() {
	return mergedSpec;
}

module.exports = { buildSwagger, getMergedSpec };
