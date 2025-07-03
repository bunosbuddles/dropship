const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  moq: {
    type: Number,
    default: 0
  },
  shippingTime: {
    type: String
  },
  status: {
    type: String,
    enum: ['researching', 'contacted', 'negotiating', 'samples', 'confirmed', 'rejected'],
    default: 'researching'
  },
  notes: {
    type: String
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const ProductSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  unitCost: {
    type: Number,
    required: true
  },
  basePrice: {
    type: Number,
    required: true
  },
  fees: {
    type: Number,
    default: 0
  },
  variant: {
    type: String
  },
  unitsSold: {
    type: Number,
    default: 0
  },
  // Sourcing Information
  supplier: {
    type: String
  },
  sourcingStatus: {
    type: String,
    enum: ['in progress', 'negotiation', 'complete', 'MOQ required', 'price', 'failed'],
    default: 'in progress'
  },
  // New field for sourcing agents
  sourcingAgents: [
    {
      name: { type: String, required: true },
      baseCost: { type: Number, required: true },
      totalCost: { type: Number, required: true },
      shippingTime: { type: String },
      notes: { type: String }
    }
  ],
  // New field to store multiple suppliers
  suppliers: [SupplierSchema],
  // Calculated fields
  totalSales: {
    type: Number,
    default: 0
  },
  profitMargin: {
    type: Number,
    default: 0
  },
  // Sales history records
  salesHistory: [{
    date: {
      type: Date,
      required: true
    },
    unitsSold: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    },
    notes: {
      type: String
    },
    transactionId: {
      type: String,
      default: function() {
        return new Date().getTime().toString();
      }
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to update timestamps
ProductSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Pre-update hook
ProductSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.model('Product', ProductSchema);