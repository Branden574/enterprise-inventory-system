require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🚀 Starting Railway-optimized server...');
console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔌 Port: ${PORT}`);

// Basic security and middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration for Railway
const corsOptions = require('./config/cors');
app.use(cors(corsOptions));

// Trust proxy for Railway
app.set('trust proxy', 1);

// Basic request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// MongoDB connection (non-blocking)
const connectToDatabase = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.warn('⚠️ MONGO_URI not set, running without database');
      return false;
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,  // Increased timeout
      connectTimeoutMS: 15000,          // Increased timeout
      socketTimeoutMS: 60000            // Increased timeout for long operations
    });
    console.log('✅ MongoDB connected successfully to:', 
      process.env.MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Log URI without exposing credentials
    return true;
  } catch (error) {
    console.warn('⚠️ MongoDB connection failed:', error.message);
    console.warn('Connection string format may be incorrect or database might be unreachable');
    return false;
  }
};

// Start database connection in background
connectToDatabase();

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.warn('MongoDB error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected - attempting reconnection...');
  setTimeout(connectToDatabase, 5000);
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint (must be first and simple)
app.get('/api/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'connecting',
    environment: process.env.NODE_ENV || 'development'
  };
  res.json(health);
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Connection troubleshooting endpoint
app.get('/api/debug/connection', (req, res) => {
  // Collect diagnostic information
  const diagnostics = {
    timestamp: new Date().toISOString(),
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      env: process.env.NODE_ENV
    },
    database: {
      connected: mongoose.connection.readyState === 1,
      state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
      hasMongoUri: !!process.env.MONGO_URI,
    },
    request: {
      ip: req.ip,
      headers: req.headers,
      protocol: req.protocol,
      secure: req.secure
    }
  };
  
  res.json(diagnostics);
});

// Load routes only after server is ready
const loadRoutes = () => {
  try {
    console.log('🔄 Loading application routes...');
    
    // Import routes
    const authRoutes = require('./routes/auth');
    const itemsRoutes = require('./routes/items');
    const categoriesRoutes = require('./routes/categories');
    const usersRoutes = require('./routes/users');
    const auditLogsRoutes = require('./routes/auditLogs');
    const internalOrdersRoutes = require('./routes/internalOrders');
    const purchaseOrdersRoutes = require('./routes/purchaseOrders');
    const notificationsRoutes = require('./routes/notifications');
    const customFieldsRoutes = require('./routes/customFields');
    const importExportRoutes = require('./routes/import-export');
    
    // Apply routes
    app.use('/api/auth', authRoutes);
    app.use('/api/items', itemsRoutes);
    app.use('/api/categories', categoriesRoutes);
    app.use('/api/users', usersRoutes);
    app.use('/api/audit-logs', auditLogsRoutes);
    app.use('/api/internal-orders', internalOrdersRoutes);
    app.use('/api/purchase-orders', purchaseOrdersRoutes);
    app.use('/api/notifications', notificationsRoutes);
    app.use('/api/customFields', customFieldsRoutes);
    app.use('/api/import-export', importExportRoutes);
    
    console.log('✅ All routes loaded successfully');
  } catch (error) {
    console.error('❌ Error loading routes:', error);
  }
};

// API routes 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Serve React app for non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// Create HTTP server
const server = http.createServer(app);

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

// Start server
if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🎉 Server successfully started on port ${PORT}`);
    console.log(`🌐 URL: ${process.env.NODE_ENV === 'production' ? 'https://enterprise-inventory-system-production.up.railway.app' : `http://localhost:${PORT}`}`);
    
    // Load routes after server is listening
    loadRoutes();
    
    // Initialize additional services after a delay
    setTimeout(() => {
      try {
        console.log('🔧 Initializing additional services...');
        // Any additional initialization can go here
        console.log('✅ Server fully initialized and ready');
      } catch (error) {
        console.warn('⚠️ Warning during service initialization:', error.message);
      }
    }, 1000);
  });
}

module.exports = { app, server };