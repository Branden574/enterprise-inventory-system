/**
 * Enterprise Performance Monitoring Middleware
 * Real-time performance tracking and optimization
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requestCount: 0,
      totalResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      errorCount: 0,
      slowRequestCount: 0,
      endpoints: new Map(),
      responseTimes: []
    };
    
    this.slowRequestThreshold = 500; // 500ms threshold for slow requests
    this.maxResponseTimes = 1000; // Keep last 1000 response times for percentiles
  }

  /**
   * Middleware function for tracking performance
   */
  middleware() {
    const monitor = this; // Capture monitor instance
    
    return (req, res, next) => {
      const startTime = process.hrtime.bigint();
      const originalSend = res.send;

      res.send = function(data) {
        const endTime = process.hrtime.bigint();
        const responseTimeMs = Number(endTime - startTime) / 1000000; // Convert to milliseconds

        // Update global metrics
        monitor.metrics.requestCount++;
        monitor.metrics.totalResponseTime += responseTimeMs;
        monitor.metrics.minResponseTime = Math.min(monitor.metrics.minResponseTime, responseTimeMs);
        monitor.metrics.maxResponseTime = Math.max(monitor.metrics.maxResponseTime, responseTimeMs);

        // Track slow requests
        if (responseTimeMs > monitor.slowRequestThreshold) {
          monitor.metrics.slowRequestCount++;
        }

        // Track errors
        if (res.statusCode >= 400) {
          monitor.metrics.errorCount++;
        }

        // Track per-endpoint metrics
        const endpoint = `${req.method} ${req.route?.path || req.path}`;
        if (!monitor.metrics.endpoints.has(endpoint)) {
          monitor.metrics.endpoints.set(endpoint, {
            count: 0,
            totalTime: 0,
            minTime: Infinity,
            maxTime: 0,
            errorCount: 0
          });
        }

        const endpointMetrics = monitor.metrics.endpoints.get(endpoint);
        endpointMetrics.count++;
        endpointMetrics.totalTime += responseTimeMs;
        endpointMetrics.minTime = Math.min(endpointMetrics.minTime, responseTimeMs);
        endpointMetrics.maxTime = Math.max(endpointMetrics.maxTime, responseTimeMs);
        
        if (res.statusCode >= 400) {
          endpointMetrics.errorCount++;
        }

        // Keep response times for percentile calculations
        monitor.metrics.responseTimes.push(responseTimeMs);
        if (monitor.metrics.responseTimes.length > monitor.maxResponseTimes) {
          monitor.metrics.responseTimes.shift(); // Remove oldest
        }

        originalSend.call(this, data);
      };

      next();
    };
  }

  /**
   * Get current performance metrics
   */
  getMetrics() {
    const avgResponseTime = this.metrics.requestCount > 0 
      ? this.metrics.totalResponseTime / this.metrics.requestCount 
      : 0;

    const errorRate = this.metrics.requestCount > 0 
      ? (this.metrics.errorCount / this.metrics.requestCount) * 100 
      : 0;

    const slowRequestRate = this.metrics.requestCount > 0 
      ? (this.metrics.slowRequestCount / this.metrics.requestCount) * 100 
      : 0;

    // Calculate percentiles
    const sortedTimes = [...this.metrics.responseTimes].sort((a, b) => a - b);
    const p50 = this.getPercentile(sortedTimes, 0.5);
    const p95 = this.getPercentile(sortedTimes, 0.95);
    const p99 = this.getPercentile(sortedTimes, 0.99);

    return {
      requestCount: this.metrics.requestCount,
      averageResponseTime: Math.round(avgResponseTime * 100) / 100,
      minResponseTime: this.metrics.minResponseTime === Infinity ? 0 : Math.round(this.metrics.minResponseTime * 100) / 100,
      maxResponseTime: Math.round(this.metrics.maxResponseTime * 100) / 100,
      errorCount: this.metrics.errorCount,
      errorRate: Math.round(errorRate * 100) / 100,
      slowRequestCount: this.metrics.slowRequestCount,
      slowRequestRate: Math.round(slowRequestRate * 100) / 100,
      percentiles: {
        p50: Math.round(p50 * 100) / 100,
        p95: Math.round(p95 * 100) / 100,
        p99: Math.round(p99 * 100) / 100
      },
      endpoints: this.getEndpointMetrics()
    };
  }

  /**
   * Get endpoint-specific metrics
   */
  getEndpointMetrics() {
    const endpointMetrics = {};
    
    for (const [endpoint, metrics] of this.metrics.endpoints.entries()) {
      const avgTime = metrics.count > 0 ? metrics.totalTime / metrics.count : 0;
      const errorRate = metrics.count > 0 ? (metrics.errorCount / metrics.count) * 100 : 0;
      
      endpointMetrics[endpoint] = {
        requestCount: metrics.count,
        averageResponseTime: Math.round(avgTime * 100) / 100,
        minResponseTime: metrics.minTime === Infinity ? 0 : Math.round(metrics.minTime * 100) / 100,
        maxResponseTime: Math.round(metrics.maxTime * 100) / 100,
        errorCount: metrics.errorCount,
        errorRate: Math.round(errorRate * 100) / 100
      };
    }
    
    return endpointMetrics;
  }

  /**
   * Calculate percentile from sorted array
   */
  getPercentile(sortedArray, percentile) {
    if (sortedArray.length === 0) return 0;
    
    const index = (percentile * (sortedArray.length - 1));
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    
    if (upper >= sortedArray.length) return sortedArray[sortedArray.length - 1];
    
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      requestCount: 0,
      totalResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      errorCount: 0,
      slowRequestCount: 0,
      endpoints: new Map(),
      responseTimes: []
    };
  }
}

// Global performance monitor instance
const performanceMonitor = new PerformanceMonitor();

module.exports = performanceMonitor;
