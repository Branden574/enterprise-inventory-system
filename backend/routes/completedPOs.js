const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const CompletedPO = require('../models/CompletedPO');
const { authenticateToken } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/completed-pos');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow images and PDFs
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xlsx|xls/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and office documents are allowed'));
    }
  }
});

// Get all completed purchase orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const completedPOs = await CompletedPO.find()
      .populate('uploadedBy', 'username email')
      .sort({ createdAt: -1 });
    
    res.json(completedPOs);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get single completed purchase order
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const completedPO = await CompletedPO.findById(req.params.id)
      .populate('uploadedBy', 'username email');
    
    if (!completedPO) {
      return res.status(404).json({ error: 'Completed purchase order not found' });
    }
    
    res.json(completedPO);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Create new completed purchase order with file uploads
router.post('/', authenticateToken, upload.array('attachments', 5), async (req, res) => {
  try {
    const {
      poNumber,
      title,
      description,
      vendor,
      totalAmount,
      orderDate,
      department,
      category,
      notes
    } = req.body;
    
    // Check if PO number already exists
    const existingPO = await CompletedPO.findOne({ poNumber });
    if (existingPO) {
      return res.status(400).json({ error: 'Purchase order number already exists' });
    }
    
    // Process uploaded files
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    })) : [];
    
    const completedPO = new CompletedPO({
      poNumber,
      title,
      description,
      vendor,
      totalAmount: totalAmount ? parseFloat(totalAmount) : undefined,
      orderDate: new Date(orderDate),
      uploadedBy: req.user.id,
      attachments,
      department,
      category,
      notes
    });
    
    await completedPO.save();
    
    // Populate the saved PO before returning
    const populatedPO = await CompletedPO.findById(completedPO._id)
      .populate('uploadedBy', 'username email');
    
    // Log the activity
    await auditLogger.logAction(
      'CREATE',
      'CompletedPO',
      completedPO._id,
      req.user.id,
      req.user.email || req.user.username || `user_${req.user.id}`,
      req.user.role,
      {
        poNumber: completedPO.poNumber,
        vendor: completedPO.vendor,
        attachmentCount: attachments.length
      },
      {},
      completedPO.toObject ? completedPO.toObject() : completedPO,
      `Created completed purchase order "${completedPO.poNumber}" for vendor "${completedPO.vendor}"`,
      req
    );
    
    res.status(201).json(populatedPO);
  } catch (err) {
    // Clean up uploaded files if there's an error
    if (req.files) {
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkErr) {
          console.error('Error deleting file:', unlinkErr);
        }
      });
    }
    res.status(400).json({ error: err.message });
  }
});

// Update completed purchase order
router.put('/:id', authenticateToken, upload.array('newAttachments', 5), async (req, res) => {
  try {
    const completedPO = await CompletedPO.findById(req.params.id);
    
    if (!completedPO) {
      return res.status(404).json({ error: 'Completed purchase order not found' });
    }
    
    // Only allow the uploader or admin to edit
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && 
        completedPO.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const {
      title,
      description,
      vendor,
      totalAmount,
      orderDate,
      department,
      category,
      notes,
      removeAttachments
    } = req.body;
    
    // Update basic fields
    if (title) completedPO.title = title;
    if (description !== undefined) completedPO.description = description;
    if (vendor) completedPO.vendor = vendor;
    if (totalAmount !== undefined) completedPO.totalAmount = totalAmount ? parseFloat(totalAmount) : undefined;
    if (orderDate) completedPO.orderDate = new Date(orderDate);
    if (department !== undefined) completedPO.department = department;
    if (category !== undefined) completedPO.category = category;
    if (notes !== undefined) completedPO.notes = notes;
    
    // Handle attachment removal
    if (removeAttachments) {
      const attachmentsToRemove = JSON.parse(removeAttachments);
      attachmentsToRemove.forEach(filename => {
        // Remove file from filesystem
        const filePath = path.join(__dirname, '../uploads/completed-pos', filename);
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
        
        // Remove from database
        completedPO.attachments = completedPO.attachments.filter(
          att => att.filename !== filename
        );
      });
    }
    
    // Add new attachments
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      }));
      
      completedPO.attachments.push(...newAttachments);
    }
    
    await completedPO.save();
    
    const populatedPO = await CompletedPO.findById(completedPO._id)
      .populate('uploadedBy', 'username email');
    
    // Log the activity
    await auditLogger.logAction(
      'UPDATE',
      'CompletedPO',
      completedPO._id,
      req.user.id,
      req.user.email || req.user.username || `user_${req.user.id}`,
      req.user.role,
      {
        poNumber: completedPO.poNumber
      },
      {},
      completedPO.toObject ? completedPO.toObject() : completedPO,
      `Updated completed purchase order "${completedPO.poNumber}"`,
      req
    );
    
    res.json(populatedPO);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete completed purchase order
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const completedPO = await CompletedPO.findById(req.params.id);
    
    if (!completedPO) {
      return res.status(404).json({ error: 'Completed purchase order not found' });
    }
    
    // Only allow admin or the uploader to delete
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && 
        completedPO.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Delete associated files
    completedPO.attachments.forEach(attachment => {
      const filePath = path.join(__dirname, '../uploads/completed-pos', attachment.filename);
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    });
    
    await CompletedPO.findByIdAndDelete(req.params.id);
    
    // Log the activity
    await auditLogger.logAction(
      'DELETE',
      'CompletedPO',
      req.params.id,
      req.user.id,
      req.user.email || req.user.username || `user_${req.user.id}`,
      req.user.role,
      {
        poNumber: completedPO.poNumber
      },
      completedPO.toObject ? completedPO.toObject() : completedPO,
      {},
      `Deleted completed purchase order "${completedPO.poNumber}"`,
      req
    );
    
    res.json({ message: 'Completed purchase order deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Download attachment
router.get('/:id/attachments/:filename', authenticateToken, async (req, res) => {
  try {
    const completedPO = await CompletedPO.findById(req.params.id);
    
    if (!completedPO) {
      return res.status(404).json({ error: 'Completed purchase order not found' });
    }
    
    const attachment = completedPO.attachments.find(
      att => att.filename === req.params.filename
    );
    
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }
    
    const filePath = path.join(__dirname, '../uploads/completed-pos', attachment.filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }
    
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    res.setHeader('Content-Type', attachment.mimetype);
    
    res.sendFile(filePath);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
