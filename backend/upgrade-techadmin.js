require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function upgradeTechAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find and upgrade techadmin user
    const user = await User.findOne({ username: 'techadmin@cvwest.org' });
    
    if (!user) {
      console.log('❌ User techadmin@cvwest.org not found');
      
      // List all users to see what exists
      const allUsers = await User.find({}, 'username role').lean();
      console.log('\n📋 All users in database:');
      allUsers.forEach(u => {
        console.log(`  - ${u.username} (${u.role})`);
      });
    } else {
      console.log(`✅ Found user: ${user.username} with role: ${user.role}`);
      
      // Upgrade to superadmin
      user.role = 'superadmin';
      await user.save();
      
      console.log(`🚀 Successfully upgraded ${user.username} to superadmin!`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

upgradeTechAdmin();
