const mongoose = require('mongoose');
require('dotenv').config();

// Check ISBN data without connecting to remote database
async function checkISBNIssue() {
  console.log('📊 ISBN-13 Issue Analysis');
  console.log('=========================');
  
  console.log('🔍 Based on your screenshot, the form shows "1" in the ISBN-13 field.');
  console.log('');
  console.log('📋 Possible Causes:');
  console.log('   1. Data was truncated during Excel import');
  console.log('   2. Field validation is limiting input to numbers only');
  console.log('   3. Frontend form is not loading the full ISBN value');
  console.log('   4. Database field might have a maxLength restriction');
  console.log('');
  console.log('🔧 Recommended Solutions:');
  console.log('   1. After fixing environment variables, re-import the Excel file');
  console.log('   2. Check if manual entry of full ISBN-13 works (13-digit number)');
  console.log('   3. If problem persists, we may need to check database directly');
  console.log('');
  console.log('💡 Test Steps:');
  console.log('   1. Add environment variables to Railway');
  console.log('   2. Wait for deployment (5-10 minutes)');
  console.log('   3. Try uploading an image first');
  console.log('   4. Test ISBN-13 by manually typing a 13-digit number');
  console.log('   5. If manual entry works, re-import your Excel file');
}

checkISBNIssue();
