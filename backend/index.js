require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

console.log(`🚀 Starting server on port ${PORT}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced CORS configuration
const corsOptions = require('./config/cors');
app.use(cors(corsOptions));

// Trust Railway proxy
app.set('trust proxy', 1);

// Basic logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check - MUST be first route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health/live', (req, res) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// MongoDB connection (simple and non-blocking)
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => {
    console.log('✅ MongoDB connected');
  }).catch(err => {
    console.warn('⚠️ MongoDB connection failed:', err.message);
  });
} else {
  console.warn('⚠️ No MONGO_URI provided, running without database');
}

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Load essential routes only
try {
  console.log('Loading routes...');
  
  const authRoutes = require('./routes/auth');
  const itemsRoutes = require('./routes/items');
  const categoriesRoutes = require('./routes/categories');
  const usersRoutes = require('./routes/users');
  const auditLogsRoutes = require('./routes/auditLogs');
  const customFieldsRoutes = require('./routes/customFields');
  const purchaseOrdersRoutes = require('./routes/purchaseOrders');
  const notificationsRoutes = require('./routes/notifications');
  const importExportRoutes = require('./routes/import-export');
  const internalOrdersRoutes = require('./routes/internalOrders');
  
  app.use('/api/auth', authRoutes);
  app.use('/api/items', itemsRoutes);
  app.use('/api/categories', categoriesRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/audit-logs', auditLogsRoutes);
  app.use('/api/customFields', customFieldsRoutes);
  app.use('/api/purchase-orders', purchaseOrdersRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/import-export', importExportRoutes);
  app.use('/api/internal-orders', internalOrdersRoutes);
  
  console.log('✅ Routes loaded');
} catch (error) {
  console.error('❌ Error loading routes:', error.message);
}

// API 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎉 Server started successfully on port ${PORT}`);
  console.log(`🌐 Health check: /api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

module.exports = app;