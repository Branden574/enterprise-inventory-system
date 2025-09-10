# Deployment Guide - Enterprise Inventory Management System

## Table of Contents
1. [Hosting Options](#hosting-options)
2. [Database Deployment](#database-deployment)
3. [Data Access Methods](#data-access-methods)
4. [Environment Configuration](#environment-configuration)
5. [Deployment Steps](#deployment-steps)
6. [Post-Deployment Verification](#post-deployment-verification)

---

## Hosting Options

### **Recommended: Railway (Easiest)**
- **Cost**: $5/month for hobby plan
- **Features**: Auto-deploy from GitHub, built-in MongoDB, SSL certificates
- **Best for**: Testing and small-scale production

### **Alternative: Render + MongoDB Atlas**
- **Cost**: $7/month (Render) + $9/month (MongoDB Atlas)
- **Features**: Separate backend/frontend hosting, managed database
- **Best for**: Scalable production deployment

### **Budget Option: Vercel + MongoDB Atlas**
- **Cost**: Free (Vercel) + $9/month (MongoDB Atlas)
- **Features**: Frontend hosting, serverless functions
- **Best for**: Frontend-heavy applications

---

## Database Deployment

### **Option 1: MongoDB Atlas (Recommended)**
```bash
# 1. Sign up at https://cloud.mongodb.com
# 2. Create a new cluster (M0 free tier for testing)
# 3. Create database user
# 4. Whitelist IP addresses (0.0.0.0/0 for testing)
# 5. Get connection string:
# mongodb+srv://username:password@cluster.mongodb.net/InventoryTest
```

### **Option 2: Railway MongoDB (Simpler)**
```bash
# 1. Add MongoDB service in Railway dashboard
# 2. Get connection string from environment variables
# 3. Automatic backups included
```

---

## Data Access Methods

### **1. Web-Based Admin Dashboard (Built-in)**
Your system already includes admin dashboards:

**Access URLs after deployment:**
```
https://yourapp.com/admin-dashboard     # Items, categories, users
https://yourapp.com/audit-trail         # System logs
https://yourapp.com/admin-custom-fields # Custom field management
https://yourapp.com/admin-internal-orders # Order management
```

**Admin Login:**
- Use your superadmin account
- Full CRUD operations on all data
- Real-time performance monitoring

### **2. MongoDB Compass (Desktop App)**
```bash
# Download MongoDB Compass from https://www.mongodb.com/products/compass
# Connect using your MongoDB Atlas connection string
# Full database visualization and querying
```

**Connection String Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/InventoryTest
```

### **3. API Endpoints for Data Access**
```javascript
// All your existing API endpoints work after deployment:

// Items management
GET    https://yourapp.com/api/items
POST   https://yourapp.com/api/items
PUT    https://yourapp.com/api/items/:id
DELETE https://yourapp.com/api/items/:id

// User management
GET    https://yourapp.com/api/users
PUT    https://yourapp.com/api/users/:id

// Categories
GET    https://yourapp.com/api/categories
POST   https://yourapp.com/api/categories

// Audit logs
GET    https://yourapp.com/api/audit-logs

// Health monitoring
GET    https://yourapp.com/api/health
```

### **4. Database Direct Access Tools**

**MongoDB Atlas Web Interface:**
- Browse collections
- Run queries
- View performance metrics
- Set up automated backups

**MongoDB Shell (Command Line):**
```bash
# Connect to your deployed database
mongo "mongodb+srv://cluster.mongodb.net/InventoryTest" --username your-username

# Run maintenance scripts remotely
mongo "mongodb+srv://cluster.mongodb.net/InventoryTest" --username your-username backend/scripts/mongodb-maintenance.js
```

---

## Environment Configuration

### **Production Environment Variables**
Create these in your hosting platform:

```env
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/InventoryTest

# Security
JWT_SECRET=your-super-secure-jwt-secret-change-this-in-production

# Server
PORT=3001
NODE_ENV=production

# CORS (adjust for your domain)
CORS_ORIGIN=https://yourfrontend.com

# Rate limiting (production settings)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=15000
```

---

## Deployment Steps

### **Railway Deployment (Recommended)**

**1. Prepare Repository:**
```powershell
# Initialize git repository
cd "C:\Users\branden.walker\OneDrive - School Network\Desktop\Inventory Program"
git init
git add .
git commit -m "Initial commit - Enterprise inventory system"

# Push to GitHub
# Create repository on GitHub first
git remote add origin https://github.com/yourusername/inventory-system.git
git push -u origin main
```

**2. Deploy Backend:**
```bash
# 1. Sign up at https://railway.app
# 2. Connect GitHub repository
# 3. Deploy backend folder
# 4. Add MongoDB service
# 5. Configure environment variables
```

**3. Deploy Frontend:**
```bash
# 1. Build frontend for production
cd frontend
npm run build

# 2. Deploy to Railway or Netlify
# 3. Update API endpoints to point to deployed backend
```

### **Manual Deployment Steps:**

**1. Update Frontend API URLs:**
```javascript
// In frontend/src/utils/api.js or similar
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-url.com/api'
  : 'http://localhost:3001/api';
```

**2. Production Build:**
```powershell
# Backend
cd backend
npm install --production

# Frontend
cd frontend
npm run build
```

**3. Environment Setup:**
```powershell
# Copy .env.example to .env.production
# Update all environment variables for production
# Ensure MongoDB connection string is correct
```

---

## Post-Deployment Verification

### **1. System Health Check**
```bash
# Test all critical endpoints
curl https://yourapp.com/api/health
curl https://yourapp.com/api/items
curl -X POST https://yourapp.com/api/auth/login -H "Content-Type: application/json" -d '{"username":"test","password":"test"}'
```

### **2. Performance Verification**
```bash
# Run performance tests against deployed system
# Update scripts to point to production URL

# Test from local machine
cd backend
# Edit benchmark.js to use production URL
node scripts/benchmark.js
```

### **3. Database Verification**
```javascript
// Connect to production database via MongoDB Compass
// Verify all collections exist
// Check data integrity
// Ensure indexes are created
```

### **4. Security Verification**
```bash
# Test authentication
# Verify CORS settings
# Check HTTPS certificate
# Test rate limiting
```

---

## Data Monitoring in Production

### **1. Built-in Monitoring Dashboard**
```
https://yourapp.com/api/health
```
**Provides:**
- Server uptime
- Response time percentiles
- Cache hit rates
- Request counts
- Memory usage

### **2. Database Monitoring**
**MongoDB Atlas Dashboard:**
- Real-time performance metrics
- Query performance
- Connection monitoring
- Storage usage
- Automated alerts

### **3. Application Monitoring**
**Admin Dashboard Features:**
- Real-time user activity
- System audit logs
- Performance metrics
- Error tracking
- User management

---

## Accessing Your Data After Deployment

### **Primary Access Methods:**

**1. Web Admin Interface (Recommended for daily use)**
```
https://yourapp.com/login
# Login with superadmin credentials
# Navigate to admin sections for full data management
```

**2. MongoDB Compass (Recommended for database analysis)**
```
# Desktop application
# Connect with production connection string
# Full database exploration and querying capabilities
```

**3. API Access (For integrations)**
```bash
# Get JWT token
curl -X POST https://yourapp.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"yourpassword"}'

# Use token for API calls
curl -H "Authorization: Bearer YOUR_TOKEN" https://yourapp.com/api/items
```

**4. Mobile/Remote Access**
- Your web interface is responsive
- Works on tablets and phones
- Full functionality available remotely

---

## Backup Strategy for Production

### **Automated Backups:**
```bash
# MongoDB Atlas automatic backups (recommended)
# Point-in-time recovery available
# Cross-region backup replication

# Custom backup script for additional safety
# Set up scheduled task to run backup script
```

### **Manual Backup Commands:**
```bash
# Export critical data
mongoexport --uri="mongodb+srv://..." --collection=items --out=items-backup.json
mongoexport --uri="mongodb+srv://..." --collection=users --out=users-backup.json
```

---

## Cost Estimation

### **Monthly Hosting Costs:**

**Railway (All-in-one):**
- Hobby Plan: $5/month
- Includes: Backend, Frontend, Database
- Good for: 100-1000 users

**Render + MongoDB Atlas:**
- Render Web Service: $7/month
- MongoDB Atlas M10: $9/month
- Total: $16/month
- Good for: 1000+ users

**Production Scale:**
- Railway Pro: $20/month
- MongoDB Atlas M20: $36/month
- CDN: $5/month
- Total: $61/month
- Good for: 10,000+ users

---

## Next Steps for Deployment

1. **Choose hosting platform** (Railway recommended for testing)
2. **Set up MongoDB Atlas** account
3. **Push code to GitHub** repository
4. **Configure environment variables** in hosting platform
5. **Deploy and test** all functionality
6. **Set up monitoring** and backups
7. **Share testing URL** with team

**Your system is enterprise-ready and will provide excellent data access and management capabilities once deployed!** 🚀

---

## Support and Troubleshooting

**Common Deployment Issues:**
- Environment variable configuration
- CORS setup for cross-origin requests
- Database connection timeouts
- File upload path configuration

**Quick Fixes:**
- Check environment variables match exactly
- Verify MongoDB connection string format
- Ensure all required ports are open
- Test API endpoints individually

**Monitoring Tools:**
- MongoDB Atlas monitoring dashboard
- Railway/Render application logs
- Built-in health monitoring endpoint
- Performance benchmark scripts
