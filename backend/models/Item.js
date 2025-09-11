const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, default: 0, min: 0 },
  location: { type: String, trim: true },
  notes: { type: String, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true },
  photo: { type: String }, // Cloudinary URL
  photoPublicId: { type: String }, // Cloudinary public ID for deletion
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
  },
  // Book-specific fields
  isbn13: { type: String, trim: true, index: true },
  isbn10: { type: String, trim: true, index: true },
  title: { type: String, trim: true }, // Alternative to name for books
  cases: { type: Number, default: 0, min: 0 },
  caseQty: { type: Number, default: 0, min: 0 },
  total: { type: Number, default: 0, min: 0 }, // Calculated or imported total
  status: { type: String, enum: ['active', 'discontinued', 'on-order', 'backordered', 'available'], default: 'active' },
  statusColor: { type: String, trim: true }, // For color coding like in your Excel
  publisher: { type: String, trim: true },
  edition: { type: String, trim: true },
  subject: { type: String, trim: true },
  gradeLevel: { type: String, trim: true }
});

// Enterprise-level indexes for ultra-high performance
ItemSchema.index({ name: 'text', notes: 'text', location: 'text', title: 'text', publisher: 'text', subject: 'text' }); // Enhanced text search index
ItemSchema.index({ name: 1 }); // Name index for sorting
ItemSchema.index({ title: 1 }); // Title index for books
ItemSchema.index({ isbn13: 1 }, { sparse: true }); // ISBN-13 lookup
ItemSchema.index({ isbn10: 1 }, { sparse: true }); // ISBN-10 lookup
ItemSchema.index({ quantity: 1 }); // Quantity index for filtering
ItemSchema.index({ location: 1 }); // Location index for filtering
ItemSchema.index({ createdAt: -1 }); // Recent items index
ItemSchema.index({ category: 1, createdAt: -1 }); // Compound index for category + date
ItemSchema.index({ 'customFields.barcode': 1 }, { sparse: true }); // Barcode lookup (sparse for optional field)
ItemSchema.index({ updatedAt: -1 }); // Updated items index
ItemSchema.index({ quantity: 1, minimumQuantity: 1 }); // Low stock optimization
ItemSchema.index({ category: 1, name: 1 }); // Category + name compound index
ItemSchema.index({ status: 1 }); // Status filtering
ItemSchema.index({ publisher: 1 }); // Publisher filtering
ItemSchema.index({ subject: 1 }); // Subject filtering
ItemSchema.index({ gradeLevel: 1 }); // Grade level filtering

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
