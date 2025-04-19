// models/Goal.js
const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Add product field but don't make it required
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  name: {
    type: String,
    required: true
  },
  type: {
    // Expand allowed types
    type: String,
    enum: ['revenue', 'sales', 'profit', 'profit_margin'],
    required: true
  },
  targetAmount: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  currentAmount: {
    type: Number,
    default: 0
  },
  // Flag to distinguish between store-wide and product-specific goals
  isProductSpecific: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Goal', GoalSchema);