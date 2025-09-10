const mongoose = require('mongoose');
const User = require('./models/User');

async function upgradeToSuperAdmin() {
  try {
    // Connect using a simplified connection string
    await mongoose.connect('mongodb+srv://branden574_db_user:gvS4fGLgnDc12C4fginventory-cluster.bqj3anl.mongodb.net/', {
      dbName: 'inventory'
    });
    
    console.log('Connected to MongoDB');
    
    // Find and update the user
    const result = await User.findByIdAndUpdate(
      '68c1c4352270c19819f8abf8',
      { role: 'superadmin' },
      { new: true }
    );
    
    if (result) {
      console.log('✅ SUCCESS: User upgraded to superadmin!');
      console.log(`Username: ${result.username}`);
      console.log(`Role: ${result.role}`);
    } else {
      console.log('❌ User not found with that ID');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

upgradeToSuperAdmin();
