const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Meteor Mastery Functionality Tests...\n');

// Function to run tests
function runTests() {
  const testCommand = 'npx';
  const testArgs = [
    'jest',
    '__tests__/puppeteer/',
    '--testTimeout=60000',
    '--verbose',
    '--detectOpenHandles',
    '--forceExit'
  ];

  const testProcess = spawn(testCommand, testArgs, {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  });

  testProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ All tests completed successfully!');
      console.log('\n📊 Test Summary:');
      console.log('- Page functionality tests completed');
      console.log('- Simulation functionality tests completed');
      console.log('- Navigation tests completed');
      console.log('- Responsive design tests completed');
      console.log('- Performance tests completed');
      console.log('- Accessibility tests completed');
    } else {
      console.log(`\n❌ Tests failed with exit code ${code}`);
      console.log('\n🔍 Check the output above for detailed error information');
    }
    process.exit(code);
  });

  testProcess.on('error', (error) => {
    console.error('❌ Failed to start test process:', error);
    process.exit(1);
  });
}

// Check if the app is running
console.log('🔍 Checking if the application is running on http://localhost:3000...');

const http = require('http');
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log('✅ Application is running! Starting tests...\n');
  runTests();
});

req.on('error', (error) => {
  console.log('❌ Application is not running on http://localhost:3000');
  console.log('📝 Please start the application first with: npm start');
  console.log('⏳ Then run this test script again\n');
  process.exit(1);
});

req.on('timeout', () => {
  console.log('⏰ Timeout: Application is not responding on http://localhost:3000');
  console.log('📝 Please start the application first with: npm start');
  process.exit(1);
});

req.end();