require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function resetTechAdminPassword() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find techadmin user
    const user = await User.findOne({ username: 'techadmin@cvwest.org' });
    
    if (!user) {
      console.log('❌ User techadmin@cvwest.org not found');
      return;
    }

    console.log(`✅ Found user: ${user.username} with role: ${user.role}`);
    
    // Update password
    const newPassword = 'Kj#9mP$vL2nX@5qR8tY3wZ!2025';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    user.password = hashedPassword;
    user.role = 'superadmin'; // Ensure superadmin role
    await user.save();
    
    console.log(`🚀 Successfully updated password and confirmed superadmin role for ${user.username}!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

resetTechAdminPassword();
