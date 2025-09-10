const mongoose = require('mongoose');

const internalOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      // This will be overridden by the pre-save middleware
      return 'TEMP-' + Date.now();
    }
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requesterName: {
    type: String,
    required: true
  },
  deliverySite: {
    type: String,
    required: true
  },
  requestedDeliveryDate: {
    type: Date,
    required: true
  },
  department: {
    type: String,
    required: false
  },
  purpose: {
    type: String,
    required: false
  },
  items: [{
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true
    },
    requestedQuantity: {
      type: Number,
      required: true,
      min: 1
    },
    notes: {
      type: String,
      default: ''
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'fulfilled'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: {
    type: Date
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionDate: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  fulfilledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  fulfillmentDate: {
    type: Date
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Generate order number before saving
internalOrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    try {
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      
      // Find the latest order number for this month
      const latestOrder = await this.constructor.findOne({
        orderNumber: new RegExp(`^IO-${year}-${month}-`)
      }).sort({ orderNumber: -1 });
      
      let sequence = 1;
      if (latestOrder) {
        const lastSequence = parseInt(latestOrder.orderNumber.split('-')[3]);
        if (!isNaN(lastSequence)) {
          sequence = lastSequence + 1;
        }
      }
      
      this.orderNumber = `IO-${year}-${month}-${sequence.toString().padStart(4, '0')}`;
      console.log('Generated order number:', this.orderNumber);
    } catch (error) {
      console.error('Error generating order number:', error);
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('InternalOrder', internalOrderSchema);
