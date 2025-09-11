const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');
const Item = require('../models/Item');
const { authenticateToken } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

// Configure memory storage instead of direct Cloudinary storage to avoid Railway signature issues
const memoryStorage = multer.memoryStorage();

const upload = multer({ 
  storage: memoryStorage, // Store in memory first, then upload to Cloudinary manually
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for Railway
    fieldSize: 2 * 1024 * 1024, // 2MB field limit (increased)
    fields: 20, // Increased field limit
    parts: 25 // Increased parts limit to accommodate book fields
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 File filter check:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      console.error('❌ File rejected - not an image:', file.mimetype);
      cb(new Error(`Only image files are allowed. Received: ${file.mimetype}`), false);
    }
  }
});

// Create audit log helper
async function createAuditLog(user, action, itemName, details = '') {
  try {
    // If user doesn't have email, fetch it from database
    let userEmail = user.email;
    if (!userEmail && user.id) {
      const fullUser = await User.findById(user.id);
      userEmail = fullUser ? fullUser.email : 'unknown@unknown.com';
    }
    
    await AuditLog.create({
      userId: user.id || user._id,
      userEmail: userEmail || 'unknown@unknown.com',
      userRole: user.role,
      action,
      entityType: 'Item',
      description: `${action} item: ${itemName}${details ? ` - ${details}` : ''}`,
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
        .populate('createdBy', 'username')
        .populate('category', 'name description') // POPULATE CATEGORY DATA!
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Item.countDocuments(query)
    ]);

    // Debug: Log photo URLs and data structure
    items.forEach(item => {
      if (item.photo) {
        console.log(`📸 Item "${item.name}" has photo: ${item.photo}`);
      } else {
        console.log(`📷 Item "${item.name}" has no photo`);
      }
      
      // Debug category and ISBN data
      console.log(`📚 Item "${item.name}":`, {
        category: item.category,
        isbn13: item.isbn13,
        isbn10: item.isbn10,
        publisher: item.publisher
      });
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
    const item = await Item.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('category', 'name description');
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Test Cloudinary upload endpoint
router.post('/test-cloudinary-upload', authenticateToken, (req, res) => {
  console.log('🧪 Testing Cloudinary upload...');
  console.log('🧪 Request content-type:', req.headers['content-type']);
  
  // Use a simple multer configuration for testing
  const testUpload = multer({
    storage: multer.memoryStorage(), // Store in memory first
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      console.log('🧪 File filter:', file.mimetype);
      cb(null, true);
    }
  });
  
  testUpload.single('photo')(req, res, async (err) => {
    if (err) {
      console.error('🧪 Multer error:', err);
      return res.status(400).json({ error: 'Multer error', details: err.message });
    }
    
    try {
      console.log('🧪 File received:', req.file ? 'YES' : 'NO');
      if (req.file) {
        console.log('🧪 File details:', {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        });
        
        // Try the simplest possible upload to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              // Minimal parameters - just upload the file
              resource_type: 'auto'
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(req.file.buffer);
        });
        
        console.log('🧪 Cloudinary upload successful:', uploadResult.public_id);
        
        res.json({
          success: true,
          message: 'Test upload successful',
          url: uploadResult.secure_url,
          public_id: uploadResult.public_id
        });
      } else {
        res.status(400).json({ error: 'No file received' });
      }
    } catch (error) {
      console.error('🧪 Upload test error:', error);
      res.status(500).json({ 
        error: 'Upload test failed', 
        details: error.message,
        stack: error.stack 
      });
    }
  });
});

// Simple test route without file upload
router.post('/test-simple', authenticateToken, async (req, res) => {
  try {
    console.log('🧪 Simple test route hit');
    console.log('🧪 Body:', req.body);
    
    const { name, quantity, location } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const itemData = {
      name,
      quantity: parseInt(quantity) || 0,
      location: location || 'Test Location',
      createdBy: req.user ? req.user.id : null
    };
    
    const item = new Item(itemData);
    await item.save();
    
    res.status(201).json({
      success: true,
      message: 'Simple item created successfully',
      item: item
    });
    
  } catch (error) {
    console.error('🧪 Simple test error:', error);
    res.status(500).json({ 
      error: 'Simple test failed',
      details: error.message 
    });
  }
});

// POST new item with Cloudinary image upload
// POST new item - handle with and without images
router.post('/', authenticateToken, async (req, res) => {
  console.log('🚀 Starting item creation request...');
  console.log('📋 Content-Type:', req.headers['content-type']);
  
  // Check if this is a multipart request (has image)
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    console.log('📸 Multipart request detected - processing with file upload');
    return handleWithImageUpload(req, res);
  } else {
    console.log('📝 JSON request detected - processing without file upload');
    return handleWithoutImageUpload(req, res);
  }
});

// Handle requests without image upload (JSON)
async function handleWithoutImageUpload(req, res) {
  try {
    console.log('📝 Processing item without image...');
    console.log('📋 Request body:', req.body);

    const {
      name,
      description,
      category,
      quantity,
      lowStockThreshold,
      barcode,
      customFields,
      location,
      notes
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const itemData = {
      name,
      description,
      category: category || undefined,
      quantity: parseInt(quantity) || 0,
      lowStockThreshold: parseInt(lowStockThreshold) || 5,
      barcode,
      location,
      notes,
      customFields: customFields || {},
      createdBy: req.user.id
    };

    console.log('💾 Saving item to database (no image)...');
    const item = new Item(itemData);
    await item.save();
    
    console.log('✅ Item saved successfully:', item._id);

    // Create audit log
    await createAuditLog(
      req.user, 
      'CREATE', 
      item.name, 
      `Created item with quantity: ${item.quantity}`
    );

    res.status(201).json(item);
  } catch (error) {
    console.error('❌ Error creating item (no image):', error);
    res.status(500).json({ 
      error: 'Failed to create item', 
      details: error.message 
    });
  }
}

// Handle requests with image upload (multipart)
function handleWithImageUpload(req, res) {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      console.error('❌ Multer error:', err);
      return res.status(400).json({ 
        error: 'File upload error', 
        details: err.message,
        type: 'MULTER_ERROR'
      });
    }
    
    handleItemCreation(req, res);
  });
}

async function handleItemCreation(req, res) {
  try {
    console.log('📸 Creating item with file:', req.file ? 'YES' : 'NO');
    console.log('📋 Form data received:', {
      name: req.body.name,
      quantity: req.body.quantity,
      location: req.body.location
    });
    
    if (req.file) {
      console.log('📸 File details:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
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
      customFields,
      location,
      notes
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Parse customFields if it's a string
    let parsedCustomFields = {};
    if (customFields) {
      try {
        parsedCustomFields = typeof customFields === 'string' 
          ? JSON.parse(customFields) 
          : customFields;
      } catch (e) {
        console.error('Error parsing customFields:', e);
        return res.status(400).json({ error: 'Invalid custom fields format' });
      }
    }

    const itemData = {
      name,
      description,
      category: category || undefined,
      quantity: parseInt(quantity) || 0,
      lowStockThreshold: parseInt(lowStockThreshold) || 5,
      barcode,
      location,
      notes,
      customFields: parsedCustomFields,
      createdBy: req.user.id
    };

    // Handle Cloudinary upload manually if there's a file
    if (req.file) {
      try {
        console.log('📤 Uploading to Cloudinary manually...');
        console.log('🔑 Cloudinary config check:', {
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'MISSING',
          api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING',
          api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING'
        });
        
        const uploadResult = await new Promise((resolve, reject) => {
          const timestamp = Math.floor(Date.now() / 1000); // Use seconds, not milliseconds
          const random = Math.round(Math.random() * 1E9);
          const publicId = `item-${timestamp}-${random}`;
          
          // Simplified upload without transformations to avoid signature issues
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'inventory-items',
              public_id: publicId,
              resource_type: 'auto'
              // Removed transformations to simplify signature
            },
            (error, result) => {
              if (error) {
                console.error('❌ Cloudinary upload error:', error);
                reject(error);
              } else {
                console.log('✅ Cloudinary upload successful:', result.public_id);
                resolve(result);
              }
            }
          );
          
          uploadStream.end(req.file.buffer);
        });
        
        itemData.photo = uploadResult.secure_url; // Cloudinary URL
        itemData.photoPublicId = uploadResult.public_id; // Cloudinary public ID
        
        console.log('📸 Photo data added:', {
          photo: itemData.photo,
          photoPublicId: itemData.photoPublicId
        });
        
      } catch (uploadError) {
        console.error('❌ Failed to upload image to Cloudinary:', uploadError);
        return res.status(500).json({ 
          error: 'Failed to upload image', 
          details: uploadError.message 
        });
      }
    }

    console.log('💾 Saving item to database...');
    const item = new Item(itemData);
    await item.save();
    
    // Populate category data before returning
    await item.populate('category', 'name description');
    
    console.log('✅ Item saved successfully with ID:', item._id);
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
    console.error('❌ Error creating item:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Clean up uploaded image if item creation failed and we have a photo URL
    if (req.file && error.photoPublicId) {
      try {
        await cloudinary.uploader.destroy(error.photoPublicId);
        console.log('🗑️ Cleaned up uploaded image after error');
      } catch (cleanupError) {
        console.error('Failed to clean up uploaded image:', cleanupError);
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to create item', 
      details: error.message,
      type: 'CREATE_ERROR'
    });
  }
}

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
      try {
        console.log('📸 Processing image upload for item update...');
        console.log('🧪 File details:', {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        });
        
        // Delete old image from Cloudinary if it exists
        if (existingItem.photoPublicId) {
          try {
            await cloudinary.uploader.destroy(existingItem.photoPublicId);
            console.log('🗑️ Old image deleted:', existingItem.photoPublicId);
          } catch (deleteError) {
            console.error('Failed to delete old image from Cloudinary:', deleteError);
          }
        }
        
        // Manual upload to Cloudinary (same as POST route)
        const uploadResult = await new Promise((resolve, reject) => {
          const timestamp = Math.floor(Date.now() / 1000);
          const random = Math.round(Math.random() * 1E9);
          const publicId = `item-${timestamp}-${random}`;
          
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'inventory-items',
              public_id: publicId,
              resource_type: 'auto'
            },
            (error, result) => {
              if (error) {
                console.error('❌ Cloudinary upload error:', error);
                reject(error);
              } else {
                console.log('✅ Cloudinary upload successful:', result.public_id);
                resolve(result);
              }
            }
          );
          
          uploadStream.end(req.file.buffer);
        });
        
        // Set new image data
        updateData.photo = uploadResult.secure_url;
        updateData.photoPublicId = uploadResult.public_id;
        
        console.log('📸 Photo data updated:', {
          photo: updateData.photo,
          photoPublicId: updateData.photoPublicId
        });
        
      } catch (uploadError) {
        console.error('❌ Failed to upload image to Cloudinary:', uploadError);
        return res.status(500).json({ 
          error: 'Failed to upload image', 
          details: uploadError.message 
        });
      }
    }

    const item = await Item.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('category', 'name description');

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
    })
      .populate('category', 'name description')
      .sort({ quantity: 1 });
    
    res.json(items);
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
});

// GET inventory value
router.get('/reports/value', authenticateToken, async (req, res) => {
  try {
    const items = await Item.find({})
      .populate('category', 'name description');
    
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

// Test Cloudinary connection (no auth required for testing)
router.get('/test-cloudinary-config', async (req, res) => {
  try {
    console.log('🧪 Testing Cloudinary configuration...');
    
    // Test environment variables
    const config = {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    };
    
    console.log('🧪 Cloudinary config check:', {
      cloud_name: config.cloud_name ? 'SET' : 'MISSING',
      api_key: config.api_key ? 'SET' : 'MISSING',
      api_secret: config.api_secret ? 'SET' : 'MISSING'
    });

    console.log('🧪 Actual values (first 5 chars):', {
      cloud_name: config.cloud_name ? config.cloud_name.substring(0, 5) + '...' : 'MISSING',
      api_key: config.api_key ? config.api_key.substring(0, 5) + '...' : 'MISSING',
      api_secret: config.api_secret ? config.api_secret.substring(0, 5) + '...' : 'MISSING'
    });
    
    // Test Cloudinary API connection with basic ping
    try {
      const cloudinaryTest = await cloudinary.api.ping();
      console.log('🧪 Cloudinary ping successful:', cloudinaryTest);
      
      res.json({
        success: true,
        message: 'Cloudinary configuration is working',
        config: {
          cloud_name: config.cloud_name ? 'SET' : 'MISSING',
          api_key: config.api_key ? 'SET' : 'MISSING',
          api_secret: config.api_secret ? 'SET' : 'MISSING'
        },
        ping: cloudinaryTest
      });
    } catch (pingError) {
      console.error('🧪 Cloudinary ping failed:', pingError);
      res.status(500).json({
        success: false,
        message: 'Cloudinary ping failed',
        error: pingError.message,
        config: {
          cloud_name: config.cloud_name ? 'SET' : 'MISSING',
          api_key: config.api_key ? 'SET' : 'MISSING',
          api_secret: config.api_secret ? 'SET' : 'MISSING'
        }
      });
    }
    
  } catch (error) {
    console.error('🧪 Cloudinary test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Cloudinary configuration failed',
      error: error.message,
      stack: error.stack
    });
  }
});

// Bulk delete all items - SuperAdmin only
router.delete('/bulk/all', authenticateToken, async (req, res) => {
  try {
    // Check if user is superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied. SuperAdmin privileges required.' });
    }

    // Delete all items
    const result = await Item.deleteMany({});
    
    // Log the action
    await AuditLog.create({
      action: 'BULK_DELETE_ALL',
      entityType: 'Item',
      entityId: null,
      userId: req.user.id,
      changes: { deletedCount: result.deletedCount },
      ipAddress: req.ip
    });

    res.json({ 
      message: `Successfully deleted ${result.deletedCount} items`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk delete all error:', error);
    res.status(500).json({ error: 'Failed to delete all items' });
  }
});

// Test endpoint to verify server is working
router.get('/test-server', (req, res) => {
  res.json({ 
    message: 'Server is working!', 
    timestamp: new Date().toISOString(),
    environment: {
      node_env: process.env.NODE_ENV,
      port: process.env.PORT
    },
    cloudinary: {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'MISSING',
      api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING', 
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING'
    }
  });
});

module.exports = router;
