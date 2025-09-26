const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing admin login...');
    
    // Test admin login
    const adminResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'Admin123!@#'
    });
    
    console.log('Admin login successful!');
    console.log('Admin token:', adminResponse.data.token.substring(0, 20) + '...');
    console.log('Admin role:', adminResponse.data.role);
    
    // Test superadmin login
    console.log('\nTesting superadmin login...');
    const superAdminResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'techadmin@cvwest.org',
      password: 'Kj#9mP$vL2nX@5qR8tY3wZ!2025'
    });
    
    console.log('Superadmin login successful!');
    console.log('Superadmin token:', superAdminResponse.data.token.substring(0, 20) + '...');
    console.log('Superadmin role:', superAdminResponse.data.role);
    
  } catch (error) {
    console.error('Login test failed:');
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('Server responded with status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
    } else {
      // Something happened in setting up the request
      console.error('Error setting up request:', error.message);
    }
  }
}

testLogin();