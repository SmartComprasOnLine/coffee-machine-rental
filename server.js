require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const routes = require('./src/routes');

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

// Function to connect to MongoDB with retries
const connectWithRetry = async () => {
    const maxRetries = 5;
    let currentTry = 1;

    while (currentTry <= maxRetries) {
        try {
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/coffee-rental', {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
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
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};

// Middleware
app.use(cors());

// Parse JSON payloads
app.use(express.json({
    verify: (req, res, buf) => {
        if (req.originalUrl.includes('/webhook')) {
            req.rawBody = buf.toString();
        }
    },
    limit: '50mb'
}));

// API routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
    const message = `Route ${req.method}:${req.originalUrl} not found`;
    console.log(message);
    res.status(404).json({
        message,
        error: 'Not Found',
        statusCode: 404
    });
});

// Error handler
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
        
        const server = app.listen(port, host, () => {
            console.log(`Server running on http://${host}:${port}`);
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

        // Handle server errors
        server.on('error', (error) => {
            if (error.syscall !== 'listen') {
                throw error;
            }

            switch (error.code) {
                case 'EACCES':
                    console.error(`Port ${port} requires elevated privileges`);
                    process.exit(1);
                    break;
                case 'EADDRINUSE':
                    console.error(`Port ${port} is already in use`);
                    process.exit(1);
                    break;
                default:
                    throw error;
            }
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

// Handle termination signals
process.on('SIGTERM', () => {
    console.info('SIGTERM signal received. Closing server...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.info('SIGINT signal received. Closing server...');
    process.exit(0);
});
