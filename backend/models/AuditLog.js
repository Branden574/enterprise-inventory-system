const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'STATUS_CHANGE']
  },
  entityType: {
    type: String,
    required: true,
    enum: ['Item', 'Category', 'User', 'PurchaseOrder', 'CustomField', 'System']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false // Some actions like LOGIN don't have an entity
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    required: true
  },
  changes: {
    type: mongoose.Schema.Types.Mixed, // Store what changed
    default: {}
  },
  oldValues: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  newValues: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

// Index for better query performance
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ entityType: 1 });
auditLogSchema.index({ action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
