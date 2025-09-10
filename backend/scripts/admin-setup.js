require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function setupAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get admin credentials
    const username = await new Promise(resolve => {
      rl.question('Enter admin username: ', resolve);
    });

    const password = await new Promise(resolve => {
      rl.question('Enter admin password: ', resolve);
    });

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log('User already exists. Updating to admin role...');
      existingUser.role = 'admin';
      await existingUser.save();
      console.log('User updated to admin successfully!');
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash(password, 10);
      const adminUser = new User({
        username,
        password: hashedPassword,
        role: 'admin'
      });

      await adminUser.save();
      console.log('Admin user created successfully!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    rl.close();
    await mongoose.connection.close();
    process.exit(0);
  }
}

setupAdmin();
