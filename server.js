const express = require('express');
const mongoose = require('mongoose');
const routes = require('./src/routes');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/coffee-rental')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.body && (req.url.includes('/webhook/spreadsheet') || req.url.includes('/webhook/coffee'))) {
    console.log('Webhook payload:', {
      url: req.url,
      type: req.body.Planilha || req.body.event,
      data: req.body
    });
  }
  next();
});

// Register routes
app.use('/', routes);

// Log registered routes
console.log('\nRegistered Routes:');
app._router.stack
  .filter(r => r.route)
  .forEach(r => {
    Object.keys(r.route.methods).forEach(method => {
      console.log(`${method.toUpperCase()} ${r.route.path}`);
    });
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing server...');
  mongoose.connection.close()
    .then(() => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Error closing MongoDB connection:', err);
      process.exit(1);
    });
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`MongoDB URI: ${process.env.MONGODB_URI || 'mongodb://mongodb:27017/coffee-rental'}`);
});
