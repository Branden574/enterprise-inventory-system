require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function upgradeSuperAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the user
    const user = await User.findOne({ username: 'superadmin@cvwest.org' });
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('Found user:', {
      id: user._id,
      username: user.username,
      currentRole: user.role,
      email: user.email
    });

    // Update role to superadmin
    user.role = 'superadmin';
    await user.save();

    console.log('✅ User role updated to superadmin successfully!');
    
    // Verify the update
    const updatedUser = await User.findById(user._id);
    console.log('Verification - Updated user role:', updatedUser.role);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

console.log('🚀 Starting superadmin upgrade...');
upgradeSuperAdmin();
