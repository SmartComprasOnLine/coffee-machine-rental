const express = require('express');
const mongoose = require('mongoose');
const coffeeAgentController = require('../controllers/coffeeAgentController');
const spreadsheetController = require('../controllers/spreadsheetController');
const Machine = require('../models/Machine');
const Product = require('../models/Product');

const router = express.Router();

// Health check route (will be accessible at /api/health)
router.get('/health', (req, res) => {
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB not connected');
    }
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      services: {
        mongodb: 'connected',
        api: 'running'
      }
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

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

module.exports = router;
