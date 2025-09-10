require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const performanceMonitor = require('./utils/performanceMonitor');
const cacheManager = require('./utils/cacheManager');

const app = express();

// Enterprise Security Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development - enable in production
  crossOriginEmbedderPolicy: false
}));

// Railway proxy fix - trust Railway's proxy
app.set('trust proxy', 1);

// Performance monitoring middleware (should be early in the stack)
app.use(performanceMonitor.middleware());

// Compression for better performance
app.use(compression({
  level: 6, // Good balance between compression ratio and speed
  threshold: 1024, // Only compress if response is larger than 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression filter
    return compression.filter(req, res);
  }
}));

// Rate limiting for enterprise-level protection
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15000, // Increased to 15,000 requests per 15 minutes for higher throughput
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for certain routes
  skip: (req) => {
    return req.path === '/api/auth/verify' || req.path === '/' || req.path === '/api/health';
  }
});

// Apply rate limiting to all API routes
app.use('/api/', limiter);

// Slow down repeated requests
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 100, // Allow 100 requests per 15 minutes at full speed
  delayMs: () => 500, // Add 500ms delay per request after delayAfter
  validate: { delayMs: false } // Disable warning
});

app.use('/api/', speedLimiter);

// Request size limits for security
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced CORS configuration
const allowedOrigins = [
  'http://localhost:3000', 
  'http://localhost:3001', 
  'http://127.0.0.1:3000', 
  'http://127.0.0.1:3001',
  'https://enterprise-inventory-system-production.up.railway.app',
  'https://dc-inventory-management.netlify.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Role'],
  optionsSuccessStatus: 200
}));

// Handle preflight requests
app.options('*', cors());

// Additional middleware for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

// Enhanced MongoDB connection with enterprise resilience
const CircuitBreaker = require('./utils/circuitBreaker');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory';
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 50,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  family: 4,
  // Enterprise resilience options
  retryWrites: true,
  retryReads: true,
  // Connection monitoring
  heartbeatFrequencyMS: 10000
};

// Circuit breaker for database operations
const dbCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 30000
});

async function connectToMongoDB() {
  return dbCircuitBreaker.execute(async () => {
    await mongoose.connect(mongoUri, mongoOptions);
    console.log('MongoDB connected with enterprise configuration');
    console.log(`Connection pool size: ${mongoOptions.maxPoolSize}`);
    return mongoose.connection;
  });
}

// Connect with retry logic
async function initializeDatabase() {
  const maxRetries = 5;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      await connectToMongoDB();
      break;
    } catch (err) {
      retryCount++;
      console.error(`MongoDB connection attempt ${retryCount}/${maxRetries} failed:`, err.message);
      
      if (retryCount >= maxRetries) {
        console.error('Max retries reached. Exiting...');
        process.exit(1);
      }
      
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Exponential backoff, max 30s
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Initialize database connection
initializeDatabase().catch(err => {
  console.error('Database initialization failed:', err);
  process.exit(1);
});

// Handle MongoDB connection events
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
});



// Serve uploaded images
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/completed-pos', express.static(path.join(__dirname, 'uploads/completed-pos')));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check routes (no authentication required)
console.log('Loading health routes...');
const { router: healthRoutes, trackError } = require('./routes/health');
app.use('/api/health', healthRoutes);

// Load routes with error handling
let itemsRoutes, categoriesRoutes, authRoutes, usersRoutes, customFieldsRoutes;
let importExportRoutes, purchaseOrdersRoutes, completedPOsRoutes, internalOrdersRoutes;
let notificationsRoutes, auditLogsRoutes, emergencyRoutes, setupRoutes;

try {
  console.log('Loading items routes...');
  itemsRoutes = require('./routes/items');
  console.log('Loading categories routes...');
  categoriesRoutes = require('./routes/categories');
  console.log('Loading auth routes...');
  authRoutes = require('./routes/auth');
  console.log('Loading users routes...');
  usersRoutes = require('./routes/users');
  console.log('Loading customFields routes...');
  customFieldsRoutes = require('./routes/customFields');
  console.log('Loading import-export routes...');
  importExportRoutes = require('./routes/import-export');
  console.log('Loading purchaseOrders routes...');
  purchaseOrdersRoutes = require('./routes/purchaseOrders');
  console.log('Loading completedPOs routes...');
  completedPOsRoutes = require('./routes/completedPOs');
  console.log('Loading internalOrders routes...');
  internalOrdersRoutes = require('./routes/internalOrders');
  console.log('Loading notifications routes...');
  notificationsRoutes = require('./routes/notifications');
  console.log('Loading audit logs routes...');
  auditLogsRoutes = require('./routes/auditLogs');
  console.log('Loading emergency routes...');
  emergencyRoutes = require('./routes/emergency');
  console.log('Loading setup routes...');
  setupRoutes = require('./routes/setup');
  console.log('All routes loaded successfully!');
} catch (error) {
  console.error('Error loading routes:', error);
  process.exit(1);
}

// Apply routes
app.use('/api/items', itemsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/customFields', customFieldsRoutes);
app.use('/api/import-export', importExportRoutes);
app.use('/api/purchase-orders', purchaseOrdersRoutes);
app.use('/api/completed-pos', completedPOsRoutes);
app.use('/api/internal-orders', internalOrdersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/setup', setupRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
  // Track error in health metrics
  const { trackError } = require('./routes/health');
  trackError();
  
  console.error('Global error handler:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(isDevelopment && { stack: err.stack }),
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] || 'unknown'
  });
});

// Handle 404 errors for API routes only
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Serve React app for all other non-uploads routes (client-side routing)
app.use((req, res, next) => {
  // Don't serve React app for uploads or API routes
  if (req.path.startsWith('/uploads') || req.path.startsWith('/api')) {
    return next();
  }
  // For all other paths, serve the React app
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Graceful shutdown
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Graceful shutdown
  process.exit(1);
});


const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Start low stock monitoring
    const { startLowStockMonitoring } = require('./services/alertService');
    startLowStockMonitoring();
  });
}

module.exports = app;
