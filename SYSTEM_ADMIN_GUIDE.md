# Enterprise Inventory Management System - Admin Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Daily Operations](#daily-operations)
3. [User Management](#user-management)
4. [Security Maintenance](#security-maintenance)
5. [Performance Monitoring](#performance-monitoring)
6. [Backup Procedures](#backup-procedures)
7. [Troubleshooti### 3. Recovery Procedures

**Database Restore:**
```powershell
# Restore complete database
mongorestore --db=InventoryTest --drop "C:\Backups\MongoDB\2025-09-10\InventoryTest"

# Restore specific collection
mongorestore --db=InventoryTest --collection=items --drop "C:\Backups\MongoDB\2025-09-10\InventoryTest\items.bson"

# Restore from JSON export
mongoimport --db=InventoryTest --collection=items --file="C:\Backups\Critical\items-2025-09-10.json"
```

**Verify Restore:**
```javascript
// Connect to MongoDB shell and verify data
use InventoryTest
db.items.countDocuments()
db.users.countDocuments()
db.categories.countDocuments()

// Check data integrity
db.items.findOne()
db.users.findOne({role: "superadmin"})
```

---

## MongoDB Maintenance Tasks

### 1. Daily Maintenance (2 minutes)

**Database Health Check:**
```powershell
# Check MongoDB service status
Get-Service | Where-Object {$_.Name -like "*mongo*"}

# Quick connection test
mongo --eval "db.runCommand({ping: 1})"

# Check disk space for database
mongo --eval "db.stats(1024*1024)" InventoryTest
```

### 2. Weekly Maintenance (15 minutes)

**Performance Analysis:**
```javascript
// MongoDB shell commands
use InventoryTest

// Check slow operations
db.currentOp({"secs_running": {"$gt": 1}})

// Analyze collection sizes
db.runCommand({collStats: "items"})
db.runCommand({collStats: "auditlogs"})

// Check index efficiency
db.items.explain("executionStats").find({category: "Electronics"})
```

**Data Cleanup:**
```javascript
// Clean old audit logs (older than 90 days)
use InventoryTest
var cutoffDate = new Date();
cutoffDate.setDate(cutoffDate.getDate() - 90);
db.auditlogs.deleteMany({timestamp: {$lt: cutoffDate}});

// Clean orphaned upload references
// Run this as a monthly task to clean up file references
```

### 3. Monthly Maintenance (30 minutes)

**Index Optimization:**
```javascript
use InventoryTest

// Rebuild indexes for optimal performance
db.items.reIndex()
db.users.reIndex()
db.auditlogs.reIndex()

// Analyze index usage
db.items.aggregate([{$indexStats:{}}]).pretty()

// Remove unused indexes (review first!)
// db.collection.dropIndex("index_name")
```

**Database Compaction:**
```javascript
// Compact collections to reclaim space
db.runCommand({compact: "auditlogs"})
db.runCommand({compact: "items"})

// Check database file sizes after compaction
db.stats(1024*1024)
```

**Data Integrity Checks:**
```javascript
// Verify referential integrity
// Check for orphaned records
db.items.find({category: {$exists: true}}).forEach(function(item) {
    if (item.category && !db.categories.findOne({_id: item.category})) {
        print("Orphaned category reference in item: " + item._id);
    }
});

// Check for duplicate barcodes
db.items.aggregate([
    {$match: {barcode: {$exists: true, $ne: ""}}},
    {$group: {_id: "$barcode", count: {$sum: 1}}},
    {$match: {count: {$gt: 1}}}
]);
```roubleshooting)
8. [Emergency Procedures](#emergency-procedures)

---

## System Overview

### Architecture
- **Backend**: Node.js/Express API with MongoDB
- **Frontend**: React application
- **Performance**: 100% reliability, 95+ req/s throughput
- **Security**: JWT authentication, role-based access, audit logging

### Key Directories
```
backend/
├── index.js              # Main server file
├── middleware/           # Authentication & security
├── models/               # Database schemas
├── routes/               # API endpoints
├── scripts/              # Admin utilities
├── utils/                # Performance & caching
└── uploads/              # File storage
```

---

## Daily Operations

### 1. Starting the System

**Backend Server:**
```powershell
cd "C:\Users\branden.walker\OneDrive - School Network\Desktop\Inventory Program\backend"
npm start
```

**Frontend Application:**
```powershell
cd "C:\Users\branden.walker\OneDrive - School Network\Desktop\Inventory Program\frontend"
npm start
```

### 2. System Health Check

**Quick Health Verification:**
```powershell
# Check API health endpoint
curl http://localhost:3001/api/health

# Expected response includes:
# - status: "healthy"
# - uptime: server runtime
# - performance metrics
```

**Detailed Performance Check:**
```powershell
cd backend
node scripts/benchmark.js
```

### 3. Daily Monitoring Commands

**Check Active Connections:**
```powershell
netstat -an | findstr :3001
```

**Monitor System Resources:**
```powershell
Get-Process node | Select-Object Name,CPU,WorkingSet
```

---

## User Management

### 1. Creating User Accounts

**Regular User (Self-Registration Available):**
- Users can register at `/register` endpoint
- Automatically assigned 'user' role

**Staff Account (Admin Required):**
```powershell
# Use API endpoint POST /api/auth/register-admin
# Headers: Authorization: Bearer <admin_token>
# Body: {
#   "username": "staff.user@company.com",
#   "password": "SecurePassword123!",
#   "firstName": "John",
#   "lastName": "Doe",
#   "email": "staff.user@company.com",
#   "role": "staff"
# }
```

**Admin Account (Superadmin Only):**
```powershell
cd backend/scripts
node create-admin-interactive.js
```

### 2. Password Reset Procedures

**Method 1: Force Password Change (Recommended)**
```powershell
cd backend/scripts

# Edit update-user-password-change.js and modify:
# const username = 'user@company.com';

node update-user-password-change.js
```

**Method 2: Generate New Password Hash**
```powershell
cd backend/scripts

# Edit hash-password.js and set desired password:
# const password = "NewSecurePassword123!";

node hash-password.js

# Then update user in database with generated hash
```

### 3. User Role Management

**Checking User Roles:**
```powershell
# Connect to MongoDB and run:
# db.users.find({}, {username: 1, role: 1, requirePasswordChange: 1})
```

**Changing User Roles (via API):**
```
PUT /api/users/:id/role
Authorization: Bearer <admin_token>
Body: {"role": "admin"} // or "staff", "user"
```

---

## Security Maintenance

### 1. Regular Security Checks

**Daily Security Audit:**
```powershell
# Check audit logs for suspicious activity
# View recent logins and user changes through admin dashboard
# Monitor failed login attempts
```

**Weekly Password Policy Review:**
- Ensure all admin accounts have strong passwords (16+ chars, special chars)
- Verify `requirePasswordChange` flag for new admin accounts
- Check for inactive accounts

### 2. Authentication Management

**JWT Secret Rotation (Monthly):**
1. Generate new JWT secret in `.env`
2. Restart server during maintenance window
3. All users will need to re-authenticate

**Session Monitoring:**
```powershell
# Monitor active sessions through audit logs
# Check for concurrent logins from different IPs
```

### 3. Access Control Verification

**Role Permissions Audit:**
```javascript
// Verify these endpoints are properly protected:
// - /api/auth/register-admin (admin/superadmin only)
// - /api/users/* (admin/superadmin only)
// - /api/audit-logs (admin/superadmin only)
```

### 4. Database Security

**Connection Security:**
- Verify MongoDB connection uses authentication
- Ensure connection string in `.env` is secure
- Regular password rotation for database user

**Data Encryption:**
- Passwords stored with bcrypt (salt rounds: 10)
- Sensitive data should be encrypted at rest

---

## Performance Monitoring

### 1. Performance Benchmarks

**Weekly Performance Test:**
```powershell
cd backend
node scripts/benchmark.js
```

**Expected Results:**
- Success Rate: 100%
- Average Response Time: <100ms
- 95th Percentile: <200ms
- Throughput: 30+ req/s

**Stress Testing (Monthly):**
```powershell
cd backend
node scripts/throughput-test.js
```

**Expected Results:**
- Peak Throughput: 95+ req/s
- 99th Percentile: <600ms under stress
- Zero failures during stress test

### 2. Cache Management

**Cache Statistics:**
```powershell
# Check cache hit rates through /api/health endpoint
# Cache hit rate should be >80% for optimal performance
```

**Cache Clearing (if needed):**
```powershell
# Restart server to clear cache
# Or implement cache clearing endpoint for admin use
```

### 3. Database Performance & Maintenance

**Critical MongoDB Indexes (Check Monthly):**
```javascript
// Connect to MongoDB shell and verify these indexes exist:
use InventoryTest

// Users collection indexes
db.users.createIndex({ "username": 1 }, { unique: true })
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "role": 1 })

// Items collection indexes
db.items.createIndex({ "name": 1 })
db.items.createIndex({ "category": 1 })
db.items.createIndex({ "barcode": 1 }, { unique: true, sparse: true })
db.items.createIndex({ "createdAt": -1 })
db.items.createIndex({ "alertEnabled": 1, "minimumQuantity": 1 })

// Categories collection indexes
db.categories.createIndex({ "name": 1 }, { unique: true })

// AuditLogs collection indexes (for performance)
db.auditlogs.createIndex({ "timestamp": -1 })
db.auditlogs.createIndex({ "userId": 1 })
db.auditlogs.createIndex({ "action": 1 })
db.auditlogs.createIndex({ "timestamp": -1, "userId": 1 })

// Purchase Orders indexes
db.purchaseorders.createIndex({ "createdAt": -1 })
db.purchaseorders.createIndex({ "status": 1 })
db.purchaseorders.createIndex({ "createdBy": 1 })

// Internal Orders indexes
db.internalorders.createIndex({ "createdAt": -1 })
db.internalorders.createIndex({ "status": 1 })
db.internalorders.createIndex({ "requestedBy": 1 })

// Completed POs indexes
db.completedpos.createIndex({ "completedAt": -1 })
db.completedpos.createIndex({ "originalPOId": 1 })

// Notifications indexes
db.notifications.createIndex({ "userId": 1, "read": 1 })
db.notifications.createIndex({ "createdAt": -1 })
```

**Database Health Check Commands:**
```javascript
// MongoDB shell commands for maintenance

// 1. Check database size and collection stats
db.stats()
db.users.stats()
db.items.stats()
db.auditlogs.stats()

// 2. Check index usage (run monthly)
db.items.aggregate([{$indexStats:{}}])
db.users.aggregate([{$indexStats:{}}])
db.auditlogs.aggregate([{$indexStats:{}}])

// 3. Find slow queries (if profiling enabled)
db.getProfilingStatus()
db.system.profile.find().limit(5).sort({ts:-1}).pretty()

// 4. Check for unused indexes
db.runCommand({collStats: "items", indexDetails: true})
```

---

## Backup Procedures

### 1. Database Backup

**Daily Automated Backup:**
```powershell
# Create backup script for InventoryTest database:
mongodump --db=InventoryTest --out="C:\Backups\MongoDB\$(Get-Date -Format 'yyyy-MM-dd')"

# Verify backup completed successfully
if ($LASTEXITCODE -eq 0) {
    Write-Host "MongoDB backup completed successfully" -ForegroundColor Green
} else {
    Write-Host "MongoDB backup failed!" -ForegroundColor Red
}
```

**Weekly Full Database Backup with Compression:**
```powershell
# Compressed backup for archival
mongodump --db=InventoryTest --gzip --out="C:\Backups\MongoDB\Weekly\$(Get-Date -Format 'yyyy-MM-dd')"

# Clean up old backups (keep 30 days)
Get-ChildItem "C:\Backups\MongoDB" -Recurse | Where-Object {$_.CreationTime -lt (Get-Date).AddDays(-30)} | Remove-Item -Force -Recurse
```

**Critical Data Export (Items & Users):**
```powershell
# Export critical collections to JSON
mongoexport --db=InventoryTest --collection=items --out="C:\Backups\Critical\items-$(Get-Date -Format 'yyyy-MM-dd').json"
mongoexport --db=InventoryTest --collection=users --out="C:\Backups\Critical\users-$(Get-Date -Format 'yyyy-MM-dd').json"
mongoexport --db=InventoryTest --collection=categories --out="C:\Backups\Critical\categories-$(Get-Date -Format 'yyyy-MM-dd').json"
```

**Weekly Full Backup:**
```powershell
# Include file uploads and configuration
robocopy "C:\Users\branden.walker\OneDrive - School Network\Desktop\Inventory Program" "C:\Backups\Full\$(Get-Date -Format 'yyyy-MM-dd')" /MIR
```

### 2. Configuration Backup

**Environment Variables:**
```powershell
# Backup .env files (remove sensitive data for version control)
copy backend\.env "C:\Backups\Config\env-$(Get-Date -Format 'yyyy-MM-dd').backup"
```

### 3. Recovery Procedures

**Database Restore:**
```powershell
mongorestore --uri="mongodb://localhost:27017/inventory" --drop "C:\Backups\2025-09-10"
```

---

## Troubleshooting

### 1. Common Issues

**Server Won't Start:**
```powershell
# Check if port 3001 is in use
netstat -an | findstr :3001

# Kill existing Node processes
taskkill /F /IM node.exe

# Check environment variables
cd backend
node -e "console.log(process.env.MONGO_URI ? 'DB_OK' : 'DB_MISSING')"
```

**Database Connection Issues:**
```powershell
# Test MongoDB connection
mongo --eval "db.runCommand({connectionStatus: 1})"

# Check if MongoDB service is running
Get-Service | Where-Object {$_.Name -like "*mongo*"}
```

**Performance Degradation:**
```powershell
# Run performance test
cd backend
node scripts/benchmark.js

# Check system resources
Get-Process node | Select-Object Name,CPU,WorkingSet,NPM
```

### 2. Log Analysis

**Application Logs:**
```powershell
# Check console output for errors
# Monitor API response times
# Look for authentication failures
```

**Audit Log Review:**
```powershell
# Check recent user activities through admin dashboard
# Look for:
# - Failed login attempts
# - Unauthorized access attempts
# - Unusual user behavior patterns
```

---

## Emergency Procedures

### 1. Security Breach Response

**Immediate Actions:**
1. **Isolate System:**
   ```powershell
   # Stop the server
   taskkill /F /IM node.exe
   
   # Block network access if needed
   netsh advfirewall firewall add rule name="Block_Inventory_App" dir=in action=block protocol=TCP localport=3001
   ```

2. **Assess Damage:**
   - Review audit logs for unauthorized access
   - Check user accounts for modifications
   - Verify data integrity

3. **Secure System:**
   - Change all admin passwords
   - Rotate JWT secret
   - Review and update user permissions

### 2. Data Recovery

**Partial Data Loss:**
```powershell
# Restore from latest backup
mongorestore --uri="mongodb://localhost:27017/inventory" --drop "C:\Backups\[latest-date]"
```

**Complete System Recovery:**
```powershell
# Restore full system from backup
robocopy "C:\Backups\Full\[latest-date]" "C:\Users\branden.walker\OneDrive - School Network\Desktop\Inventory Program" /MIR

# Restart services
cd backend
npm install
npm start
```

### 3. Performance Crisis

**System Overload:**
```powershell
# Implement emergency rate limiting
# Restart server to clear memory leaks
# Enable cluster mode if available
```

---

## Maintenance Schedule

### Daily (5 minutes)
- [ ] Check server status
- [ ] Review error logs
- [ ] Verify system responsiveness

### Weekly (30 minutes)
- [ ] Run performance benchmark
- [ ] Review security audit logs
- [ ] Check user account status
- [ ] Verify backup integrity

### Monthly (2 hours)
- [ ] Full security audit
- [ ] Performance stress testing
- [ ] User account cleanup
- [ ] System updates and patches
- [ ] **MongoDB index optimization**
- [ ] **Database compaction and cleanup**
- [ ] **Data integrity verification**
- [ ] **Archive old audit logs (90+ days)**

### Quarterly (4 hours)
- [ ] Complete security review
- [ ] Disaster recovery testing
- [ ] Performance optimization
- [ ] Documentation updates

---

## Security Best Practices

### 1. Password Policies
- **Admin accounts**: 16+ characters, special characters required
- **Regular users**: 10+ characters minimum
- **Force password change**: All new admin accounts
- **Password rotation**: Every 90 days for admin accounts

### 2. Access Control
- **Principle of least privilege**: Users get minimum required access
- **Regular access review**: Monthly audit of user permissions
- **Account lockout**: Monitor for brute force attempts
- **Session management**: Monitor concurrent sessions

### 3. System Hardening
- **Regular updates**: Keep Node.js and dependencies updated
- **Environment security**: Secure `.env` files, limit file permissions
- **Network security**: Use HTTPS in production, implement proper CORS
- **Database security**: Use authentication, limit network access

---

## Contact Information

**System Administrator**: [Your contact information]
**Emergency Contact**: [Emergency contact information]
**Vendor Support**: [If applicable]

---

## Version Information
- **System Version**: Enterprise v1.0
- **Last Updated**: September 10, 2025
- **Performance Baseline**: 100% reliability, 95+ req/s throughput
- **Security Baseline**: JWT auth, role-based access, audit logging

---

*This guide should be reviewed and updated monthly to ensure accuracy and completeness.*

---

## Data Access in Production

### **1. Built-in Web Admin Dashboard (Primary Method)**
After deployment, access your data through the web interface:

```
https://yourapp.com/login
# Use superadmin credentials
```

**Available Admin Dashboards:**
- **Items Management**: `https://yourapp.com/admin-dashboard`
- **User Management**: `https://yourapp.com/users` (admin section)
- **Audit Logs**: `https://yourapp.com/audit-trail`
- **Custom Fields**: `https://yourapp.com/admin-custom-fields`
- **Internal Orders**: `https://yourapp.com/admin-internal-orders`
- **System Health**: `https://yourapp.com/api/health`

### **2. MongoDB Compass (Database Analysis)**
```bash
# Download MongoDB Compass from https://www.mongodb.com/products/compass
# Connect using production connection string:
# mongodb+srv://username:password@cluster.mongodb.net/InventoryTest
```

**Features:**
- Visual database exploration
- Query performance analysis
- Index management
- Real-time performance monitoring

### **3. API Access (Programmatic)**
```bash
# Get authentication token
curl -X POST https://yourapp.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"yourpassword"}'

# Access data endpoints
curl -H "Authorization: Bearer YOUR_TOKEN" https://yourapp.com/api/items
curl -H "Authorization: Bearer YOUR_TOKEN" https://yourapp.com/api/users
```

### **4. Mobile/Remote Access**
- Responsive web interface works on all devices
- Full admin functionality available remotely
- Secure HTTPS access with JWT authentication
