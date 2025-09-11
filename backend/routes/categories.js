const express = require('express');
const router = express.Router();

const Category = require('../models/Category');
const Item = require('../models/Item');
const { authenticateToken } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');
const cacheManager = require('../utils/cacheManager');

// Get all categories with item counts and caching
router.get('/', async (req, res) => {
  try {
    const cacheKey = cacheManager.generateCategoriesKey();
    
    // Try cache first
    const cachedCategories = cacheManager.get(cacheKey);
    if (cachedCategories) {
      return res.json(cachedCategories);
    }

    const startTime = Date.now();
    
    // Aggregate pipeline to get categories with item counts
    const categoriesWithCounts = await Category.aggregate([
      {
        $lookup: {
          from: 'items', // MongoDB collection name (lowercase and pluralized)
          localField: '_id',
          foreignField: 'category',
          as: 'items'
        }
      },
      {
        $addFields: {
          itemCount: { $size: '$items' }
        }
      },
      {
        $project: {
          items: 0 // Don't include the actual items array, just the count
        }
      },
      {
        $sort: { name: 1 }
      }
    ]);
    
    const queryTime = Date.now() - startTime;
    console.log(`📊 Categories with counts loaded in ${queryTime}ms`);
    
    // Cache for 2 minutes (shorter cache since item counts change frequently)
    cacheManager.set(cacheKey, categoriesWithCounts, 120000);
    
    res.json(categoriesWithCounts);
  } catch (err) {
    console.error('Error fetching categories with counts:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add new category
router.post('/', authenticateToken, async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    
    // Clear categories cache since we added a new one
    const cacheKey = cacheManager.generateCategoriesKey();
    cacheManager.delete(cacheKey);
    
    // Log category creation
    await auditLogger.logCategoryChange('CREATE', category, req.user, {}, {}, req);
    
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update category
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Get original category for audit log
    const originalCategory = await Category.findById(req.params.id);
    if (!originalCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Track what changed
    const changes = {};
    const oldValues = {};
    for (const key in req.body) {
      if (originalCategory[key] !== req.body[key]) {
        changes[key] = req.body[key];
        oldValues[key] = originalCategory[key];
      }
    }

    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    // Clear categories cache since we updated a category
    const cacheKey = cacheManager.generateCategoriesKey();
    cacheManager.delete(cacheKey);
    
    // Log category update
    await auditLogger.logCategoryChange('UPDATE', category, req.user, changes, oldValues, req);
    
    res.json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete category
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await Category.findByIdAndDelete(req.params.id);
    
    // Clear categories cache since we deleted a category
    const cacheKey = cacheManager.generateCategoriesKey();
    cacheManager.delete(cacheKey);
    
    // Log category deletion
    await auditLogger.logCategoryChange('DELETE', category, req.user, {}, {}, req);
    
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
