const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
    model: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        required: true,
        enum: ['DISPONÍVEL PARA ALUGUEL', 'INDISPONÍVEL'],
        default: 'INDISPONÍVEL'
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    features: {
        macpayCompatible: {
            type: Boolean,
            default: false
        },
        image: String,
        supportedProducts: String,
        videos: String,
        photosCatalog: String,
        installationVideos: String,
        clientFeedbackVideo: String
    },
    pricing: {
        monthlyRent: {
            type: Number,
            required: true,
            min: 0
        },
        paymentMethod: {
            type: String,
            required: true
        },
        rentDiscount: {
            type: Number,
            default: 0,
            min: 0,
            max: 1
        }
    },
    specifications: {
        description: String,
        dimensions: {
            height: String,
            width: String,
            depth: String,
            weight: String
        },
        unsupportedProducts: String
    },
    contract: {
        loyaltyPeriod: String,
        cancellationFee: String
    }
}, {
    timestamps: true
});

// Add indexes for common queries
machineSchema.index({ model: 1 });
machineSchema.index({ status: 1 });
machineSchema.index({ 'pricing.monthlyRent': 1 });

// Virtual for formatted price
machineSchema.virtual('formattedPrice').get(function() {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(this.pricing.monthlyRent);
});

// Method to get machine details for WhatsApp messages
machineSchema.methods.getWhatsAppDescription = function() {
    return `*${this.model}*\n\n` +
           `📝 *Descrição:*\n${this.specifications.description}\n\n` +
           `💰 *Valor do Aluguel:* ${this.formattedPrice}/mês\n` +
           `💳 *Forma de Pagamento:* ${this.pricing.paymentMethod}\n\n` +
           `📏 *Dimensões:*\n` +
           `• Altura: ${this.specifications.dimensions.height}\n` +
           `• Largura: ${this.specifications.dimensions.width}\n` +
           `• Profundidade: ${this.specifications.dimensions.depth}\n` +
           `• Peso: ${this.specifications.dimensions.weight}\n\n` +
           `📋 *Contrato:*\n` +
           `• Fidelidade: ${this.contract.loyaltyPeriod}\n` +
           `• Multa por cancelamento: ${this.contract.cancellationFee}\n\n` +
           `🎥 *Vídeos e Fotos:*\n` +
           `• Catálogo de Fotos: ${this.features.photosCatalog}\n` +
           `• Vídeos: ${this.features.videos}\n\n` +
           `✨ *Produtos Suportados:*\n${this.features.supportedProducts}`;
};

module.exports = mongoose.model('Machine', machineSchema);
