require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find all users
    const users = await User.find({});
    console.log('\n=== Current Users in Database ===\n');
    users.forEach(user => {
      console.log(`Username: ${user.username}`);
      console.log(`Role: ${user.role}`);
      console.log(`Requires Password Change: ${user.requirePasswordChange}`);
      console.log('------------------------');
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

checkUsers();
