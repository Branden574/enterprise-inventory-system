const mongoose = require('mongoose');

const CustomFieldSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  type: { 
    type: String, 
    required: true,
    enum: ['text', 'number', 'date', 'dropdown']
  },
  options: [{
    type: String,
    trim: true
  }],
  required: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    trim: true
  },
  defaultValue: {
    type: mongoose.Schema.Types.Mixed
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Update the updatedAt timestamp before saving
CustomFieldSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CustomField', CustomFieldSchema);
