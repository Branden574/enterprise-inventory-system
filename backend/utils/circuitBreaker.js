class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000; // 30 seconds
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
    
    // Metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      circuitBreakerTrips: 0
    };
    
    console.log(`🔌 Circuit Breaker initialized: threshold=${this.failureThreshold}, resetTimeout=${this.resetTimeout}ms`);
  }
  
  async execute(operation, fallback = null) {
    this.metrics.totalRequests++;
    
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        console.log('🔄 Circuit Breaker transitioning to HALF_OPEN');
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        console.log('⚡ Circuit Breaker OPEN - Request blocked');
        if (fallback) {
          return await fallback();
        }
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      
      if (fallback && this.state === 'OPEN') {
        console.log('🔄 Executing fallback operation');
        return await fallback();
      }
      
      throw error;
    }
  }
  
  onSuccess() {
    this.metrics.successfulRequests++;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 3) { // Require 3 successes to close
        console.log('✅ Circuit Breaker CLOSED - Service recovered');
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
      }
    } else if (this.state === 'CLOSED') {
      this.failureCount = 0; // Reset failure count on success
    }
  }
  
  onFailure() {
    this.metrics.failedRequests++;
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.state === 'CLOSED' && this.failureCount >= this.failureThreshold) {
      console.log(`🚨 Circuit Breaker OPEN - ${this.failureCount} consecutive failures`);
      this.state = 'OPEN';
      this.metrics.circuitBreakerTrips++;
    } else if (this.state === 'HALF_OPEN') {
      console.log('❌ Circuit Breaker returning to OPEN - Half-open test failed');
      this.state = 'OPEN';
    }
  }
  
  getMetrics() {
    const successRate = this.metrics.totalRequests > 0 
      ? (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(2)
      : 0;
      
    return {
      ...this.metrics,
      successRate: `${successRate}%`,
      state: this.state,
      failureCount: this.failureCount
    };
  }
  
  reset() {
    console.log('🔄 Circuit Breaker manually reset');
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }
}

module.exports = CircuitBreaker;
