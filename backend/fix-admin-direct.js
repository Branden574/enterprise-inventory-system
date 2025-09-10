// This script will connect directly to MongoDB Atlas and fix the techadmin user
// Run this locally to update the production database

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define User schema locally
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: false },
  firstName: { type: String, required: false },
  lastName: { type: String, required: false },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'admin', 'staff', 'user'], default: 'user' },
  requirePasswordChange: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

async function fixTechAdminDirectly() {
  try {
    // Connect to MongoDB Atlas directly
    console.log('🔗 Connecting to MongoDB Atlas...');
    
    // Use the MONGO_URI from .env which should point to Atlas
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://brandenwalker5741:fLB8JI1xr3CXMrnv@cluster0.7iitq.mongodb.net/inventory?retryWrites=true&w=majority';
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas');

    // Delete existing techadmin user
    await User.deleteOne({ username: 'techadmin@cvwest.org' });
    console.log('🗑️ Deleted existing techadmin user');

    // Create new user with proper bcrypt hashing (salt rounds 10)
    const plainPassword = 'Kj#9mP$vL2nX@5qR8tY3wZ!2025';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    console.log('🔐 Password hash created:', hashedPassword.substring(0, 20) + '...');

    const newUser = new User({
      username: 'techadmin@cvwest.org',
      password: hashedPassword, // Pre-hashed
      role: 'superadmin',
      requirePasswordChange: false
    });

    await newUser.save();
    console.log('✅ Created fresh techadmin user');

    // Test password comparison
    const testUser = await User.findOne({ username: 'techadmin@cvwest.org' });
    const passwordTest = await bcrypt.compare(plainPassword, testUser.password);
    
    console.log('🧪 Password test result:', passwordTest);
    console.log('👤 User role:', testUser.role);
    console.log('🆔 User ID:', testUser._id);

    if (passwordTest) {
      console.log('🎉 SUCCESS! techadmin@cvwest.org is ready with working password');
    } else {
      console.log('❌ FAILED! Password comparison failed');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔐 Database connection closed');
  }
}

fixTechAdminDirectly();
