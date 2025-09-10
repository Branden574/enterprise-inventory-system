const mongoose = require('mongoose');

const completedPOSchema = new mongoose.Schema({
  poNumber: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  vendor: {
    type: String,
    required: true
  },
  totalAmount: {
    type: Number,
    required: false
  },
  orderDate: {
    type: Date,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  department: {
    type: String,
    required: false
  },
  category: {
    type: String,
    required: false
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['completed', 'archived'],
    default: 'completed'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CompletedPO', completedPOSchema);
