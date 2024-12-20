require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const routes = require('./src/routes');

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/coffee-rental', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Middleware
app.use(cors());

// Parse JSON payloads
app.use(express.json({
    verify: (req, res, buf) => {
        // Save raw body for webhook verification
        if (req.originalUrl.includes('/webhook')) {
            req.rawBody = buf.toString();
        }
    },
    limit: '50mb'
}));

// API routes
app.use('/api', routes);

// 404 handler - Must be after all other routes
app.use((req, res) => {
    const message = `Route ${req.method}:${req.originalUrl} not found`;
    console.log(message);
    res.status(404).json({
        message,
        error: 'Not Found',
        statusCode: 404
    });
});

// Error handler - Must be last
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('MongoDB URI:', process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') || 'mongodb://mongodb:27017/coffee-rental');
    
    // Log all registered routes
    console.log('\nRegistered Routes:');
    app._router.stack.forEach(middleware => {
        if (middleware.route) {
            const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
            console.log(`${methods}: ${middleware.route.path}`);
        }
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
});
