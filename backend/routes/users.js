
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');

// Middleware to check admin or superadmin
const isAdminOrSuperAdmin = (req, res, next) => {
  console.log('Checking admin access. User role:', req.user?.role);
  if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
    console.log('Access denied - not admin/superadmin');
    return res.status(403).json({ error: 'Admin access required.' });
  }
  console.log('Access granted - is admin/superadmin');
  next();
};

// Get all users (admin only)
router.get('/', authenticateToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Edit user (admin only)
router.put('/:id', authenticateToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    // Get original user for audit log
    const originalUser = await User.findById(req.params.id);
    if (!originalUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Allow role change to 'admin', 'staff', or 'user'
    const update = { ...req.body };
    if (update.role && !['admin', 'staff', 'user'].includes(update.role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Track what changed
    const changes = {};
    const oldValues = {};
    for (const key in update) {
      if (originalUser[key] !== update[key]) {
        changes[key] = update[key];
        oldValues[key] = originalUser[key];
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    
    // Log user update
    await auditLogger.logUserChange('UPDATE', user, req.user, changes, oldValues, req);
    
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Specific route for role changes
router.put('/:id/role', authenticateToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'staff', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    // Prevent changing the last admin's role
    if (role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      const targetUser = await User.findById(req.params.id);
      if (adminCount === 1 && targetUser.role === 'admin') {
        return res.status(400).json({ error: 'Cannot change the role of the last admin' });
      }
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
