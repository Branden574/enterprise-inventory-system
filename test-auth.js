const axios = require('axios');

async function testAuth() {
  try {
    // First, let's try to login
    console.log('Testing login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('Login successful:', loginResponse.data.user);
    const token = loginResponse.data.token;
    
    // Test the pending orders endpoint
    console.log('\nTesting pending orders endpoint...');
    const ordersResponse = await axios.get('http://localhost:5000/api/internal-orders/pending', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Pending orders:', ordersResponse.data);
    
    // Test all orders endpoint
    console.log('\nTesting all orders endpoint...');
    const allOrdersResponse = await axios.get('http://localhost:5000/api/internal-orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('All orders:', allOrdersResponse.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAuth();
