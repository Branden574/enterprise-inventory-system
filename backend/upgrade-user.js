require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function upgradeUserToSuperAdmin() {
  try {
    // Use Railway's MongoDB connection
    await mongoose.connect('mongodb+srv://branden574_db_user:gvS4fGLgnDc12C4fginventory-cluster.bqj3anl.mongodb.net/inventory');
    
    const userId = '68c1c4352270c19819f8abf8';
    
    // Update user role to superadmin
    const result = await User.findByIdAndUpdate(
      userId,
      { role: 'superadmin' },
      { new: true }
    );
    
    if (result) {
      console.log('✅ User upgraded to superadmin successfully!');
      console.log(`Username: ${result.username}`);
      console.log(`Role: ${result.role}`);
    } else {
      console.log('❌ User not found');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

upgradeUserToSuperAdmin();
