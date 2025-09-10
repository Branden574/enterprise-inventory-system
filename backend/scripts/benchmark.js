const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Benchmark configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';
const CONCURRENT_USERS = process.env.CONCURRENT_USERS || 50;
const REQUESTS_PER_USER = process.env.REQUESTS_PER_USER || 20;
const TEST_DURATION = process.env.TEST_DURATION || 60; // seconds

console.log('🚀 Starting Enterprise API Performance Benchmark');
console.log(`📊 Configuration:`);
console.log(`   - API Base URL: ${API_BASE_URL}`);
console.log(`   - Concurrent Users: ${CONCURRENT_USERS}`);
console.log(`   - Requests per User: ${REQUESTS_PER_USER}`);
console.log(`   - Test Duration: ${TEST_DURATION}s`);

// Test scenarios
const testScenarios = [
  {
    name: 'Get Items List',
    method: 'GET',
    url: '/api/items',
    weight: 0.4 // 40% of requests
  },
  {
    name: 'Search Items',
    method: 'GET',
    url: '/api/items?search=test&page=1&limit=20',
    weight: 0.3 // 30% of requests
  },
  {
    name: 'Get Categories',
    method: 'GET',
    url: '/api/categories',
    weight: 0.2 // 20% of requests
  },
  {
    name: 'Get Item by ID',
    method: 'GET',
    url: '/api/items/507f1f77bcf86cd799439011', // Example ID
    weight: 0.1 // 10% of requests
  }
];

// Performance metrics
let results = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  averageResponseTime: 0,
  minResponseTime: Infinity,
  maxResponseTime: 0,
  responseTimes: [],
  errorsPerSecond: 0,
  requestsPerSecond: 0,
  scenarios: {}
};

// Initialize scenario results
testScenarios.forEach(scenario => {
  results.scenarios[scenario.name] = {
    requests: 0,
    successful: 0,
    failed: 0,
    avgResponseTime: 0,
    responseTimes: []
  };
});

// Simulate a single user session
async function simulateUser(userId) {
  const userResults = {
    requests: 0,
    successful: 0,
    failed: 0,
    responseTimes: []
  };

  const startTime = Date.now();
  
  while (Date.now() - startTime < TEST_DURATION * 1000) {
    try {
      // Select random scenario based on weight
      const scenario = selectWeightedScenario();
      const requestStart = Date.now();
      
      const response = await axios({
        method: scenario.method,
        url: `${API_BASE_URL}${scenario.url}`,
        timeout: 10000, // 10 second timeout
        validateStatus: () => true // Don't throw on HTTP errors
      });
      
      const responseTime = Date.now() - requestStart;
      
      userResults.requests++;
      userResults.responseTimes.push(responseTime);
      
      // Update global results
      results.totalRequests++;
      results.responseTimes.push(responseTime);
      results.scenarios[scenario.name].requests++;
      results.scenarios[scenario.name].responseTimes.push(responseTime);
      
      if (response.status >= 200 && response.status < 400) {
        userResults.successful++;
        results.successfulRequests++;
        results.scenarios[scenario.name].successful++;
      } else {
        userResults.failed++;
        results.failedRequests++;
        results.scenarios[scenario.name].failed++;
        console.log(`❌ User ${userId}: ${scenario.name} failed with status ${response.status}`);
      }
      
      // Update response time metrics
      results.minResponseTime = Math.min(results.minResponseTime, responseTime);
      results.maxResponseTime = Math.max(results.maxResponseTime, responseTime);
      
      // Small delay between requests (realistic user behavior)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
      
    } catch (error) {
      userResults.failed++;
      results.failedRequests++;
      results.totalRequests++;
      console.log(`🔥 User ${userId}: Request failed - ${error.message}`);
    }
  }
  
  console.log(`✅ User ${userId} completed: ${userResults.successful}/${userResults.requests} successful requests`);
  return userResults;
}

// Select scenario based on weighted probability
function selectWeightedScenario() {
  const random = Math.random();
  let cumulative = 0;
  
  for (const scenario of testScenarios) {
    cumulative += scenario.weight;
    if (random <= cumulative) {
      return scenario;
    }
  }
  
  return testScenarios[testScenarios.length - 1];
}

// Calculate final statistics
function calculateFinalStats(testDuration) {
  // Calculate averages
  if (results.responseTimes.length > 0) {
    results.averageResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
  }
  
  // Calculate percentiles
  const sortedTimes = results.responseTimes.sort((a, b) => a - b);
  const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)] || 0;
  const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
  const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;
  
  // Calculate rates
  results.requestsPerSecond = results.totalRequests / testDuration;
  results.errorsPerSecond = results.failedRequests / testDuration;
  
  // Calculate scenario averages
  Object.keys(results.scenarios).forEach(scenarioName => {
    const scenario = results.scenarios[scenarioName];
    if (scenario.responseTimes.length > 0) {
      scenario.avgResponseTime = scenario.responseTimes.reduce((a, b) => a + b, 0) / scenario.responseTimes.length;
    }
  });
  
  return { p50, p95, p99 };
}

// Generate performance report
function generateReport(percentiles, testDuration) {
  const report = `
🎯 Enterprise API Performance Benchmark Report
===============================================

📊 Overall Performance:
   Total Requests: ${results.totalRequests}
   Successful: ${results.successfulRequests} (${((results.successfulRequests / results.totalRequests) * 100).toFixed(2)}%)
   Failed: ${results.failedRequests} (${((results.failedRequests / results.totalRequests) * 100).toFixed(2)}%)
   
🚀 Throughput:
   Requests/Second: ${results.requestsPerSecond.toFixed(2)}
   Errors/Second: ${results.errorsPerSecond.toFixed(2)}
   
⏱️  Response Times:
   Average: ${results.averageResponseTime.toFixed(2)}ms
   Minimum: ${results.minResponseTime}ms
   Maximum: ${results.maxResponseTime}ms
   50th Percentile: ${percentiles.p50}ms
   95th Percentile: ${percentiles.p95}ms
   99th Percentile: ${percentiles.p99}ms

📋 Scenario Performance:
${Object.entries(results.scenarios).map(([name, data]) => 
  `   ${name}: ${data.successful}/${data.requests} (${data.avgResponseTime.toFixed(2)}ms avg)`
).join('\n')}

🏆 Enterprise Readiness Assessment:
   ${results.requestsPerSecond >= 100 ? '✅' : '❌'} Throughput: ${results.requestsPerSecond >= 100 ? 'EXCELLENT' : 'NEEDS IMPROVEMENT'} (${results.requestsPerSecond.toFixed(2)} req/s)
   ${percentiles.p95 <= 500 ? '✅' : '❌'} Response Time: ${percentiles.p95 <= 500 ? 'EXCELLENT' : 'NEEDS IMPROVEMENT'} (${percentiles.p95}ms 95th percentile)
   ${(results.successfulRequests / results.totalRequests) >= 0.99 ? '✅' : '❌'} Reliability: ${(results.successfulRequests / results.totalRequests) >= 0.99 ? 'EXCELLENT' : 'NEEDS IMPROVEMENT'} (${((results.successfulRequests / results.totalRequests) * 100).toFixed(2)}% success rate)

💡 Recommendations:
   ${results.requestsPerSecond < 100 ? '• Consider enabling clustering for better throughput\n' : ''}
   ${percentiles.p95 > 500 ? '• Add response caching to improve response times\n' : ''}
   ${(results.failedRequests / results.totalRequests) > 0.01 ? '• Investigate error sources and add better error handling\n' : ''}
   ${results.requestsPerSecond >= 1000 ? '• System can handle enterprise load (1000+ req/s capable)\n' : ''}
`;

  console.log(report);
  
  // Save report to file
  const reportPath = path.join(__dirname, '../benchmark-report.txt');
  fs.writeFileSync(reportPath, report);
  console.log(`📁 Report saved to: ${reportPath}`);
}

// Main benchmark function
async function runBenchmark() {
  console.log('\n🔥 Starting performance test...\n');
  
  const startTime = Date.now();
  
  // Create array of user simulation promises
  const userPromises = [];
  for (let i = 1; i <= CONCURRENT_USERS; i++) {
    userPromises.push(simulateUser(i));
  }
  
  // Wait for all users to complete
  await Promise.all(userPromises);
  
  const testDuration = (Date.now() - startTime) / 1000;
  
  console.log('\n📊 Calculating final statistics...\n');
  
  const percentiles = calculateFinalStats(testDuration);
  generateReport(percentiles, testDuration);
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⏹️  Benchmark interrupted');
  process.exit(0);
});

// Check if API is available before starting
async function checkApiAvailability() {
  try {
    await axios.get(`${API_BASE_URL}/`);
    console.log('✅ API is available, starting benchmark...\n');
    return true;
  } catch (error) {
    console.log('❌ API is not available. Please start the server first.');
    console.log(`   Try: npm start or npm run start:cluster`);
    return false;
  }
}

// Run the benchmark
(async () => {
  const isAvailable = await checkApiAvailability();
  if (isAvailable) {
    await runBenchmark();
  }
})().catch(console.error);

module.exports = { runBenchmark, testScenarios };
