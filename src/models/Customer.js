const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  cnpj: {
    type: String,
    unique: true,
    sparse: true
  },
  cpf: {
    type: String,
    unique: true,
    sparse: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    street: String,
    number: String,
    complement: String,
    neighborhood: String,
    city: String,
    state: String,
    zipCode: String
  },
  businessType: {
    type: String,
    enum: ['MEI', 'COMPANY', 'INDIVIDUAL'],
    required: true
  },
  rentals: [{
    machine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Machine'
    },
    startDate: Date,
    endDate: Date,
    monthlyPrice: Number,
    status: {
      type: String,
      enum: ['ACTIVE', 'CANCELLED', 'COMPLETED'],
      default: 'ACTIVE'
    },
    accessories: [{
      type: {
        type: String,
        enum: ['CABINET', 'COIN_VALIDATOR', 'PIX_PAYMENT', 'STABILIZER', 'TRANSFORMER', 'CUP_WARMER']
      },
      monthlyPrice: Number
    }],
    contractNumber: String,
    installationDate: Date,
    cancellationDate: Date,
    cancellationReason: String,
    technicalVisits: [{
      date: Date,
      type: {
        type: String,
        enum: ['PREVENTIVE', 'CORRECTIVE']
      },
      description: String,
      technician: String
    }]
  }],
  documents: {
    contractSocial: String,
    cnpjCard: String,
    ownerDocument: String,
    addressProof: String
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'INACTIVE', 'BLOCKED'],
    default: 'PENDING'
  },
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Customer', CustomerSchema);
