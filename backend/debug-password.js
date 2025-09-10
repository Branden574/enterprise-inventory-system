const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function debugPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the user
    const user = await User.findOne({ username: 'branden615' });
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User found:', {
      username: user.username,
      hashedPassword: user.password,
      role: user.role
    });

    // Test different passwords
    const testPasswords = [
      'yourTestPassword123!', // Replace with what you actually used
      'password123',
      'test123456789!',
      'branden615123!'
    ];

    for (const testPassword of testPasswords) {
      const isMatch = await user.comparePassword(testPassword);
      console.log(`Password "${testPassword}": ${isMatch ? 'MATCH' : 'NO MATCH'}`);
      
      // Also test direct bcrypt comparison
      const directMatch = await bcrypt.compare(testPassword, user.password);
      console.log(`Direct bcrypt test "${testPassword}": ${directMatch ? 'MATCH' : 'NO MATCH'}`);
    }

    // Test creating a new hash and comparing
    console.log('\n--- Testing fresh hash ---');
    const testPassword = 'test123456789!';
    const freshHash = await bcrypt.hash(testPassword, 10);
    const freshMatch = await bcrypt.compare(testPassword, freshHash);
    console.log(`Fresh hash test: ${freshMatch ? 'WORKING' : 'BROKEN'}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugPassword();
