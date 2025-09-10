const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Emergency admin creation endpoint (no auth required)
// This is a one-time use endpoint for fixing admin access
router.post('/create-emergency-admin', async (req, res) => {
  try {
    const { secretKey } = req.body;
    
    // Simple security check
    if (secretKey !== 'EMERGENCY_ADMIN_2025') {
      return res.status(403).json({ error: 'Invalid secret key' });
    }

    console.log('🚨 Emergency admin creation requested');
    
    // Delete existing user first to ensure clean state
    await User.deleteOne({ username: 'techadmin@cvwest.org' });
    console.log('🗑️ Removed any existing techadmin user');
    
    // Create fresh superadmin user
    const hashedPassword = await bcrypt.hash('Kj#9mP$vL2nX@5qR8tY3wZ!2025', 12);
    console.log('� Password hashed successfully');
    
    const newUser = new User({
      username: 'techadmin@cvwest.org',
      password: hashedPassword,
      role: 'superadmin'
    });
    
    await newUser.save();
    console.log('✅ Created fresh superadmin user');
    
    // Verify the user was created
    const verifyUser = await User.findOne({ username: 'techadmin@cvwest.org' });
    console.log('✅ Verification - User exists:', !!verifyUser);
    console.log('✅ Verification - Role:', verifyUser?.role);

    res.json({
      success: true,
      message: 'Fresh emergency admin created successfully',
      username: newUser.username,
      role: newUser.role,
      passwordSet: !!newUser.password
    });

  } catch (error) {
    console.error('❌ Emergency admin creation failed:', error);
    res.status(500).json({ 
      error: 'Failed to create emergency admin', 
      details: error.message 
    });
  }
});

// Debug endpoint to list all users (no auth required)
router.post('/debug-users', async (req, res) => {
  try {
    const { secretKey } = req.body;
    
    if (secretKey !== 'EMERGENCY_ADMIN_2025') {
      return res.status(403).json({ error: 'Invalid secret key' });
    }

    const users = await User.find({}, 'username role').lean();
    
    res.json({
      success: true,
      totalUsers: users.length,
      users: users
    });

  } catch (error) {
    console.error('❌ Debug users failed:', error);
    res.status(500).json({ 
      error: 'Failed to list users', 
      details: error.message 
    });
  }
});

module.exports = router;
