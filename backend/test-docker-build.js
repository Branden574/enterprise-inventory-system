#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

console.log('🧪 Testing Docker build locally...\n');

const dockerCommand = 'docker build -t test-inventory-app .';

console.log('Running:', dockerCommand);
console.log('This may take a few minutes...\n');

const buildProcess = exec(dockerCommand, { 
  cwd: path.resolve(__dirname, '..'),
  maxBuffer: 1024 * 1024 * 10 // 10MB buffer
});

buildProcess.stdout.on('data', (data) => {
  process.stdout.write(data);
});

buildProcess.stderr.on('data', (data) => {
  process.stderr.write(data);
});

buildProcess.on('close', (code) => {
  console.log(`\n📊 Build process finished with code: ${code}`);
  
  if (code === 0) {
    console.log('✅ Docker build successful!');
    console.log('\n🚀 You can now run the container with:');
    console.log('docker run -p 5000:5000 test-inventory-app');
  } else {
    console.log('❌ Docker build failed!');
    console.log('Check the error messages above for details.');
  }
});

buildProcess.on('error', (error) => {
  console.error('❌ Error running Docker build:', error.message);
});