const express = require('express');
const { getMergedSpec } = require('../services/swagger-builder.service');

const router = express.Router();

/*
 * Root endpoint
 */
router.get('/', (req, res) => {
	res.json({
		service: 'Swagger Docs Service',
		version: '1.0.0',
		status: 'running',
		specReady: !!getMergedSpec(),
		endpoints: {
			docs: '/docs',
			health: '/health',
		},
	});
});

/*
 * Health check endpoint
 */
router.get('/health', (req, res) => {
	res.json({
		status: 'healthy',
		specBuilt: !!getMergedSpec(),
		timestamp: new Date().toISOString(),
	});
});

module.exports = router;
