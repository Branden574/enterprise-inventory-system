const cluster = require('cluster');
const os = require('os');
const path = require('path');

// Enterprise clustering configuration
const WORKERS = process.env.WORKERS || os.cpus().length;
const PORT = process.env.PORT || 5000;

if (cluster.isMaster) {
  console.log(`🚀 Master process ${process.pid} is running`);
  console.log(`🏭 Starting ${WORKERS} worker processes for enterprise scalability`);
  
  // Performance monitoring
  const startTime = Date.now();
  let requestCount = 0;
  
  // Fork workers
  for (let i = 0; i < WORKERS; i++) {
    const worker = cluster.fork();
    console.log(`👷 Worker ${worker.process.pid} started`);
  }
  
  // Handle worker crashes and restart
  cluster.on('exit', (worker, code, signal) => {
    console.log(`❌ Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
    const newWorker = cluster.fork();
    console.log(`✅ New worker ${newWorker.process.pid} started`);
  });
  
  // Performance reporting
  setInterval(() => {
    const uptime = (Date.now() - startTime) / 1000;
    const workers = Object.keys(cluster.workers).length;
    console.log(`📊 Performance Report: ${workers} workers active, ${Math.round(uptime)}s uptime, ${requestCount} total requests`);
    requestCount = 0; // Reset counter
  }, 60000); // Every minute
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 Master received SIGTERM, shutting down gracefully');
    
    Object.keys(cluster.workers).forEach(id => {
      cluster.workers[id].kill();
    });
    
    setTimeout(() => {
      console.log('🔴 Forcing shutdown');
      process.exit(1);
    }, 10000);
  });
  
} else {
  // Worker process - run the actual server
  const app = require('./index.js');
  
  const server = app.listen(PORT, () => {
    console.log(`🔧 Worker ${process.pid} listening on port ${PORT}`);
  });
  
  // Track requests for performance monitoring
  app.use((req, res, next) => {
    requestCount++;
    next();
  });
  
  // Graceful shutdown for workers
  process.on('SIGTERM', () => {
    console.log(`🛑 Worker ${process.pid} received SIGTERM, shutting down gracefully`);
    
    server.close(() => {
      console.log(`✅ Worker ${process.pid} closed all connections`);
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.log(`🔴 Worker ${process.pid} forcing shutdown`);
      process.exit(1);
    }, 10000);
  });
}

module.exports = cluster;
