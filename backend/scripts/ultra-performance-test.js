/**
 * Ultra High-Performance Enterprise API Reliability Test
 * Optimized for 98%+ reliability and excellent throughput
 */

const axios = require('axios');

class HighPerformanceReliabilityTest {
  constructor() {
    this.baseURL = 'http://localhost:5000';
    this.concurrentUsers = 35; // Increased concurrent users for higher throughput
    this.testDuration = 90; // 90 seconds for more comprehensive test
    this.thinkTime = 1500; // Reduced think time for higher throughput
    this.targetReliability = 98; // 98% target
    
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      errors: [],
      scenarios: {
        'Get Items List': { success: 0, total: 0, times: [] },
        'Search Items': { success: 0, total: 0, times: [] },
        'Get Categories': { success: 0, total: 0, times: [] },
        'Health Check': { success: 0, total: 0, times: [] },
        'Detailed Health Check': { success: 0, total: 0, times: [] }
      }
    };

    // High-performance HTTP client
    this.httpClient = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 second timeout
      maxRedirects: 0,
      validateStatus: () => true, // Don't throw on any status
      headers: {
        'Connection': 'keep-alive',
        'User-Agent': 'Enterprise-Reliability-Test/2.0'
      },
      // HTTP Keep-Alive
      httpAgent: new (require('http').Agent)({
        keepAlive: true,
        keepAliveMsecs: 1000,
        maxSockets: 50,
        maxFreeSockets: 10
      })
    });
  }

  /**
   * Execute a single API request with detailed tracking
   */
  async executeRequest(method, url, scenario) {
    const startTime = Date.now();
    
    try {
      const response = await this.httpClient({
        method,
        url,
        headers: {
          'X-Request-ID': `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }
      });
      
      const responseTime = Date.now() - startTime;
      this.responseTimes.push(responseTime);
      this.metrics.scenarios[scenario].times.push(responseTime);
      
      if (response.status >= 200 && response.status < 400) {
        this.successfulRequests++;
        this.metrics.scenarios[scenario].success++;
        console.log(`✅ ${method} ${url} - ${response.status} (${responseTime}ms)`);
        return { success: true, responseTime, status: response.status };
      } else {
        this.failedRequests++;
        this.errors.push({
          scenario,
          method,
          url,
          status: response.status,
          responseTime,
          error: response.statusText
        });
        console.log(`❌ ${method} ${url} - ${response.status} (${responseTime}ms) - ${response.statusText}`);
        return { success: false, responseTime, status: response.status };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.failedRequests++;
      this.errors.push({
        scenario,
        method,
        url,
        error: error.message,
        responseTime
      });
      console.log(`❌ ${method} ${url} - ${responseTime}ms - ${error.message}`);
      return { success: false, responseTime, error: error.message };
    } finally {
      this.totalRequests++;
      this.metrics.scenarios[scenario].total++;
    }
  }

  /**
   * Simulate realistic user behavior with optimized scenarios
   */
  async simulateUser(userId) {
    const scenarios = [
      // High-frequency scenarios (60% of requests)
      { weight: 30, action: () => this.executeRequest('GET', '/api/items?page=1&limit=20', 'Get Items List') },
      { weight: 15, action: () => this.executeRequest('GET', '/api/items?search=test&page=1&limit=10', 'Search Items') },
      { weight: 15, action: () => this.executeRequest('GET', '/api/categories', 'Get Categories') },
      
      // Medium-frequency scenarios (30% of requests)
      { weight: 20, action: () => this.executeRequest('GET', '/api/health', 'Health Check') },
      
      // Low-frequency scenarios (10% of requests)
      { weight: 10, action: () => this.executeRequest('GET', '/api/health/detailed', 'Detailed Health Check') },
      { weight: 5, action: () => this.executeRequest('GET', '/api/items?page=2&limit=20', 'Get Items List') },
      { weight: 3, action: () => this.executeRequest('GET', '/api/items?sortBy=name&sortOrder=asc', 'Get Items List') },
      { weight: 2, action: () => this.executeRequest('GET', '/api/items?search=inventory&page=1&limit=15', 'Search Items') }
    ];

    const endTime = Date.now() + (this.testDuration * 1000);
    let requestCount = 0;

    while (Date.now() < endTime) {
      try {
        // Weighted random scenario selection
        const random = Math.random() * 100;
        let weightSum = 0;
        let selectedScenario = scenarios[0];

        for (const scenario of scenarios) {
          weightSum += scenario.weight;
          if (random <= weightSum) {
            selectedScenario = scenario;
            break;
          }
        }

        await selectedScenario.action();
        requestCount++;

        // Dynamic think time based on performance
        const avgResponseTime = this.responseTimes.length > 0 
          ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length 
          : 0;
        
        const dynamicThinkTime = Math.max(500, this.thinkTime - (avgResponseTime * 0.5));
        await this.sleep(dynamicThinkTime);

      } catch (error) {
        console.error(`❌ User ${userId}: Request failed - ${error.message}`);
      }
    }

    console.log(`✅ User ${userId} completed: ${requestCount} requests`);
    return requestCount;
  }

  /**
   * Calculate percentiles from response times
   */
  calculatePercentile(times, percentile) {
    if (times.length === 0) return 0;
    
    const sorted = [...times].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    
    if (upper >= sorted.length) return sorted[sorted.length - 1];
    
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport(testDuration) {
    const successRate = this.totalRequests > 0 
      ? (this.successfulRequests / this.totalRequests) * 100 
      : 0;

    const throughput = this.totalRequests / (testDuration / 1000);
    const errorRate = this.totalRequests > 0 
      ? (this.failedRequests / this.totalRequests) * 100 
      : 0;

    // Response time statistics
    const avgResponseTime = this.responseTimes.length > 0 
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length 
      : 0;
    
    const minResponseTime = this.responseTimes.length > 0 ? Math.min(...this.responseTimes) : 0;
    const maxResponseTime = this.responseTimes.length > 0 ? Math.max(...this.responseTimes) : 0;
    
    const p50 = this.calculatePercentile(this.responseTimes, 50);
    const p95 = this.calculatePercentile(this.responseTimes, 95);
    const p99 = this.calculatePercentile(this.responseTimes, 99);

    // Performance grades
    const reliabilityGrade = successRate >= 98 ? 'EXCELLENT' : 
                           successRate >= 95 ? 'GOOD' : 
                           successRate >= 90 ? 'FAIR' : 'POOR';

    const throughputGrade = throughput >= 15 ? 'EXCELLENT' : 
                          throughput >= 10 ? 'GOOD' : 
                          throughput >= 5 ? 'FAIR' : 'POOR';

    const responseTimeGrade = p99 <= 300 ? 'EXCELLENT' : 
                            p99 <= 500 ? 'GOOD' : 
                            p99 <= 1000 ? 'FAIR' : 'POOR';

    const report = `
🎯 Ultra High-Performance Enterprise API Test Report
==================================================

📊 Reliability Assessment:
   Total Requests: ${this.totalRequests}
   Successful: ${this.successfulRequests} (${successRate.toFixed(2)}%)
   Failed: ${this.failedRequests} (${errorRate.toFixed(2)}%)

🎯 Reliability Target (98%): ${successRate >= this.targetReliability ? '✅ ACHIEVED' : '❌ NOT MET'}

🚀 Performance Metrics:
   Requests/Second: ${throughput.toFixed(2)}
   Errors/Second: ${(this.failedRequests / (testDuration / 1000)).toFixed(2)}

⏱️  Response Times:
   Average: ${avgResponseTime.toFixed(2)}ms
   Minimum: ${minResponseTime}ms
   Maximum: ${maxResponseTime}ms
   50th Percentile: ${p50.toFixed(2)}ms
   95th Percentile: ${p95.toFixed(2)}ms
   99th Percentile: ${p99.toFixed(2)}ms

📋 Scenario Performance:`;

    Object.entries(this.metrics.scenarios).forEach(([scenario, stats]) => {
      const scenarioSuccessRate = stats.total > 0 ? (stats.success / stats.total) * 100 : 0;
      const scenarioAvgTime = stats.times.length > 0 
        ? stats.times.reduce((a, b) => a + b, 0) / stats.times.length 
        : 0;
      report += `\n   ${scenario}: ${stats.success}/${stats.total} (${scenarioSuccessRate.toFixed(1)}% success, ${scenarioAvgTime.toFixed(1)}ms avg)`;
    });

    report += `

🔍 Error Analysis:`;
    
    if (this.errors.length > 0) {
      const errorsByScenario = {};
      this.errors.forEach(error => {
        if (!errorsByScenario[error.scenario]) {
          errorsByScenario[error.scenario] = 0;
        }
        errorsByScenario[error.scenario]++;
      });
      
      Object.entries(errorsByScenario).forEach(([scenario, count]) => {
        report += `\n   ${scenario}: ${count} errors`;
      });
    } else {
      report += `\n   No errors detected! 🎉`;
    }

    report += `

🏆 Enterprise Performance Grades:
   ${reliabilityGrade === 'EXCELLENT' ? '✅' : reliabilityGrade === 'GOOD' ? '🟡' : '❌'} Reliability: ${reliabilityGrade} (${successRate.toFixed(2)}% success rate)
   ${throughputGrade === 'EXCELLENT' ? '✅' : throughputGrade === 'GOOD' ? '🟡' : '❌'} Throughput: ${throughputGrade} (${throughput.toFixed(2)} req/s)
   ${responseTimeGrade === 'EXCELLENT' ? '✅' : responseTimeGrade === 'GOOD' ? '🟡' : '❌'} Response Time: ${responseTimeGrade} (${p99.toFixed(2)}ms 99th percentile)

💡 Recommendations:
`;

    if (successRate < 98) {
      report += `\n   • Investigate error causes to achieve 98%+ reliability target`;
    }
    if (throughput < 15) {
      report += `\n   • Consider performance optimizations to improve throughput`;
    }
    if (p99 > 300) {
      report += `\n   • Optimize response times to achieve sub-300ms 99th percentile`;
    }
    if (successRate >= 98 && throughput >= 15 && p99 <= 300) {
      report += `\n   • 🎉 API is performing at ENTERPRISE level across all metrics!`;
    }

    return report;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Run the comprehensive reliability test
   */
  async run() {
    console.log('🎯 Ultra High-Performance Enterprise API Reliability Test');
    console.log(`📊 Configuration:`);
    console.log(`   - API Base URL: ${this.baseURL}`);
    console.log(`   - Concurrent Users: ${this.concurrentUsers}`);
    console.log(`   - Test Duration: ${this.testDuration}s`);
    console.log(`   - User Think Time: ${this.thinkTime}ms`);
    console.log(`   - Reliability Target: ${this.targetReliability}%`);

    // Quick health check
    try {
      const healthCheck = await this.httpClient.get('/api/health');
      if (healthCheck.status !== 200) {
        console.log(`❌ API is not available or unhealthy. Please start the server first.`);
        console.log(`   Try: npm start`);
        return;
      }
      console.log(`✅ API health check passed - starting load test...`);
    } catch (error) {
      console.log(`❌ API is not available. Error: ${error.message}`);
      console.log(`   Try: npm start`);
      return;
    }

    const startTime = Date.now();

    // Create virtual users
    const userPromises = [];
    for (let i = 1; i <= this.concurrentUsers; i++) {
      userPromises.push(this.simulateUser(i));
    }

    console.log(`\n🚀 Starting ${this.concurrentUsers} concurrent users for ${this.testDuration} seconds...\n`);

    // Wait for all users to complete
    await Promise.all(userPromises);

    const endTime = Date.now();
    const actualDuration = endTime - startTime;

    console.log(`\n📊 Calculating performance statistics...\n`);

    // Generate and display report
    const report = this.generateReport(actualDuration);
    console.log(report);

    // Save detailed report
    const fs = require('fs');
    const reportPath = require('path').join(__dirname, '..', 'ultra-performance-report.txt');
    
    const detailedReport = report + `\n\n\nTest Configuration:
   Duration: ${(actualDuration / 1000).toFixed(1)}s
   Concurrent Users: ${this.concurrentUsers}
   Think Time: ${this.thinkTime}ms
   Total Test Time: ${(actualDuration / 1000 / 60).toFixed(1)}m ${((actualDuration / 1000) % 60).toFixed(1)}s`;

    fs.writeFileSync(reportPath, detailedReport);
    console.log(`\n📁 Detailed report saved to: ${reportPath}`);

    return {
      successRate: (this.successfulRequests / this.totalRequests) * 100,
      throughput: this.totalRequests / (actualDuration / 1000),
      p99ResponseTime: this.calculatePercentile(this.responseTimes, 99)
    };
  }
}

// Run the test
if (require.main === module) {
  const test = new HighPerformanceReliabilityTest();
  test.run().catch(console.error);
}

module.exports = HighPerformanceReliabilityTest;
