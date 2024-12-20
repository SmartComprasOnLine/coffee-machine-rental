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

module.exports = router;
