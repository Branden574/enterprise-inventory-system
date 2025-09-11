const express = require('express');
const router = express.Router();

const Category = require('../models/Category');
const { authenticateToken } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');
const cacheManager = require('../utils/cacheManager');

// Get all categories with caching
router.get('/', async (req, res) => {
  try {
    const cacheKey = cacheManager.generateCategoriesKey();
    
    // Try cache first
    const cachedCategories = cacheManager.get(cacheKey);
    if (cachedCategories) {
      return res.json(cachedCategories);
    }

    const startTime = Date.now();
    const categories = await Category.find().lean().sort({ name: 1 });
    const queryTime = Date.now() - startTime;
    
    // Cache for 10 minutes (categories change less frequently)
    cacheManager.set(cacheKey, categories, 600000);
    
    res.json(categories);
  } catch (err) {
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
