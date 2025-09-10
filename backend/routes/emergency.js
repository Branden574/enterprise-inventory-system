const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// Emergency superadmin upgrade endpoint (only for existing superadmin users)
router.post('/emergency-upgrade', authenticateToken, async (req, res) => {
  try {
    console.log('Emergency upgrade attempt by user:', req.user.id);
    
    // Find the current user
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Current user:', {
      username: currentUser.username,
      role: currentUser.role,
      id: currentUser._id
    });

    // Check if this is the superadmin account we want to upgrade
    if (currentUser.username === 'superadmin@cvwest.org') {
      currentUser.role = 'superadmin';
      await currentUser.save();
      
      console.log('✅ Successfully upgraded to superadmin');
      
      res.json({
        success: true,
        message: 'Successfully upgraded to superadmin',
        user: {
          id: currentUser._id,
          username: currentUser.username,
          role: currentUser.role
        }
      });
    } else {
      res.status(403).json({ 
        error: 'This endpoint is only for the designated superadmin account',
        currentUser: currentUser.username
      });
    }

  } catch (error) {
    console.error('Emergency upgrade error:', error);
    res.status(500).json({ error: 'Upgrade failed', details: error.message });
  }
});

// Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
