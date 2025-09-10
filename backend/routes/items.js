
const express = require('express');
const router = express.Router();

const Item = require('../models/Item');
const Category = require('../models/Category');
const CustomField = require('../models/CustomField');
const auditLogger = require('../middleware/auditLogger');
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const cacheManager = require('../utils/cacheManager');

const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Get all items with enterprise-level pagination, filtering, and caching
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100 items per page
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    
    // Search functionality
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { location: { $regex: req.query.search, $options: 'i' } },
        { notes: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Category filter
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Sort options
    const sortOptions = {};
    if (req.query.sort) {
      const [field, order] = req.query.sort.split(':');
      sortOptions[field] = order === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = -1; // Default sort by newest
    }

    // Generate cache key
    const cacheKey = cacheManager.generateItemsKey(filter, page, limit, sortOptions);
    
    // Try to get from cache first
    const cachedResult = cacheManager.get(cacheKey);
    if (cachedResult) {
      return res.json(cachedResult);
    }
    
    // Quantity filters
    if (req.query.minQuantity) {
      filter.quantity = { ...filter.quantity, $gte: parseInt(req.query.minQuantity) };
    }
    if (req.query.maxQuantity) {
      filter.quantity = { ...filter.quantity, $lte: parseInt(req.query.maxQuantity) };
    }
    
    // Low stock filter
    if (req.query.lowStock === 'true') {
      filter.$expr = { $lte: ['$quantity', '$minimumQuantity'] };
    }
    
    // Sort options
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    if (req.query.sortBy || req.query.sortOrder) {
      sortOptions[sortBy] = sortOrder;
    }
    
    // Execute optimized query with pagination
    const startTime = Date.now();
    const [items, totalCount] = await Promise.all([
      Item.find(filter)
        .populate('category', 'name')
        .populate('createdBy', 'username')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean() // Use lean() for better performance
        .hint({ createdAt: -1 }), // Hint to use index
      Item.countDocuments(filter)
    ]);
    
    const queryTime = Date.now() - startTime;
    console.log(`Item query returned ${items.length} results in ${queryTime}ms`);
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    const result = {
      items,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null
      },
      filters: {
        search: req.query.search || null,
        category: req.query.category || null,
        sortBy,
        sortOrder: req.query.sortOrder || 'desc'
      },
      performance: {
        queryTime,
        cached: false
      }
    };

    // Cache the result for 2 minutes (frequent data changes)
    cacheManager.set(cacheKey, result, 120000);

    res.json(result);
  } catch (err) {
    console.error('Error fetching items:', err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Search item by barcode/QR code
router.get('/search/barcode/:code', authenticateToken, async (req, res) => {
  try {
    const { code } = req.params;
    
    // Search for item by SKU or custom barcode field
    const item = await Item.findOne({
      $or: [
        { sku: code },
        { barcode: code },
        { 'customFields.barcode': code },
        { 'customFields.qrCode': code }
      ]
    }).populate('category');

    if (!item) {
      return res.status(404).json({ message: 'Item not found with this barcode' });
    }

    // Log the barcode search
    await auditLogger.logSystemAction('BARCODE_SEARCH', req.user, `Searched for item by barcode: ${code}`, req);

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new item with optional image upload
router.post('/', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const itemData = { ...req.body };
    
    // Handle file upload
    if (req.file) {
      itemData.photo = req.file.filename;
    }
    
    // Parse customFields if sent as JSON string
    if (itemData.customFields && typeof itemData.customFields === 'string') {
      try {
        itemData.customFields = JSON.parse(itemData.customFields);
      } catch (e) {
        // Clean up uploaded file if customFields parsing fails
        if (req.file) {
          fs.unlinkSync(path.join(uploadsDir, req.file.filename));
        }
        return res.status(400).json({ error: 'Invalid customFields format' });
      }
    }

    // Convert quantity to number
    if (itemData.quantity) {
      itemData.quantity = parseInt(itemData.quantity, 10);
    }
    
    // Add the user who created the item
    itemData.createdBy = req.user.id;
    
    const item = new Item(itemData);
    await item.save();
    
    // Log the item creation
    await auditLogger.logItemChange('CREATE', item, req.user, {}, {}, req);
    
    res.status(201).json(item);
  } catch (err) {
    // Clean up uploaded file if save fails
    if (req.file) {
      fs.unlinkSync(path.join(uploadsDir, req.file.filename));
    }
    console.error('Error saving item:', err);
    res.status(400).json({ error: err.message });
  }
});

// Update item
router.put('/:id', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    // Get original item for audit log
    const originalItem = await Item.findById(req.params.id);
    if (!originalItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const updateData = req.body;
    
    // Remove fields that should not be changed during updates
    delete updateData.createdBy;
    delete updateData.createdAt;
    delete updateData._id;
    delete updateData.__v;
    
    if (req.file) {
      updateData.photo = req.file.filename;
    }
    // Parse customFields if sent as JSON string
    if (updateData.customFields && typeof updateData.customFields === 'string') {
      try {
        updateData.customFields = JSON.parse(updateData.customFields);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid customFields format' });
      }
    }

    // Track what changed
    const changes = {};
    const oldValues = {};
    for (const key in updateData) {
      if (originalItem[key] !== updateData[key]) {
        changes[key] = updateData[key];
        oldValues[key] = originalItem[key];
      }
    }

    const item = await Item.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    // Log the item update
    await auditLogger.logItemChange('UPDATE', item, req.user, changes, oldValues, req);
    
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete item
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await Item.findByIdAndDelete(req.params.id);
    
    // Log the item deletion
    await auditLogger.logItemChange('DELETE', item, req.user, {}, {}, req);
    
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Manual trigger for low stock alerts (admin only)
router.post('/test-alerts', authenticateToken, checkRole(['admin', 'superadmin']), async (req, res) => {
  try {
    const { checkLowStockItems } = require('../services/alertService');
    await checkLowStockItems();
    res.json({ message: 'Low stock check completed. Check notifications for any alerts.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to run low stock check', details: err.message });
  }
});

// Serve uploaded images statically
const uploadsPath = path.join(__dirname, '../uploads');
router.use('/uploads', express.static(uploadsPath));

module.exports = router;
