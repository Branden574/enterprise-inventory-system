const express = require('express');
const router = express.Router();
const CustomField = require('../models/CustomField');
const { authenticateToken } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Get all custom fields
router.get('/', authenticateToken, async (req, res) => {
  try {
    const customFields = await CustomField.find().sort('name');
    res.json(customFields);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new custom field (admin only)
router.post('/', authenticateToken, checkRole('admin'), async (req, res) => {
  try {
    const customField = new CustomField({
      ...req.body,
      createdBy: req.user.id
    });
    
    // Validate dropdown options
    if (customField.type === 'dropdown' && (!customField.options || customField.options.length === 0)) {
      return res.status(400).json({ error: 'Dropdown fields require at least one option' });
    }

    await customField.save();
    res.status(201).json(customField);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update custom field (admin only)
router.put('/:id', authenticateToken, checkRole('admin'), async (req, res) => {
  try {
    const customField = await CustomField.findById(req.params.id);
    if (!customField) {
      return res.status(404).json({ error: 'Custom field not found' });
    }

    // Validate dropdown options
    if (req.body.type === 'dropdown' && (!req.body.options || req.body.options.length === 0)) {
      return res.status(400).json({ error: 'Dropdown fields require at least one option' });
    }

    // Update the field
    Object.assign(customField, req.body);
    await customField.save();
    res.json(customField);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete custom field (admin only)
router.delete('/:id', authenticateToken, checkRole('admin'), async (req, res) => {
  try {
    const customField = await CustomField.findById(req.params.id);
    if (!customField) {
      return res.status(404).json({ error: 'Custom field not found' });
    }

    await customField.deleteOne();
    res.json({ message: 'Custom field deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get custom field by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const customField = await CustomField.findById(req.params.id);
    if (!customField) {
      return res.status(404).json({ error: 'Custom field not found' });
    }
    res.json(customField);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
