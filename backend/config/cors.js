/**
 * CORS Configuration
 * This file handles Cross-Origin Resource Sharing settings for the API
 */

const corsOptions = {
  origin: function (origin, callback) {
    // List of allowed origins
    const allowedOrigins = [
      // Local development
      'http://localhost:3000',
      'http://localhost:5000',
      
      // Production domains
      'https://enterprise-inventory-system-production.up.railway.app',
      
      // Add your frontend domain if different from API domain
      // 'https://your-frontend-domain.com',
    ];
    
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Role'],
  maxAge: 86400  // 24 hours
};

module.exports = corsOptions;