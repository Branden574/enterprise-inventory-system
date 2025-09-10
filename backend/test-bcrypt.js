// Simple password reset script for testing
const bcrypt = require('bcryptjs');

async function testPasswordHashing() {
  console.log('Testing password hashing...');
  
  const testPassword = 'test123456789!';
  
  // Test basic bcrypt functionality
  console.log('1. Testing basic bcrypt...');
  const hash1 = await bcrypt.hash(testPassword, 10);
  console.log('Hash created:', hash1);
  
  const match1 = await bcrypt.compare(testPassword, hash1);
  console.log('Comparison result:', match1);
  
  // Test with different salt rounds
  console.log('\n2. Testing different salt rounds...');
  const hash2 = await bcrypt.hash(testPassword, 12);
  const match2 = await bcrypt.compare(testPassword, hash2);
  console.log('Salt 12 - Match:', match2);
  
  // Test what might be happening in the User model
  console.log('\n3. Simulating User model behavior...');
  let password = testPassword;
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('Simulated hash:', hashedPassword);
  
  const compareResult = await bcrypt.compare(testPassword, hashedPassword);
  console.log('Simulated compare:', compareResult);
}

testPasswordHashing().catch(console.error);
