const express = require('express');
const coffeeAgentController = require('../controllers/coffeeAgentController');
const spreadsheetController = require('../controllers/spreadsheetController');

const router = express.Router();

// Base API routes
router.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Webhook routes
router.post('/api/webhook/coffee', coffeeAgentController.handleWebhook.bind(coffeeAgentController));
router.post('/api/webhook/spreadsheet', spreadsheetController.handleWebhook.bind(spreadsheetController));

// Debug route to list all registered routes
router.get('/api/routes', (req, res) => {
    const routes = [];
    router.stack.forEach((middleware) => {
        if (middleware.route) {
            routes.push({
                path: middleware.route.path,
                methods: Object.keys(middleware.route.methods)
            });
        }
    });
    res.json(routes);
});

// Error handling for 404
router.use((req, res) => {
    console.log(`Route not found: ${req.method}:${req.originalUrl}`);
    res.status(404).json({
        message: `Route ${req.method}:${req.originalUrl} not found`,
        error: 'Not Found',
        statusCode: 404
    });
});

module.exports = router;
