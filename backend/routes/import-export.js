const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx'); // Add Excel support
const { authenticateToken } = require('../middleware/auth');
const Item = require('../models/Item');
const Category = require('../models/Category');
const CustomField = require('../models/CustomField');
const cacheManager = require('../utils/cacheManager');

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, '../uploads/csv/'),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || 
        file.originalname.endsWith('.csv') ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
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
        title: item.title || item.name,
        name: item.name,
        isbn13: item.isbn13 || '',
        isbn10: item.isbn10 || '',
        category: item.category ? item.category.name : '',
        cases: item.cases || 0,
        caseQty: item.caseQty || 0,
        quantity: item.quantity,
        total: item.total || 0,
        location: item.location || '',
        status: item.status || 'active',
        statusColor: item.statusColor || '',
        publisher: item.publisher || '',
        edition: item.edition || '',
        subject: item.subject || '',
        gradeLevel: item.gradeLevel || '',
        minimumQuantity: item.minimumQuantity || 0,
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
      'title',
      'name',
      'isbn13',
      'isbn10',
      'category',
      'cases',
      'caseQty',
      'quantity',
      'total',
      'location',
      'status',
      'statusColor',
      'publisher',
      'edition',
      'subject',
      'gradeLevel',
      'minimumQuantity',
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

// Enhanced import inventory from CSV or Excel
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

    let data = [];
    const isExcel = req.file.originalname.match(/\.(xlsx|xls)$/i);

    if (isExcel) {
      // Handle Excel files
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0]; // Use first sheet
      const worksheet = workbook.Sheets[sheetName];
      data = xlsx.utils.sheet_to_json(worksheet, { defval: '' });
    } else {
      // Handle CSV files
      await new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (row) => data.push(row))
          .on('end', resolve)
          .on('error', reject);
      });
    }

    // Column mapping for flexible import
    const columnMappings = {
      // Standard mappings
      'title': ['title', 'book title', 'book name', 'name'],
      'name': ['name', 'title', 'book title', 'book name'],
      'isbn13': ['isbn-13', 'isbn13', 'isbn_13', 'isbn 13', 'isbn13:', 'isbn-13:', 'isbn_13:', 'isbn 13:', 'isbn-13 number', 'isbn13 number', 'isbn number'],
      'isbn10': ['isbn-10', 'isbn10', 'isbn_10', 'isbn 10'],
      'category': ['category', 'subject', 'type', 'classification'],
      'cases': ['cases', 'case', 'boxes', 'containers'],
      'caseQty': ['case qty', 'caseqty', 'case_qty', 'qty per case', 'per case'],
      'quantity': ['quantity', 'qty', 'amount', 'count', 'total'],
      'total': ['total', 'total qty', 'total quantity', 'overall total'],
      'location': ['location', 'shelf', 'room', 'area', 'position'],
      'status': ['status', 'condition', 'state'],
      'statusColor': ['#', 'color', 'status color', 'priority'],
      'publisher': ['publisher', 'publisher name', 'publishing company'],
      'edition': ['edition', 'version', 'revision'],
      'subject': ['subject', 'topic', 'area', 'field'],
      'gradeLevel': ['grade level', 'grade', 'level', 'class level'],
      'notes': ['notes', 'description', 'comments', 'remarks']
    };

    // Process each row
    for (const row of data) {
      rowCount++;
      try {
        const mappedData = {};
        
        // Map columns intelligently
        Object.keys(columnMappings).forEach(field => {
          const possibleColumns = columnMappings[field];
          for (const col of possibleColumns) {
            // Check for exact match (case insensitive)
            const matchingKey = Object.keys(row).find(key => 
              key.toLowerCase().trim() === col.toLowerCase().trim()
            );
            if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== '') {
              mappedData[field] = String(row[matchingKey]).trim();
              break;
            }
          }
        });

        // Debug logging for first few rows
        if (rowCount <= 3) {
          console.log(`\n--- Row ${rowCount} Debug Info ---`);
          console.log('Available columns:', Object.keys(row));
          console.log('Raw row data:', row);
          console.log('Mapped data:', mappedData);
          console.log('ISBN-13 specifically:', mappedData.isbn13);
          
          // Additional debug for ISBN-13 detection
          const possibleISBNColumns = Object.keys(row).filter(key => 
            key.toLowerCase().includes('isbn') || key.toLowerCase().includes('13')
          );
          console.log('Columns containing ISBN or 13:', possibleISBNColumns);
          possibleISBNColumns.forEach(col => {
            console.log(`  ${col}: "${row[col]}"`);
          });
        }

        // Validate required fields
        if (!mappedData.title && !mappedData.name) {
          errors.push(`Row ${rowCount}: Title or Name is required`);
          continue;
        }

        // Handle status color mapping (from your Excel colors)
        const statusColorMapping = {
          '1': { status: 'available', color: 'green' },
          '2': { status: 'low-stock', color: 'yellow' },
          '3': { status: 'out-of-stock', color: 'red' },
          '4': { status: 'on-order', color: 'blue' },
          '5': { status: 'discontinued', color: 'gray' }
        };

        // Prepare item data
        const itemData = {
          name: mappedData.title || mappedData.name,
          title: mappedData.title || mappedData.name,
          isbn13: mappedData.isbn13 || '',
          isbn10: mappedData.isbn10 || '',
          cases: 0, // Always set to 0 - we don't use cases
          caseQty: 0, // Always set to 0 - we don't use cases  
          quantity: parseInt(mappedData.quantity) || 0,
          total: parseInt(mappedData.quantity) || 0, // Use quantity as total
          location: mappedData.location || '',
          status: mappedData.status || 'active',
          statusColor: mappedData.statusColor || '',
          publisher: mappedData.publisher || '',
          edition: mappedData.edition || '',
          subject: mappedData.subject || '',
          gradeLevel: mappedData.gradeLevel || '',
          notes: mappedData.notes || '',
          minimumQuantity: 0,
          alertEnabled: true,
          createdBy: req.user.id,
          customFields: {}
        };

        // Map status color if it's a number
        if (statusColorMapping[mappedData.statusColor]) {
          itemData.status = statusColorMapping[mappedData.statusColor].status;
          itemData.statusColor = statusColorMapping[mappedData.statusColor].color;
        }

        // Handle category mapping
        if (mappedData.category) {
          const categoryId = categoryMap.get(mappedData.category.toLowerCase().trim());
          if (categoryId) {
            itemData.category = categoryId;
          } else {
            // Auto-create category if it doesn't exist
            try {
              const newCategory = new Category({ 
                name: mappedData.category,
                description: `Auto-created from import for ${mappedData.category} items`
              });
              await newCategory.save();
              categoryMap.set(mappedData.category.toLowerCase(), newCategory._id);
              itemData.category = newCategory._id;
              console.log(`✅ Auto-created category: ${mappedData.category}`);
            } catch (catError) {
              console.log(`⚠️ Could not create category: ${mappedData.category}`);
            }
          }
        }

        // Check if item already exists (by name, title, or ISBN)
        const existingItem = await Item.findOne({
          $or: [
            { name: itemData.name },
            { title: itemData.title },
            ...(itemData.isbn13 ? [{ isbn13: itemData.isbn13 }] : []),
            ...(itemData.isbn10 ? [{ isbn10: itemData.isbn10 }] : [])
          ]
        });

        if (existingItem) {
          // Update existing item
          Object.assign(existingItem, itemData);
          await existingItem.save();
          results.push({ action: 'updated', name: itemData.name, isbn13: itemData.isbn13 });
        } else {
          // Create new item
          const newItem = new Item(itemData);
          await newItem.save();
          results.push({ action: 'created', name: itemData.name, isbn13: itemData.isbn13 });
        }

      } catch (itemError) {
        console.error(`Row ${rowCount} error:`, itemError);
        errors.push(`Row ${rowCount}: ${itemError.message}`);
      }
    }

    // Clear categories cache since item counts have changed
    const categoriesCacheKey = cacheManager.generateCategoriesKey();
    cacheManager.delete(categoriesCacheKey);

    // Clean up uploaded file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Return response
    if (errors.length > 0 && results.length === 0) {
      return res.status(400).json({ error: 'Import failed', errors });
    } else if (errors.length > 0) {
      return res.status(207).json({ 
        message: `Import completed with ${results.length} items processed and ${errors.length} errors`, 
        results, 
        errors 
      });
    } else {
      return res.json({ 
        message: `Import completed successfully! Processed ${results.length} items`, 
        results 
      });
    }

  } catch (err) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Import error:', err);
    res.status(500).json({ error: `Import failed: ${err.message}` });
  }
});

router.get('/', (req, res) => {
  res.json({ message: 'Import/Export API is working' });
});

module.exports = router;
