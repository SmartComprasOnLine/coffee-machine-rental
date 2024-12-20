const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  price: {
    type: Number,
    required: true
  },
  compatibleMachines: {
    type: String,
    required: true
  },
  dosage: {
    ml50: {
      grams: Number,
      doses: Number,
      pricePerDose: Number
    },
    ml80: {
      grams: Number,
      doses: Number,
      pricePerDose: Number
    },
    ml120: {
      grams: Number,
      doses: Number,
      pricePerDose: Number
    },
    ml150: {
      grams: Number,
      doses: Number,
      pricePerDose: Number
    },
    ml180: {
      grams: Number,
      doses: Number,
      pricePerDose: Number
    },
    ml200: {
      grams: Number,
      doses: Number,
      pricePerDose: Number
    }
  },
  description: String,
  image: String,
  availableForSale: {
    type: Boolean,
    default: true
  },
  stock: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    enum: ['COFFEE', 'CHOCOLATE', 'CAPPUCCINO', 'TEA', 'MILK', 'SUPPLIES'],
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', ProductSchema);
