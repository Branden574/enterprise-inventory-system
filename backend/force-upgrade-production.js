require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function forceUpgradeTechAdmin() {
  try {
    // Use Railway's MongoDB connection
    const mongoUri = process.env.MONGO_URI;
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to production MongoDB');

    // Find the techadmin user
    const user = await User.findOne({ username: 'techadmin@cvwest.org' });
    
    if (!user) {
      console.log('❌ User techadmin@cvwest.org not found');
      
      // List all users to see what exists
      const allUsers = await User.find({}, 'username role').lean();
      console.log('\n📋 All users in production database:');
      allUsers.forEach(u => {
        console.log(`  - ${u.username} (${u.role})`);
      });
      
      // If user doesn't exist, create it
      console.log('\n🔧 Creating techadmin user...');
      const hashedPassword = await bcrypt.hash('Kj#9mP$vL2nX@5qR8tY3wZ!2025', 12);
      const newUser = new User({
        username: 'techadmin@cvwest.org',
        password: hashedPassword,
        role: 'superadmin'
      });
      await newUser.save();
      console.log('✅ Created techadmin@cvwest.org as superadmin');
      
    } else {
      console.log(`✅ Found user: ${user.username} with role: ${user.role}`);
      
      // Force upgrade to superadmin and reset password
      const hashedPassword = await bcrypt.hash('Kj#9mP$vL2nX@5qR8tY3wZ!2025', 12);
      user.role = 'superadmin';
      user.password = hashedPassword;
      await user.save();
      
      console.log(`🚀 FORCE UPGRADED ${user.username} to superadmin with fresh password!`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

forceUpgradeTechAdmin();
