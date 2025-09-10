const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, default: 0, min: 0 },
  location: { type: String, trim: true },
  notes: { type: String, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true },
  photo: { type: String }, // file path or URL
  customFields: { type: Object, default: {} }, // dynamic custom fields
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  minimumQuantity: { type: Number, default: 0, min: 0 },
  alertEnabled: { type: Boolean, default: true },
  lastAlertSent: { type: Date },
  alertSettings: {
    email: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true },
    threshold: { type: Number, default: 0, min: 0, max: 100 } // percentage of minimum quantity to trigger alert
  }
});

// Enterprise-level indexes for ultra-high performance
ItemSchema.index({ name: 'text', notes: 'text', location: 'text' }); // Text search index
ItemSchema.index({ name: 1 }); // Name index for sorting
ItemSchema.index({ quantity: 1 }); // Quantity index for filtering
ItemSchema.index({ location: 1 }); // Location index for filtering
ItemSchema.index({ createdAt: -1 }); // Recent items index
ItemSchema.index({ category: 1, createdAt: -1 }); // Compound index for category + date
ItemSchema.index({ 'customFields.barcode': 1 }, { sparse: true }); // Barcode lookup (sparse for optional field)
ItemSchema.index({ updatedAt: -1 }); // Updated items index
ItemSchema.index({ quantity: 1, minimumQuantity: 1 }); // Low stock optimization
ItemSchema.index({ category: 1, name: 1 }); // Category + name compound index

// Performance optimization: Set read preference for better distribution
ItemSchema.set('read', 'secondaryPreferred');
ItemSchema.index({ quantity: 1, minimumQuantity: 1, alertEnabled: 1 }); // Low stock alerts index

// Update timestamp middleware
ItemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Performance monitoring middleware
ItemSchema.post('find', function(result) {
  console.log(`Item query returned ${result.length} results in ${Date.now() - this.start}ms`);
});

ItemSchema.pre('find', function() {
  this.start = Date.now();
});

module.exports = mongoose.model('Item', ItemSchema);
