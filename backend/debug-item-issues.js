const mongoose = require('mongoose');
const cloudinary = require('./config/cloudinary');
require('dotenv').config();

// Simple debug script to check item data and Cloudinary
async function debugItemIssues() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('📚 Checking item with title "1984"...');
    const Item = require('./models/Item');
    
    // Find the 1984 book
    const book = await Item.findOne({ 
      $or: [
        { title: { $regex: '1984', $options: 'i' } },
        { name: { $regex: '1984', $options: 'i' } }
      ]
    });
    
    if (book) {
      console.log('📖 Found book data:');
      console.log('   Title:', book.title || book.name);
      console.log('   ISBN-13:', book.isbn13);
      console.log('   ISBN-10:', book.isbn10);
      console.log('   Data type of isbn13:', typeof book.isbn13);
      console.log('   Length of isbn13:', book.isbn13?.length);
    } else {
      console.log('❌ Book "1984" not found');
    }
    
    // Test Cloudinary connection
    console.log('\n☁️ Testing Cloudinary configuration...');
    console.log('   Cloud name:', cloudinary.config().cloud_name);
    console.log('   API key exists:', !!cloudinary.config().api_key);
    console.log('   API secret exists:', !!cloudinary.config().api_secret);
    
    // Test a simple Cloudinary operation
    try {
      const ping = await cloudinary.api.ping();
      console.log('✅ Cloudinary connection successful:', ping);
    } catch (cloudinaryError) {
      console.log('❌ Cloudinary connection failed:', cloudinaryError.message);
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔒 Disconnected from MongoDB');
  }
}

debugItemIssues();
