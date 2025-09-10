const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');
const Item = require('../models/Item');
const { authenticateToken } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'inventory-items',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    public_id: (req, file) => {
      const timestamp = Date.now();
      const random = Math.round(Math.random() * 1E9);
      return `item-${timestamp}-${random}`;
    },
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Create audit log helper
async function createAuditLog(user, action, itemName, details = '') {
  try {
    await AuditLog.create({
      user: user._id,
      userName: user.username,
      userRole: user.role,
      action,
      targetType: 'Item',
      targetName: itemName,
      details,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

// GET all items with enhanced features
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      category = '',
      lowStock = '',
      sortBy = 'name',
      sortOrder = 'asc',
      customField = ''
    } = req.query;

    // Build query
    let query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Category filter
    if (category) {
      query.category = category;
    }
    
    // Low stock filter
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$quantity', '$lowStockThreshold'] };
    }
    
    // Custom field filter
    if (customField) {
      const [fieldName, fieldValue] = customField.split(':');
      if (fieldName && fieldValue) {
        query[`customFields.${fieldName}`] = { $regex: fieldValue, $options: 'i' };
      }
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [items, totalItems] = await Promise.all([
      Item.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Item.countDocuments(query)
    ]);

    // Debug: Log photo URLs
    items.forEach(item => {
      if (item.photo) {
        console.log(`📸 Item "${item.name}" has photo: ${item.photo}`);
      } else {
        console.log(`📷 Item "${item.name}" has no photo`);
      }
    });

    const totalPages = Math.ceil(totalItems / limitNum);

    res.json({
      items,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// GET item by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// POST new item with Cloudinary image upload
router.post('/', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    console.log('📸 Creating item with file:', req.file ? 'YES' : 'NO');
    if (req.file) {
      console.log('📸 File details:', {
        path: req.file.path,
        filename: req.file.filename,
        size: req.file.size
      });
    }

    const {
      name,
      description,
      category,
      quantity,
      lowStockThreshold,
      barcode,
      customFields
    } = req.body;

    // Parse customFields if it's a string
    let parsedCustomFields = {};
    if (customFields) {
      try {
        parsedCustomFields = typeof customFields === 'string' 
          ? JSON.parse(customFields) 
          : customFields;
      } catch (e) {
        console.error('Error parsing customFields:', e);
      }
    }

    const itemData = {
      name,
      description,
      category,
      quantity: parseInt(quantity) || 0,
      lowStockThreshold: parseInt(lowStockThreshold) || 5,
      barcode,
      customFields: parsedCustomFields
    };

    // Add Cloudinary photo data if uploaded
    if (req.file) {
      itemData.photo = req.file.path; // Cloudinary URL
      itemData.photoPublicId = req.file.filename; // Cloudinary public ID
      console.log('📸 Adding photo data to item:', {
        photo: itemData.photo,
        photoPublicId: itemData.photoPublicId
      });
    }

    const item = new Item(itemData);
    await item.save();
    
    console.log('✅ Item saved with photo:', item.photo);

    // Create audit log
    await createAuditLog(
      req.user, 
      'CREATE', 
      item.name, 
      `Created item with quantity: ${item.quantity}`
    );

    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating item:', error);
    
    // Clean up uploaded image if item creation failed
    if (req.file && req.file.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (cleanupError) {
        console.error('Failed to clean up uploaded image:', cleanupError);
      }
    }
    
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// PUT update item with optional image upload
router.put('/:id', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const existingItem = await Item.findById(req.params.id);
    if (!existingItem) {
      // Clean up uploaded image if item doesn't exist
      if (req.file && req.file.filename) {
        try {
          await cloudinary.uploader.destroy(req.file.filename);
        } catch (cleanupError) {
          console.error('Failed to clean up uploaded image:', cleanupError);
        }
      }
      return res.status(404).json({ error: 'Item not found' });
    }

    const {
      name,
      description,
      category,
      quantity,
      lowStockThreshold,
      barcode,
      customFields
    } = req.body;

    // Parse customFields if it's a string
    let parsedCustomFields = {};
    if (customFields) {
      try {
        parsedCustomFields = typeof customFields === 'string' 
          ? JSON.parse(customFields) 
          : customFields;
      } catch (e) {
        console.error('Error parsing customFields:', e);
        parsedCustomFields = existingItem.customFields || {};
      }
    }

    const updateData = {
      name: name || existingItem.name,
      description: description || existingItem.description,
      category: category || existingItem.category,
      quantity: quantity !== undefined ? parseInt(quantity) : existingItem.quantity,
      lowStockThreshold: lowStockThreshold !== undefined ? parseInt(lowStockThreshold) : existingItem.lowStockThreshold,
      barcode: barcode || existingItem.barcode,
      customFields: parsedCustomFields
    };

    // Handle new image upload
    if (req.file) {
      // Delete old image from Cloudinary if it exists
      if (existingItem.photoPublicId) {
        try {
          await cloudinary.uploader.destroy(existingItem.photoPublicId);
        } catch (deleteError) {
          console.error('Failed to delete old image from Cloudinary:', deleteError);
        }
      }
      
      // Set new image data
      updateData.photo = req.file.path;
      updateData.photoPublicId = req.file.filename;
    }

    const item = await Item.findByIdAndUpdate(req.params.id, updateData, { new: true });

    // Create audit log
    await createAuditLog(
      req.user, 
      'UPDATE', 
      item.name, 
      `Updated item. New quantity: ${item.quantity}`
    );

    res.json(item);
  } catch (error) {
    console.error('Error updating item:', error);
    
    // Clean up uploaded image if update failed
    if (req.file && req.file.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (cleanupError) {
        console.error('Failed to clean up uploaded image:', cleanupError);
      }
    }
    
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE item
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Delete image from Cloudinary if it exists
    if (item.photoPublicId) {
      try {
        await cloudinary.uploader.destroy(item.photoPublicId);
        console.log('Successfully deleted image from Cloudinary:', item.photoPublicId);
      } catch (deleteError) {
        console.error('Failed to delete image from Cloudinary:', deleteError);
        // Continue with item deletion even if image deletion fails
      }
    }

    await Item.findByIdAndDelete(req.params.id);

    // Create audit log
    await createAuditLog(
      req.user, 
      'DELETE', 
      item.name, 
      `Deleted item with quantity: ${item.quantity}`
    );

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// PATCH update quantity only (for barcode scanner)
router.patch('/:id/quantity', authenticateToken, async (req, res) => {
  try {
    const { quantity } = req.body;
    
    if (quantity === undefined || quantity === null) {
      return res.status(400).json({ error: 'Quantity is required' });
    }

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { quantity: parseInt(quantity) },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Create audit log
    await createAuditLog(
      req.user, 
      'UPDATE_QUANTITY', 
      item.name, 
      `Updated quantity to: ${item.quantity}`
    );

    res.json(item);
  } catch (error) {
    console.error('Error updating quantity:', error);
    res.status(500).json({ error: 'Failed to update quantity' });
  }
});

// GET items by barcode
router.get('/barcode/:barcode', authenticateToken, async (req, res) => {
  try {
    const item = await Item.findOne({ barcode: req.params.barcode });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Error finding item by barcode:', error);
    res.status(500).json({ error: 'Failed to find item' });
  }
});

// GET low stock items
router.get('/reports/low-stock', authenticateToken, async (req, res) => {
  try {
    const items = await Item.find({
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] }
    }).sort({ quantity: 1 });
    
    res.json(items);
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
});

// GET inventory value
router.get('/reports/value', authenticateToken, async (req, res) => {
  try {
    const items = await Item.find({});
    
    const summary = {
      totalItems: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      totalValue: items.reduce((sum, item) => sum + (item.quantity * (item.price || 0)), 0),
      lowStockItems: items.filter(item => item.quantity <= item.lowStockThreshold).length
    };
    
    res.json(summary);
  } catch (error) {
    console.error('Error calculating inventory value:', error);
    res.status(500).json({ error: 'Failed to calculate inventory value' });
  }
});

// Test Cloudinary upload endpoint
router.post('/test-cloudinary', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    console.log('🧪 Testing Cloudinary upload...');
    console.log('🧪 File received:', req.file ? 'YES' : 'NO');
    
    if (req.file) {
      console.log('🧪 Cloudinary upload result:', {
        path: req.file.path,
        filename: req.file.filename,
        size: req.file.size,
        format: req.file.format,
        resource_type: req.file.resource_type
      });
      
      res.json({
        success: true,
        message: 'Cloudinary upload successful!',
        url: req.file.path,
        publicId: req.file.filename
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'No file received'
      });
    }
  } catch (error) {
    console.error('🧪 Cloudinary test error:', error);
    res.status(500).json({
      success: false,
      message: 'Cloudinary test failed',
      error: error.message
    });
  }
});

module.exports = router;
