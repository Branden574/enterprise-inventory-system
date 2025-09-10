const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Remove any existing admin users
    await User.deleteMany({ role: 'admin' });
    
    // Create new admin user
    const adminUser = new User({
      username: 'admin',
      password: 'Admin123!@#', // This will be hashed by the pre-save middleware
      role: 'admin'
    });

    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: Admin123!@#');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

createAdmin();
