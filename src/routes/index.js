const express = require('express');
const coffeeAgentController = require('../controllers/coffeeAgentController');
const spreadsheetController = require('../controllers/spreadsheetController');

const router = express.Router();

// Webhook routes
router.post('/webhook/coffee', coffeeAgentController.handleWebhook.bind(coffeeAgentController));
router.post('/webhook/spreadsheet', spreadsheetController.handleWebhook.bind(spreadsheetController));

module.exports = router;
