const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const Item = require('../models/Item');
const Category = require('../models/Category');
const CustomField = require('../models/CustomField');

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, '../uploads/csv/'),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Export inventory to CSV
router.get('/export', authenticateToken, async (req, res) => {
  try {
    // Fetch all items with populated categories and custom fields
    const items = await Item.find()
      .populate('category', 'name')
      .lean();

    // Get all custom fields to include in export
    const customFields = await CustomField.find().lean();

    // Prepare the data for CSV export
    const csvData = items.map(item => {
      const baseData = {
        name: item.name,
        quantity: item.quantity,
        location: item.location || '',
        category: item.category ? item.category.name : '',
        minimumQuantity: item.minimumQuantity || 0,
        serialNumber: item.serialNumber || '',
        notes: item.notes || '',
        alertEnabled: item.alertEnabled || false,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };

      // Add custom field values
      if (item.customFields && typeof item.customFields === 'object') {
        customFields.forEach(field => {
          // Handle both array and object formats
          let value = '';
          if (Array.isArray(item.customFields)) {
            const fieldData = item.customFields.find(cf => cf.fieldId && cf.fieldId.toString() === field._id.toString());
            value = fieldData ? fieldData.value : '';
          } else {
            // Handle object format
            value = item.customFields[field._id.toString()] || item.customFields[field.name] || '';
          }
          baseData[`custom_${field.name}`] = value;
        });
      }

      return baseData;
    });

    // Convert to CSV
    const fields = [
      'name',
      'quantity', 
      'location',
      'category',
      'minimumQuantity',
      'serialNumber',
      'notes',
      'alertEnabled',
      'createdAt',
      'updatedAt'
    ];

    // Add custom field columns
    customFields.forEach(field => {
      fields.push(`custom_${field.name}`);
    });

    const json2csvParser = new Parser({ fields });
    const csvString = json2csvParser.parse(csvData);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory.csv"');
    
    res.send(csvString);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Import inventory from CSV
router.post('/import', authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const results = [];
  const errors = [];
  let rowCount = 0;

  try {
    // Get existing categories and custom fields
    const categories = await Category.find().lean();
    const customFields = await CustomField.find().lean();

    // Create category lookup map
    const categoryMap = new Map();
    categories.forEach(cat => {
      categoryMap.set(cat.name.toLowerCase(), cat._id);
    });

    // Create custom fields lookup map
    const customFieldMap = new Map();
    customFields.forEach(field => {
      customFieldMap.set(`custom_${field.name}`.toLowerCase(), field);
    });

    // Read and parse the CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', async (row) => {
          rowCount++;
          try {
            // Validate required fields
            if (!row.name || !row.quantity) {
              errors.push(`Row ${rowCount}: Name and quantity are required`);
              return;
            }

            // Prepare item data
            const itemData = {
              name: row.name.trim(),
              quantity: parseInt(row.quantity) || 0,
              location: row.location ? row.location.trim() : '',
              minimumQuantity: parseInt(row.minimumQuantity) || 0,
              serialNumber: row.serialNumber ? row.serialNumber.trim() : '',
              notes: row.notes ? row.notes.trim() : '',
              alertEnabled: row.alertEnabled === 'true' || row.alertEnabled === '1',
              customFields: {}
            };

            // Handle category
            if (row.category) {
              const categoryId = categoryMap.get(row.category.toLowerCase().trim());
              if (categoryId) {
                itemData.category = categoryId;
              } else {
                errors.push(`Row ${rowCount}: Category '${row.category}' not found`);
              }
            }

            // Handle custom fields - store as object for compatibility
            const customFieldsData = {};
            Object.keys(row).forEach(key => {
              const lowerKey = key.toLowerCase();
              if (lowerKey.startsWith('custom_')) {
                const fieldName = key.slice(7); // Remove 'custom_' prefix
                const field = customFields.find(f => f.name.toLowerCase() === fieldName.toLowerCase());
                if (field && row[key]) {
                  let value = row[key].trim();
                  
                  // Validate field type
                  if (field.type === 'number') {
                    const numValue = parseFloat(value);
                    if (isNaN(numValue)) {
                      errors.push(`Row ${rowCount}: Invalid number value for field '${field.name}'`);
                      return;
                    }
                    value = numValue;
                  } else if (field.type === 'dropdown') {
                    if (!field.options.includes(value)) {
                      errors.push(`Row ${rowCount}: Invalid option '${value}' for dropdown field '${field.name}'`);
                      return;
                    }
                  } else if (field.type === 'date') {
                    const dateValue = new Date(value);
                    if (isNaN(dateValue.getTime())) {
                      errors.push(`Row ${rowCount}: Invalid date value for field '${field.name}'`);
                      return;
                    }
                    value = dateValue;
                  }

                  customFieldsData[field._id.toString()] = value;
                }
              }
            });

            itemData.customFields = customFieldsData;

            // Check if item already exists
            const existingItem = await Item.findOne({ name: itemData.name });
            
            if (existingItem) {
              // Update existing item
              Object.assign(existingItem, itemData);
              await existingItem.save();
              results.push({ action: 'updated', name: itemData.name });
            } else {
              // Create new item
              const newItem = new Item(itemData);
              await newItem.save();
              results.push({ action: 'created', name: itemData.name });
            }

          } catch (itemError) {
            errors.push(`Row ${rowCount}: ${itemError.message}`);
          }
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    // Return response based on results
    if (errors.length > 0 && results.length === 0) {
      return res.status(400).json({ error: 'Import failed', errors });
    } else if (errors.length > 0) {
      return res.status(207).json({ 
        message: 'Import completed with errors', 
        results, 
        errors 
      });
    } else {
      return res.json({ 
        message: 'Import completed successfully', 
        results 
      });
    }

  } catch (err) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Import error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/', (req, res) => {
  res.json({ message: 'Import/Export API is working' });
});

module.exports = router;
