require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function createSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const username = 'techadmin@cvwest.org';  // Fixed domain
    const password = 'Kj#9mP$vL2nX@5qR8tY3wZ!2025';

    // Remove any existing superadmin
    await User.deleteOne({ role: 'superadmin' });

    // Create new superadmin user
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
    console.log('\nMake sure to save these credentials securely!');
    console.log('You will be required to change the password on first login.\n');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

createSuperAdmin();
