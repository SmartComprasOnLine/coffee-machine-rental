const mongoose = require('mongoose');

const MachineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  availableForRent: {
    type: Boolean,
    default: true
  },
  stock: {
    type: Number,
    default: 0
  },
  acceptsPixPayment: {
    type: Boolean,
    default: false
  },
  image: String,
  supportedProducts: {
    type: String,
    required: true
  },
  videos: String,
  photoGallery: String,
  installationVideos: String,
  customerFeedbackVideo: String,
  rentalPrice: {
    type: Number,
    required: true
  },
  paymentMethod: String,
  rentalDiscount: Number,
  description: String,
  dimensions: {
    height: String,
    width: String,
    depth: String,
    weight: String
  },
  unsupportedProducts: String,
  contractDuration: String,
  cancellationFee: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Machine', MachineSchema);
