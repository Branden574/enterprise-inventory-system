const mongoose = require('mongoose');

// Function to check MongoDB connection
async function checkMongoDB() {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI environment variable is not set');
      return false;
    }
    
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Shorter timeout for faster failure detection
    });
    
    console.log('MongoDB connection successful');
    return true;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    return false;
  }
}

// Function to check required environment variables
function checkEnvironmentVariables() {
  const required = ['MONGO_URI', 'JWT_SECRET'];
  const missing = required.filter(var_name => !process.env[var_name]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.join(', '));
    return false;
  }
  
  console.log('All required environment variables are present');
  return true;
}

// Main startup check
async function performStartupChecks() {
  console.log('Performing startup checks...');
  
  // Check environment variables
  if (!checkEnvironmentVariables()) {
    process.exit(1);
  }
  
  // Check MongoDB connection
  if (!(await checkMongoDB())) {
    process.exit(1);
  }
  
  console.log('All startup checks passed!');
  return true;
}

module.exports = {
  performStartupChecks,
  checkMongoDB,
  checkEnvironmentVariables
};