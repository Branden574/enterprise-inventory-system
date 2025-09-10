/**
 * High-Throughput Stress Test
 * Tests maximum requests per second without think time
 */

const axios = require('axios');

class ThroughputTest {
  constructor() {
    this.baseURL = 'http://localhost:5000';
    this.concurrentUsers = 50; // Increased concurrent users
    this.testDuration = 30000; // 30 seconds
    this.maxRequestsPerUser = 1000; // High request limit
    this.results = {
      totalRequests: 0,
      successful: 0,
      failed: 0,
      responseTimes: [],
      startTime: null,
      endTime: null,
      errors: []
    };
  }

  async runUser(userId) {
    const requests = [];
    const startTime = Date.now();
    const endTime = startTime + this.testDuration;
    
    while (Date.now() < endTime && requests.length < this.maxRequestsPerUser) {
      try {
        const requestStart = Date.now();
        
        // Fast cycling through different endpoints (no think time)
        const endpoints = [
          '/api/health',
          '/api/items?page=1&limit=10',
          '/api/categories',
          '/api/items?search=test&limit=5'
        ];
        
        const endpoint = endpoints[requests.length % endpoints.length];
        const response = await axios.get(`${this.baseURL}${endpoint}`, {
          timeout: 5000
        });
        
        const responseTime = Date.now() - requestStart;
        
        this.results.totalRequests++;
        this.results.successful++;
        this.results.responseTimes.push(responseTime);
        
        requests.push({
          endpoint,
          status: response.status,
          responseTime,
          timestamp: Date.now()
        });
        
      } catch (error) {
        this.results.totalRequests++;
        this.results.failed++;
        this.results.errors.push({
          userId,
          error: error.message,
          timestamp: Date.now()
        });
      }
    }
    
    console.log(`✅ User ${userId} completed: ${requests.length} requests`);
    return requests;
  }

  async runStressTest() {
    console.log('🚀 High-Throughput Stress Test Starting...');
    console.log(`📊 Configuration:`);
    console.log(`   - Concurrent Users: ${this.concurrentUsers}`);
    console.log(`   - Test Duration: ${this.testDuration/1000}s`);
    console.log(`   - Max Requests per User: ${this.maxRequestsPerUser}`);
    console.log(`   - No Think Time: Maximum speed`);
    console.log('');

    this.results.startTime = Date.now();
    
    // Create concurrent users
    const userPromises = [];
    for (let i = 1; i <= this.concurrentUsers; i++) {
      userPromises.push(this.runUser(i));
    }
    
    // Wait for all users to complete
    await Promise.all(userPromises);
    
    this.results.endTime = Date.now();
    this.generateReport();
  }

  calculatePercentile(sortedArray, percentile) {
    if (sortedArray.length === 0) return 0;
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    
    if (upper >= sortedArray.length) return sortedArray[sortedArray.length - 1];
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  generateReport() {
    const testDurationSec = (this.results.endTime - this.results.startTime) / 1000;
    const successRate = this.results.totalRequests > 0 ? 
      (this.results.successful / this.results.totalRequests) * 100 : 0;
    
    const sortedTimes = this.results.responseTimes.sort((a, b) => a - b);
    const avgResponseTime = sortedTimes.length > 0 ? 
      sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length : 0;
    
    const throughput = this.results.totalRequests / testDurationSec;
    const successfulThroughput = this.results.successful / testDurationSec;
    
    console.log('\n🎯 High-Throughput Stress Test Results');
    console.log('========================================\n');
    
    console.log('📊 Throughput Metrics:');
    console.log(`   Total Requests/Second: ${throughput.toFixed(2)} req/s`);
    console.log(`   Successful Requests/Second: ${successfulThroughput.toFixed(2)} req/s`);
    console.log(`   Peak Throughput Achieved: ${Math.max(throughput, successfulThroughput).toFixed(2)} req/s`);
    console.log('');
    
    console.log('📊 Reliability Metrics:');
    console.log(`   Total Requests: ${this.results.totalRequests}`);
    console.log(`   Successful: ${this.results.successful} (${successRate.toFixed(2)}%)`);
    console.log(`   Failed: ${this.results.failed} (${(100 - successRate).toFixed(2)}%)`);
    console.log('');
    
    console.log('⏱️  Response Time Metrics:');
    console.log(`   Average: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`   Minimum: ${sortedTimes[0] || 0}ms`);
    console.log(`   Maximum: ${sortedTimes[sortedTimes.length - 1] || 0}ms`);
    console.log(`   50th Percentile: ${this.calculatePercentile(sortedTimes, 50).toFixed(2)}ms`);
    console.log(`   95th Percentile: ${this.calculatePercentile(sortedTimes, 95).toFixed(2)}ms`);
    console.log(`   99th Percentile: ${this.calculatePercentile(sortedTimes, 99).toFixed(2)}ms`);
    console.log('');
    
    console.log('🏆 Performance Assessment:');
    if (throughput >= 100) {
      console.log('   ✅ Throughput: EXCELLENT (100+ req/s)');
    } else if (throughput >= 50) {
      console.log('   ✅ Throughput: GOOD (50+ req/s)');
    } else if (throughput >= 20) {
      console.log('   ⚠️  Throughput: MODERATE (20+ req/s)');
    } else {
      console.log('   ❌ Throughput: NEEDS IMPROVEMENT (<20 req/s)');
    }
    
    if (successRate >= 99) {
      console.log('   ✅ Reliability: EXCELLENT (99%+ success)');
    } else if (successRate >= 95) {
      console.log('   ✅ Reliability: GOOD (95%+ success)');
    } else {
      console.log('   ⚠️  Reliability: NEEDS IMPROVEMENT (<95% success)');
    }
    
    console.log('');
    console.log('💡 Throughput Optimization Recommendations:');
    
    if (throughput < 50) {
      console.log('   • Consider database connection pooling optimization');
      console.log('   • Implement response caching for frequently accessed data');
      console.log('   • Optimize database queries and add proper indexes');
      console.log('   • Consider implementing clustering/load balancing');
    }
    
    if (this.results.failed > 0) {
      console.log('   • Investigate and fix error sources:');
      const errorCounts = {};
      this.results.errors.forEach(err => {
        errorCounts[err.error] = (errorCounts[err.error] || 0) + 1;
      });
      Object.entries(errorCounts).forEach(([error, count]) => {
        console.log(`     - ${error}: ${count} occurrences`);
      });
    }
    
    console.log('');
    console.log(`Test Duration: ${testDurationSec.toFixed(2)}s`);
    console.log(`Average Requests per User: ${(this.results.totalRequests / this.concurrentUsers).toFixed(1)}`);
  }
}

// Run the stress test
const test = new ThroughputTest();
test.runStressTest().catch(console.error);
