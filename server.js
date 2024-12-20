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
    }
}));

// Routes
app.use('/api', routes);

// Error handling middleware
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
