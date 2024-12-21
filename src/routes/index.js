const express = require('express');
const router = express.Router();
const coffeeAgentController = require('../controllers/coffeeAgentController');
const spreadsheetController = require('../controllers/spreadsheetController');

// WhatsApp webhook
router.post('/api/webhook/coffee', coffeeAgentController.handleWebhook.bind(coffeeAgentController));

// Spreadsheet webhook
router.post('/api/webhook/spreadsheet', async (req, res) => {
  try {
    console.log('Received spreadsheet webhook request:', {
      planilha: req.body.Planilha,
      data: req.body
    });

    await spreadsheetController.handleWebhook(req, res);

    // Get updated stats after processing
    const machineStats = await spreadsheetController.getMachineStats();
    const productStats = await spreadsheetController.getProductStats();

    console.log('Updated inventory stats:', {
      machines: machineStats,
      products: productStats
    });

  } catch (error) {
    console.error('Error in spreadsheet webhook route:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = router;
