const mongoose = require('mongoose');
const User = require('../models/User');
const readline = require('readline');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function createAdminUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('\n=== Create Admin Account ===\n');
    
    const username = await promptUser('Enter username: ');
    const password = await promptUser('Enter password: ');
    
    // Validate password
    if (password.length < 10) {
      console.error('Error: Password must be at least 10 characters long');
      return;
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.error('Error: Username already exists');
      return;
    }

    // Create new admin user
    const adminUser = new User({
      username,
      password, // Will be hashed automatically by the User model
      role: 'admin',
      requirePasswordChange: true // Explicitly set this to ensure password change is required
    });

    await adminUser.save();
    console.log('\nAdmin user created successfully!');
    console.log(`Username: ${username}`);
    console.log('Make sure to save these credentials securely!\n');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    rl.close();
    await mongoose.connection.close();
  }
}

// Run the script
createAdminUser();
