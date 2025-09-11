// Simple test to debug image upload issues
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testImageUpload() {
  try {
    console.log('🧪 Testing image upload to production API...');
    
    // Get auth token first
    console.log('🔑 Getting auth token...');
    const loginResponse = await axios.post('https://enterprise-inventory-system-production.up.railway.app/api/auth/login', {
      username: 'techadmin',
      password: 'TechAdmin2024!'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Got auth token');
    
    // Try to get an item first
    console.log('📦 Getting item details...');
    const itemResponse = await axios.get('https://enterprise-inventory-system-production.up.railway.app/api/items/66c3d2a17c7d3dc40b3b01', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('📖 Item details:', {
      name: itemResponse.data.name,
      title: itemResponse.data.title,
      isbn13: itemResponse.data.isbn13,
      hasPhoto: !!itemResponse.data.photo
    });
    
    // Test update without image first
    console.log('🔄 Testing update without image...');
    const updateResponse = await axios.put(
      `https://enterprise-inventory-system-production.up.railway.app/api/items/66c3d2a17c7d3dc40b3b01`,
      {
        name: itemResponse.data.name,
        isbn13: itemResponse.data.isbn13,
        quantity: itemResponse.data.quantity
      },
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Update without image successful');
    
  } catch (error) {
    console.error('❌ Test failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
  }
}

testImageUpload();
