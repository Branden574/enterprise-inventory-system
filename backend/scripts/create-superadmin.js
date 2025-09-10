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

async function createSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('\n=== Create SuperAdmin Account ===\n');
    console.log('WARNING: This should only be used once to create the initial superadmin account.\n');
    
    const username = await promptUser('Enter superadmin username: ');
    const password = await promptUser('Enter superadmin password: ');
    
    // Validate password
    if (password.length < 16) {
      console.error('Error: Password must be at least 16 characters long');
      return;
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.error('Error: Username already exists');
      return;
    }

    // Create superadmin user
    const superAdmin = new User({
      username,
      password,
      role: 'superadmin',
      requirePasswordChange: true
    });

    await superAdmin.save();
    console.log('\nSuperAdmin account created successfully!');
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
createSuperAdmin();
