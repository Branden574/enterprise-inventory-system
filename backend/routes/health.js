const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const performanceMonitor = require('../utils/performanceMonitor');
const cacheManager = require('../utils/cacheManager');

// Health check metrics
let healthMetrics = {
  uptime: 0,
  requestCount: 0,
  errorCount: 0,
  dbConnections: 0,
  lastDbCheck: null,
  memoryUsage: {},
  cpuUsage: 0
};

// Middleware to track requests
router.use((req, res, next) => {
  healthMetrics.requestCount++;
  next();
});

// Basic health check
router.get('/', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  };
  
  res.json(health);
});

// Detailed health check with performance metrics
router.get('/detailed', async (req, res) => {
  try {
    // Check database connectivity
    const dbStart = Date.now();
    const dbState = mongoose.connection.readyState;
    let dbLatency = null;
    let dbStatus = 'disconnected';
    
    if (dbState === 1) {
      try {
        await mongoose.connection.db.admin().ping();
        dbLatency = Date.now() - dbStart;
        dbStatus = 'connected';
        healthMetrics.lastDbCheck = new Date();
      } catch (err) {
        dbStatus = 'error';
      }
    }
    
    // Update metrics
    healthMetrics.uptime = process.uptime();
    healthMetrics.memoryUsage = process.memoryUsage();
    
    // Get performance metrics
    const perfMetrics = performanceMonitor.getMetrics();
    const cacheStats = cacheManager.getStats();
    
    const health = {
      status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: healthMetrics.uptime,
      metrics: {
        requests: {
          total: healthMetrics.requestCount,
          errors: healthMetrics.errorCount,
          errorRate: healthMetrics.requestCount > 0 ? 
            (healthMetrics.errorCount / healthMetrics.requestCount * 100).toFixed(2) + '%' : '0%'
        },
        performance: {
          requestCount: perfMetrics.requestCount,
          averageResponseTime: perfMetrics.averageResponseTime + 'ms',
          minResponseTime: perfMetrics.minResponseTime + 'ms',
          maxResponseTime: perfMetrics.maxResponseTime + 'ms',
          errorRate: perfMetrics.errorRate + '%',
          slowRequestRate: perfMetrics.slowRequestRate + '%',
          percentiles: {
            p50: perfMetrics.percentiles.p50 + 'ms',
            p95: perfMetrics.percentiles.p95 + 'ms',
            p99: perfMetrics.percentiles.p99 + 'ms'
          }
        },
        cache: {
          hitCount: cacheStats.hitCount,
          missCount: cacheStats.missCount,
          hitRate: cacheStats.hitRate + '%',
          cacheSize: cacheStats.cacheSize,
          maxSize: cacheStats.maxSize
        },
        database: {
          status: dbStatus,
          latency: dbLatency ? `${dbLatency}ms` : null,
          lastCheck: healthMetrics.lastDbCheck
        },
        system: {
          memory: {
            used: Math.round(healthMetrics.memoryUsage.heapUsed / 1024 / 1024) + 'MB',
            total: Math.round(healthMetrics.memoryUsage.heapTotal / 1024 / 1024) + 'MB',
            external: Math.round(healthMetrics.memoryUsage.external / 1024 / 1024) + 'MB'
          },
          uptime: `${Math.floor(healthMetrics.uptime / 3600)}h ${Math.floor((healthMetrics.uptime % 3600) / 60)}m`,
          environment: process.env.NODE_ENV || 'development'
        }
      }
    };
    
    res.json(health);
  } catch (error) {
    healthMetrics.errorCount++;
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Readiness check (for Kubernetes/Docker)
router.get('/ready', async (req, res) => {
  try {
    // Check if app is ready to serve requests
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: 'not ready',
        reason: 'database not connected'
      });
    }
    
    // Additional readiness checks can be added here
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message
    });
  }
});

// Liveness check (for Kubernetes/Docker)
router.get('/live', (req, res) => {
  // Simple liveness check - if this endpoint responds, the app is alive
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Reset metrics (for testing)
router.post('/reset', (req, res) => {
  healthMetrics = {
    uptime: 0,
    requestCount: 0,
    errorCount: 0,
    dbConnections: 0,
    lastDbCheck: null,
    memoryUsage: {},
    cpuUsage: 0
  };
  
  res.json({
    status: 'metrics reset',
    timestamp: new Date().toISOString()
  });
});

// Error tracking middleware
function trackError() {
  healthMetrics.errorCount++;
}

module.exports = { router, trackError, healthMetrics };
