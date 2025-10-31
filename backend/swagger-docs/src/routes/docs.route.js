const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { getMergedSpec } = require('../services/swagger-builder.service');

const router = express.Router();

/*
 * Swagger UI endpoint
 */
router.use('/', swaggerUi.serve);

/*
 * Swagger UI documentation endpoint
 */
router.get('/', (req, res, next) => {
	const mergedSpec = getMergedSpec();

	if (!mergedSpec) {
		return res.status(503).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Building Documentation</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        text-align: center; 
                        padding: 50px; 
                        background: #f5f5f5;
                    }
                    h1 { color: #333; }
                    p { color: #666; }
                    .spinner {
                        border: 4px solid #f3f3f3;
                        border-top: 4px solid #3498db;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        animation: spin 1s linear infinite;
                        margin: 20px auto;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            </head>
            <body>
                <div class="spinner"></div>
                <h1>🔨 Building API Documentation...</h1>
                <p>Please wait while we gather specs from all services.</p>
                <script>setTimeout(() => location.reload(), 3000);</script>
            </body>
            </html>
        `);
	}

	swaggerUi.setup(mergedSpec)(req, res, next);
});

module.exports = router;
