const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    whatsappNumber: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    businessInfo: {
        cep: String,
        businessType: String,
        cnpj: String,
        companyName: String,
        status: {
            type: String,
            enum: ['LEAD', 'QUALIFIED', 'NEGOTIATING', 'CONTRACT_SENT', 'ACTIVE', 'INACTIVE'],
            default: 'LEAD'
        }
    },
    messageHistory: [{
        role: {
            type: String,
            enum: ['user', 'assistant'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    preferences: {
        interestedMachines: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Machine'
        }],
        desiredBeverages: [String],
        budget: {
            min: Number,
            max: Number
        },
        paymentMethod: {
            type: String,
            enum: ['MACPAY', 'MANUAL', 'UNDEFINED'],
            default: 'UNDEFINED'
        }
    },
    lastInteraction: {
        type: Date,
        default: Date.now
    },
    notes: [{
        content: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

customerSchema.methods.addToMessageHistory = function(role, content) {
    this.messageHistory.push({ role, content });
    this.lastInteraction = new Date();
    return this.save();
};

customerSchema.methods.getMessageHistory = function(limit = 10) {
    return this.messageHistory
        .slice(-limit)
        .map(msg => ({
            role: msg.role,
            content: msg.content
        }));
};

module.exports = mongoose.model('Customer', customerSchema);
