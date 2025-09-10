const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Emergency admin creation endpoint (no auth required)
router.post('/create-emergency-admin', async (req, res) => {
  try {
    const { secretKey } = req.body;
    
    if (secretKey !== 'EMERGENCY_ADMIN_2025') {
      return res.status(403).json({ error: 'Invalid secret key' });
    }

    console.log('🚨 Emergency admin creation requested');
    
    // Delete existing user and create fresh
    await User.deleteOne({ username: 'techadmin@cvwest.org' });
    console.log('🗑️ Removed existing user');
    
    // Create with bcrypt rounds matching User model (10)
    const hashedPassword = await bcrypt.hash('Kj#9mP$vL2nX@5qR8tY3wZ!2025', 10);
    
    const newUser = new User({
      username: 'techadmin@cvwest.org',
      password: hashedPassword,
      role: 'superadmin'
    });
    
    await newUser.save();
    console.log('✅ Created fresh superadmin user');

    res.json({
      success: true,
      message: 'Emergency admin created successfully',
      username: newUser.username,
      role: newUser.role
    });

  } catch (error) {
    console.error('❌ Emergency admin creation failed:', error);
    res.status(500).json({ 
      error: 'Failed to create emergency admin', 
      details: error.message 
    });
  }
});

module.exports = router;
