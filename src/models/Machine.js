const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    availableForRent: {
        type: Boolean,
        default: false
    },
    stock: {
        type: Number,
        default: 0
    },
    acceptsPix: {
        type: Boolean,
        default: false
    },
    image: String,
    supportedProducts: String,
    videos: String,
    photosCatalog: String,
    installationVideos: String,
    feedbackVideos: String,
    rentalPrice: {
        type: Number,
        required: true
    },
    paymentMethod: String,
    rentalDiscount: {
        type: Number,
        default: 0
    },
    description: String,
    dimensions: {
        height: String,
        width: String,
        depth: String,
        weight: String
    },
    unsupportedProducts: String,
    contractDuration: String,
    cancellationFee: String,
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Add text indexes for search
machineSchema.index({
    name: 'text',
    description: 'text',
    supportedProducts: 'text',
    unsupportedProducts: 'text'
});

module.exports = mongoose.model('Machine', machineSchema);
