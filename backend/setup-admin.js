const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createAdminUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully!');

    console.log('\n=== Creating Admin Account ===\n');
    
    // Create admin user with the exact credentials from the screenshot
    const adminUser = new User({
      username: 'admin',
      password: 'Admin123!@#',
      role: 'admin',
      requirePasswordChange: false
    });

    await adminUser.save();
    console.log('\nAdmin account created successfully!');
    console.log('Username: admin');
    console.log('Password: Admin123!@#');
    
    // Create superadmin user with the exact credentials from the screenshot
    const superAdminUser = new User({
      username: 'techadmin@cvwest.org',
      password: 'Kj#9mP$vL2nX@5qR8tY3wZ!2025',
      email: 'techadmin@cvwest.org',
      role: 'superadmin',
      requirePasswordChange: false
    });

    await superAdminUser.save();
    console.log('\nSuperAdmin account created successfully!');
    console.log('Username: techadmin@cvwest.org');
    console.log('Password: Kj#9mP$vL2nX@5qR8tY3wZ!2025');

    console.log('\nLogin credentials have been set up! You can now log in with either account.');

  } catch (error) {
    console.error('Error:', error.message);
    
    if (error.code === 11000) {
      console.log('\nUser already exists in the database.');
      console.log('If you want to reset the password, try running the reset-password script instead.');
    }
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
}

// Run the script
createAdminUser();