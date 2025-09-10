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
    
    // Find or create techadmin user
    let user = await User.findOne({ username: 'techadmin@cvwest.org' });
    
    if (user) {
      console.log('✅ Found existing user, upgrading...');
      user.role = 'superadmin';
      user.password = await bcrypt.hash('Kj#9mP$vL2nX@5qR8tY3wZ!2025', 12);
      await user.save();
      console.log('🚀 Upgraded existing user to superadmin');
    } else {
      console.log('🔧 Creating new techadmin user...');
      user = new User({
        username: 'techadmin@cvwest.org',
        password: await bcrypt.hash('Kj#9mP$vL2nX@5qR8tY3wZ!2025', 12),
        role: 'superadmin'
      });
      await user.save();
      console.log('✅ Created new superadmin user');
    }

    res.json({
      success: true,
      message: 'Emergency admin created/upgraded successfully',
      username: user.username,
      role: user.role
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
