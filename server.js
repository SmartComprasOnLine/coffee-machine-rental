require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const routes = require('./src/routes');

const app = express();
const port = process.env.PORT || 3000;

// Function to connect to MongoDB with retries
const connectWithRetry = async () => {
    const maxRetries = 5;
    let currentTry = 1;

    while (currentTry <= maxRetries) {
        try {
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/coffee-rental', {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            });
            console.log('Connected to MongoDB');
            return true;
        } catch (err) {
            console.error(`MongoDB connection attempt ${currentTry} failed:`, err.message);
            if (currentTry === maxRetries) {
                console.error('Max retries reached. Exiting...');
                process.exit(1);
            }
            currentTry++;
            // Wait for 5 seconds before retrying
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};

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

// Start server after connecting to MongoDB
const startServer = async () => {
    try {
        await connectWithRetry();
        
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
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();

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
