const express = require('express');
const coffeeAgentController = require('../controllers/coffeeAgentController');
const spreadsheetController = require('../controllers/spreadsheetController');

const router = express.Router();

// Coffee Agent Webhook route
router.post('/webhook/coffee', coffeeAgentController.handleWebhook.bind(coffeeAgentController));

// Spreadsheet Webhook route
router.post('/webhook/spreadsheet', spreadsheetController.handleWebhook.bind(spreadsheetController));

// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug route to log all registered routes
router.get('/routes', (req, res) => {
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

module.exports = router;
