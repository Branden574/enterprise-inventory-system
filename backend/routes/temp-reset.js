const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Temporary password reset endpoint
const router = express.Router();

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
    
    // Hash it manually to be sure
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the user directly
    await User.findByIdAndUpdate(user._id, { 
      password: hashedPassword 
    });
    
    console.log('Password reset successfully');
    
    // Test the new password immediately
    const updatedUser = await User.findById(user._id);
    const testMatch = await bcrypt.compare(newPassword, updatedUser.password);
    
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
