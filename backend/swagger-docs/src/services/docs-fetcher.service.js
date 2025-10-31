const axios = require('axios');

/*
 * Fetch OpenAPI specifications from configured services
 */
async function fetchServiceSpecs(servicesConfig) {
	const specs = [];

	for (const service of servicesConfig) {
		try {
			console.log(`Fetching spec from ${service.name}...`);

			const response = await axios.get(service.url, {
				timeout: 5000,
			});

			specs.push({
				oas: response.data,
				pathModification: {
					prepend: service.pathPrefix || '',
				},
			});

			console.log(`Successfully fetched spec from ${service.name}`);
		} catch (error) {
			console.error(`Error fetching spec from ${service.name}:`, error.message);
		}
	}

	return specs;
}

module.exports = { fetchServiceSpecs };
