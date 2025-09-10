const axios = require('axios');

// Enterprise-grade HTTP client with retry logic
class EnterpriseApiClient {
  constructor(baseURL, options = {}) {
    this.baseURL = baseURL;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.timeout = options.timeout || 10000;
    
    this.client = axios.create({
      baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        config.metadata = { startTime: new Date() };
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Add response interceptor for retry logic
    this.client.interceptors.response.use(
      (response) => {
        const endTime = new Date();
        const duration = endTime - response.config.metadata.startTime;
        console.log(`✅ ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`);
        return response;
      },
      (error) => this.handleError(error)
    );
  }
  
  async handleError(error) {
    const config = error.config;
    
    if (!config || !config.retry) {
      config.retry = 0;
    }
    
    // Check if we should retry
    if (config.retry < this.maxRetries && this.shouldRetry(error)) {
      config.retry++;
      
      const delay = this.calculateDelay(config.retry);
      console.log(`🔄 Retrying request (${config.retry}/${this.maxRetries}) after ${delay}ms: ${config.method.toUpperCase()} ${config.url}`);
      
      await this.sleep(delay);
      return this.client(config);
    }
    
    // Log final error
    const endTime = new Date();
    const duration = config.metadata ? endTime - config.metadata.startTime : 0;
    console.log(`❌ ${config.method?.toUpperCase() || 'REQUEST'} ${config.url} - ${error.response?.status || 'FAILED'} (${duration}ms) - ${error.message}`);
    
    return Promise.reject(error);
  }
  
  shouldRetry(error) {
    // Retry on network errors, timeouts, and certain HTTP status codes
    if (!error.response) {
      return true; // Network error
    }
    
    const status = error.response.status;
    return status === 429 || // Rate limited
           status === 502 || // Bad Gateway
           status === 503 || // Service Unavailable
           status === 504;   // Gateway Timeout
  }
  
  calculateDelay(retryCount) {
    // Exponential backoff with jitter
    const baseDelay = this.retryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, retryCount - 1);
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter
    return Math.min(exponentialDelay + jitter, 10000); // Cap at 10 seconds
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Wrapper methods for common HTTP verbs
  async get(url, config = {}) {
    return this.client.get(url, config);
  }
  
  async post(url, data, config = {}) {
    return this.client.post(url, data, config);
  }
  
  async put(url, data, config = {}) {
    return this.client.put(url, data, config);
  }
  
  async delete(url, config = {}) {
    return this.client.delete(url, config);
  }
  
  async patch(url, data, config = {}) {
    return this.client.patch(url, data, config);
  }
}

module.exports = EnterpriseApiClient;
