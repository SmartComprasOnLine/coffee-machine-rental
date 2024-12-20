const express = require('express');
const coffeeAgentController = require('../controllers/coffeeAgentController');
const spreadsheetController = require('../controllers/spreadsheetController');
const Machine = require('../models/Machine');
const Product = require('../models/Product');

const router = express.Router();

// Webhook routes
router.post('/webhook/coffee', coffeeAgentController.handleWebhook.bind(coffeeAgentController));
router.post('/webhook/spreadsheet', spreadsheetController.handleWebhook.bind(spreadsheetController));

// Coffee Agent routes
router.get('/machines', async (req, res) => {
  try {
    const machines = await Machine.find({ availableForRent: true });
    res.json(machines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/products', async (req, res) => {
  try {
    const products = await Product.find({ availableForSale: true });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/machines/:machineName/products', async (req, res) => {
  try {
    const products = await Product.find({
      compatibleMachines: { $regex: req.params.machineName, $options: 'i' },
      availableForSale: true
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
