require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function createSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const username = 'superadmin';
    const password = 'Changemetoday1234!';

    // Check if superadmin already exists
    const existingUser = await User.findOne({ role: 'superadmin' });
    if (existingUser) {
      console.log('A superadmin account already exists.');
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
    console.log(`Password: ${password}`);
    console.log('Make sure to change this password on first login!\n');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

createSuperAdmin();
