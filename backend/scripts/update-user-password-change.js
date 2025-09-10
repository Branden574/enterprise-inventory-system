const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function updateUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const username = 'arosas@cvwest.org';
    
    // Update the user
    const result = await User.updateOne(
      { username },
      { $set: { requirePasswordChange: true } }
    );

    if (result.modifiedCount > 0) {
      console.log('User updated successfully!');
    } else {
      console.log('No user was updated. User might not exist.');
    }

    // Verify the update
    const user = await User.findOne({ username });
    console.log('Current user state:', {
      username: user.username,
      requirePasswordChange: user.requirePasswordChange,
      role: user.role
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

updateUser();
