const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const auditLogger = require('../middleware/auditLogger');

// Middleware
const { authenticateToken } = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// Public registration for regular users
router.post('/register', async (req, res) => {
  try {
    console.log('Public register attempt:', { username: req.body.username });
    
    // Check if user already exists
    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser) {
      console.log('Username already exists');
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Validate password
    if (!req.body.password || req.body.password.length < 10) {
      return res.status(400).json({ error: 'Password must be at least 10 characters.' });
    }

    // Public registration only allows 'user' role
    const userData = {
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      role: 'user', // Force user role for public registration
      requirePasswordChange: false // Regular users don't need to change password
    };

    const user = new User(userData);
    await user.save();
    
    // Log user registration
    await auditLogger.logUserChange('CREATE', user, user, {}, {}, req);
    
    console.log('User created successfully');
    res.status(201).json({ 
      message: 'User created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Admin-only registration for staff/admin accounts
router.post('/register-admin', authenticateToken, async (req, res) => {
  try {
    console.log('Register attempt:', { username: req.body.username, role: req.body.role });
    
    // Check if user already exists
    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser) {
      console.log('Username already exists');
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Validate password
    if (!req.body.password || req.body.password.length < 10) {
      return res.status(400).json({ error: 'Password must be at least 10 characters.' });
    }

    let role = 'user';
    
    // Handle admin account creation
    if (req.body.role === 'admin') {
      console.log('Attempting to create admin account');
      console.log('User from auth middleware:', req.user);
      
      // Only superadmin can create admin accounts
      if (req.user.role !== 'superadmin') {
        console.log('Unauthorized - user role:', req.user.role);
        return res.status(403).json({ error: 'Only superadmins can create admin accounts.' });
      }
      
      console.log('Authorized - creating admin account');
      role = 'admin';
    } else if (req.body.role === 'staff') {
      role = 'staff';
    } else if (req.body.role === 'superadmin') {
      // Only existing superadmin can create another superadmin
      if (req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Only superadmins can create superadmin accounts.' });
      }
      role = 'superadmin';
    }

    // Set requirePasswordChange only for admin and superadmin roles
    const requirePasswordChange = (role === 'admin' || role === 'superadmin');

    const userData = {
      ...req.body,
      role,
      requirePasswordChange
    };

    const user = new User(userData);
    await user.save();
    
    // Log admin user creation
    await auditLogger.logUserChange('CREATE', user, req.user, {}, {}, req);
    
    res.status(201).json({ 
      message: 'User registered',
      requirePasswordChange: user.requirePasswordChange
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt for username:', req.body.username);
    const user = await User.findOne({ username: req.body.username });
    if (!user) {
      console.log('User not found');
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    console.log('User found in database:', {
      username: user.username,
      requirePasswordChange: user.requirePasswordChange,
      role: user.role
    });
    const isMatch = await user.comparePassword(req.body.password);
    if (!isMatch) {
      console.log('Password does not match');
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    console.log('Password matched');
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    // Log successful login
    await auditLogger.logSystemAction('LOGIN', user, `User logged in successfully`, req);
    
    const response = {
      token,
      role: user.role,
      requirePasswordChange: user.requirePasswordChange
    };
    console.log('Sending response:', response);
    res.json(response);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Change Password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Find user
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });

    // Validate new password
    if (newPassword.length < 16) {
      return res.status(400).json({ error: 'Password must be at least 16 characters long' });
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      return res.status(400).json({ error: 'Password must contain at least one special character' });
    }

    // Update password
    user.password = newPassword;
    user.requirePasswordChange = false;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Emergency superadmin upgrade (temporary endpoint)
router.post('/upgrade-superadmin', authenticateToken, async (req, res) => {
  try {
    console.log('Superadmin upgrade attempt by user:', req.user.id);
    
    // Find the current user
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Current user details:', {
      username: currentUser.username,
      role: currentUser.role,
      id: currentUser._id.toString()
    });

    // Only allow the specific superadmin account to upgrade
    if (currentUser.username === 'superadmin@cvwest.org') {
      const oldRole = currentUser.role;
      currentUser.role = 'superadmin';
      await currentUser.save();
      
      console.log('✅ Successfully upgraded role from', oldRole, 'to superadmin');
      
      // Log the upgrade
      await auditLogger.logUserChange('UPDATE', currentUser, currentUser, 
        { role: 'superadmin' }, { role: oldRole }, req);
      
      res.json({
        success: true,
        message: 'Successfully upgraded to superadmin',
        user: {
          id: currentUser._id,
          username: currentUser.username,
          role: currentUser.role,
          previousRole: oldRole
        }
      });
    } else {
      res.status(403).json({ 
        error: 'This upgrade is only available for the designated superadmin account',
        currentUser: currentUser.username
      });
    }

  } catch (error) {
    console.error('Superadmin upgrade error:', error);
    res.status(500).json({ error: 'Upgrade failed', details: error.message });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TEMPORARY: Password reset for test user
router.post('/reset-test-user', async (req, res) => {
  try {
    console.log('Password reset request for test user');
    
    // Find the test user
    const user = await User.findOne({ username: 'branden615' });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('Found user:', { username: user.username, role: user.role });
    
    // Set a known password
    const newPassword = 'test123456789!';
    
    // Update the password using the model's save method to trigger hashing
    user.password = newPassword;
    await user.save();
    
    console.log('Password reset successfully');
    
    // Test the new password immediately
    const testMatch = await user.comparePassword(newPassword);
    
    res.json({ 
      success: true, 
      message: 'Password reset to: test123456789!',
      testResult: testMatch ? 'Password test PASSED' : 'Password test FAILED'
    });
    
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
