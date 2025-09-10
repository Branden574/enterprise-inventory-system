const mongoose = require('mongoose');

const PurchaseOrderItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  notes: String
});

const PurchaseOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  supplier: {
    name: {
      type: String,
      required: true
    },
    email: String,
    phone: String,
    address: String,
    contactPerson: String
  },
  items: [PurchaseOrderItemSchema],
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'ordered', 'partially_received', 'received', 'cancelled'],
    default: 'draft'
  },
  rejectionReason: {
    type: String,
    required: function() {
      return this.status === 'rejected';
    }
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionDate: Date,
  totalAmount: {
    type: Number,
    required: true
  },
  expectedDeliveryDate: Date,
  deliveryAddress: String,
  notes: String,
  attachments: [{
    filename: String,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: Date,
  receivedItems: [{
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item'
    },
    quantity: Number,
    receivedDate: Date,
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  history: [{
    action: {
      type: String,
      enum: ['created', 'updated', 'status_changed', 'approved', 'items_received', 'cancelled']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    notes: String,
    previousStatus: String,
    newStatus: String
  }]
}, {
  timestamps: true
});

// Generate unique order number before saving
PurchaseOrderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    // Get the count of POs for this month and increment
    const count = await mongoose.model('PurchaseOrder').countDocuments({
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), 1),
        $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1)
      }
    });
    
    // Format: PO-YY-MM-XXXX (e.g., PO-23-08-0001)
    this.orderNumber = `PO-${year}-${month}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Calculate total amount before saving
PurchaseOrderSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    this.totalAmount = this.items.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice);
    }, 0);
  }
  next();
});

// Add history entry when status changes
PurchaseOrderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.history.push({
      action: 'status_changed',
      user: this.modifiedBy, // This should be set before saving
      previousStatus: this._original?.status,
      newStatus: this.status,
      timestamp: new Date()
    });
  }
  next();
});

const PurchaseOrder = mongoose.model('PurchaseOrder', PurchaseOrderSchema);

module.exports = PurchaseOrder;
