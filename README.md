# 📦 Enterprise Inventory Management System

> A comprehensive, modern inventory management web application designed for organizational use with advanced features including barcode scanning, purchase order management, internal ordering, and audit trails.

![System Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![Version](https://img.shields.io/badge/Version-2.0-blue)
![License](https://img.shields.io/badge/License-Enterprise-orange)

## 🌟 Key Features

### 📋 **Core Inventory Management**
- **Item Catalog**: Complete item database with categories, photos, and custom fields
- **Real-time Search**: Instant search across all item properties
- **Advanced Filtering**: Filter by categories, custom fields, and other criteria
- **Barcode Integration**: Scan barcodes/QR codes for quick item lookup and addition
- **Bulk Operations**: Import/export capabilities for large datasets

### 👥 **User Management & Security**
- **Role-Based Access Control**: Super Admin, Admin, Manager, and Staff roles
- **Secure Authentication**: JWT-based authentication with session management
- **User Activity Tracking**: Comprehensive audit logs for all user actions
- **Password Security**: Encrypted password storage with change tracking

### 🛒 **Purchase Order System**
- **PO Creation & Management**: Create, edit, and track purchase orders
- **Approval Workflows**: Multi-level approval process for purchase requests
- **File Attachments**: Upload supporting documents and receipts
- **Status Tracking**: Monitor PO progress from creation to completion
- **Third-Party Integration**: Upload completed POs from external vendors (Amazon, etc.)

### 📨 **Internal Order Management**
- **Staff Requests**: Staff can request items from existing inventory
- **Admin Approval**: Managers approve/deny internal order requests
- **Automatic Inventory Updates**: Approved orders automatically adjust inventory levels
- **Request Tracking**: Full visibility of internal order status

### 🎛️ **Custom Fields & Configuration**
- **Flexible Data Model**: Create custom fields for any data type
- **Field Types**: Text, Number, Date, and Dropdown field support
- **Default Values**: Pre-populate fields with common values
- **Required Field Validation**: Ensure data completeness

### 📊 **Reporting & Analytics**
- **Audit Trail**: Complete activity logs with user tracking
- **Export Capabilities**: CSV export for external analysis
- **Dashboard Views**: Real-time overview of inventory status
- **Activity Monitoring**: Track all system interactions

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│   React.js      │◄──►│   Node.js       │◄──►│    MongoDB      │
│   Material-UI   │    │   Express.js    │    │    GridFS       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 📁 **Project Structure**
```
Inventory Program/
├── frontend/                 # React.js Application
│   ├── src/
│   │   ├── components/      # UI Components
│   │   ├── utils/          # Helper Functions
│   │   └── theme.js        # Material-UI Theme
│   ├── public/             # Static Assets
│   └── build/              # Production Build
├── backend/                # Node.js API Server
│   ├── models/             # Database Models
│   ├── routes/             # API Endpoints
│   ├── middleware/         # Authentication & Logging
│   ├── services/           # Business Logic
│   ├── scripts/            # Utility Scripts
│   └── uploads/            # File Storage
└── README.md               # This File
```

## 🚀 Installation & Setup

### 📋 **Prerequisites**
- Node.js (v16.0 or higher)
- MongoDB (v4.4 or higher)
- Git
- Modern web browser (Chrome, Firefox, Safari, Edge)

### 🔧 **Backend Setup**

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the backend directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/inventory
   JWT_SECRET=your-super-secret-jwt-key-here
   NODE_ENV=production
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB service
   mongod
   
   # Create initial super admin (run once)
   node scripts/create-superadmin.js
   ```

5. **Start the backend server**
   ```bash
   npm start
   ```
   Backend will be available at `http://localhost:5000`

### 🎨 **Frontend Setup**

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the frontend directory:
   ```env
   REACT_APP_API_URL=http://localhost:5000
   REACT_APP_VERSION=2.0
   ```

4. **Start the frontend application**
   ```bash
   npm start
   ```
   Frontend will be available at `http://localhost:3000`

### 🏭 **Production Deployment**

1. **Build frontend for production**
   ```bash
   cd frontend
   npm run build
   ```

2. **Configure reverse proxy** (nginx example)
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           root /path/to/frontend/build;
           try_files $uri /index.html;
       }
       
       location /api {
           proxy_pass http://localhost:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## 👤 **User Roles & Permissions**

### 🔱 **Super Admin**
- Full system access
- User management (create, edit, delete users)
- System configuration
- Database management
- Audit log access

### 👨‍💼 **Admin**
- Inventory management (full CRUD)
- Purchase order approval
- Internal order management
- User oversight (limited)
- Reports and analytics

### 📊 **Manager**
- Inventory viewing and editing
- Purchase order creation
- Internal order approval
- Team activity monitoring

### 👨‍💻 **Staff**
- Inventory viewing
- Internal order requests
- Purchase order requests
- Basic reporting

## 📱 **User Guide**

### 🔐 **Getting Started**

1. **Login**: Navigate to the application and login with your credentials
2. **Dashboard**: View system overview and recent activity
3. **Navigation**: Use the sidebar menu to access different modules

### 📦 **Managing Inventory**

#### ➕ **Adding Items**
1. Click the **"+"** button (floating action button)
2. Fill in item details:
   - **Name**: Item description
   - **Quantity**: Current stock level
   - **Location**: Physical location/storage
   - **Category**: Item classification
   - **Notes**: Additional information
   - **Photo**: Upload item image
   - **Custom Fields**: Additional data as configured
3. **Barcode Scanning**: Use camera to scan barcodes for quick entry
4. Click **"Save"** to add the item

#### ✏️ **Editing Items**
1. Find the item using search or browse
2. Click the **edit icon** (pencil)
3. Modify the desired fields
4. Click **"Update"** to save changes

#### 🔍 **Searching Items**
- **Quick Search**: Type in the search box at the top
- **Category Filter**: Select category from dropdown
- **Advanced Filter**: Use custom field filters
- **Barcode Lookup**: Scan barcode to find specific items

### 🛒 **Purchase Orders**

#### 📝 **Creating Purchase Orders**
1. Navigate to **"Purchase Orders"** in the menu
2. Click **"Create New PO"**
3. Fill in PO details:
   - **PO Number**: Unique identifier
   - **Vendor**: Supplier information
   - **Items**: Add items and quantities
   - **Total Amount**: Cost calculation
   - **Due Date**: Expected delivery
   - **Notes**: Special instructions
4. **Submit for Approval**

#### ✅ **Approving Purchase Orders**
1. Go to **"PO Requests"** (Admin/Manager only)
2. Review PO details
3. **Approve** or **Reject** with comments
4. Approved POs are sent to vendors

#### 📄 **Completed PO Management**
1. Navigate to **"Completed POs"**
2. Click **"Add New Completed PO"**
3. Upload receipts/invoices from third-party vendors
4. Fill in completion details
5. Files are accessible to all authorized users

### 📨 **Internal Orders**

#### 🙋 **Requesting Items (Staff)**
1. Go to **"Internal Orders"**
2. Click **"Request Items"**
3. Select items from inventory
4. Specify quantities needed
5. Add justification/notes
6. Submit request

#### ✅ **Managing Requests (Admin/Manager)**
1. Navigate to **"Order Requests"**
2. Review pending requests
3. Check inventory availability
4. **Approve** or **Deny** with reason
5. Approved requests automatically update inventory

### ⚙️ **System Configuration**

#### 👥 **User Management** (Admin/Super Admin)
1. Go to **"User Management"**
2. **Add Users**: Create new accounts with appropriate roles
3. **Edit Users**: Modify user details and permissions
4. **Reset Passwords**: Help users with login issues

#### 🏷️ **Categories**
1. Navigate to **"Categories"**
2. **Create Categories**: Organize inventory by type
3. **Edit Categories**: Modify existing classifications
4. **Assign Items**: Link items to appropriate categories

#### 🎛️ **Custom Fields**
1. Go to **"Custom Fields"**
2. **Create Fields**: Add new data fields
   - Choose field type (Text, Number, Date, Dropdown)
   - Set default values
   - Mark as required if needed
3. **Configure Options**: For dropdown fields, set available choices
4. Fields appear in item creation/editing forms

### 📊 **Reports & Analytics**

#### 📋 **Audit Trail**
1. Navigate to **"Audit Trail"**
2. View all system activities
3. **Filter by**:
   - User
   - Date range
   - Activity type
   - Entity (items, users, POs)

#### 📤 **Data Export**
1. Go to **"Import/Export"**
2. **Export Options**:
   - All inventory data
   - Filtered results
   - Custom date ranges
3. **Import Options**:
   - Bulk item upload
   - User import
   - Category import

## 🔧 **Administrative Tasks**

### 👨‍💻 **Creating the First Admin User**
```bash
cd backend
node scripts/create-superadmin.js
```

### 🔄 **Database Backup**
```bash
# Create backup
mongodump --db inventory --out backup/

# Restore backup
mongorestore backup/inventory
```

### 📝 **Updating User Passwords**
```bash
cd backend
node scripts/update-user-password-change.js
```

### 🧹 **File Cleanup**
```bash
# Clean temporary files
cd backend
node scripts/cleanup-uploads.js
```

## 🔧 **Troubleshooting**

### 🚫 **Common Issues**

#### **Backend Won't Start**
- Check MongoDB is running: `mongod --version`
- Verify port 5000 is available: `netstat -an | grep 5000`
- Check environment variables in `.env` file

#### **Frontend Connection Issues**
- Verify backend is running on port 5000
- Check CORS configuration in backend
- Confirm `REACT_APP_API_URL` in frontend `.env`

#### **Authentication Problems**
- Clear browser localStorage/sessionStorage
- Check JWT_SECRET is consistent
- Verify user exists in database

#### **File Upload Issues**
- Check `uploads/` directory permissions
- Verify disk space availability
- Confirm file size limits (10MB default)

### 📞 **Getting Help**

1. **Check Logs**:
   - Backend: Console output or log files
   - Frontend: Browser developer console
   - Database: MongoDB logs

2. **Verify Configuration**:
   - Environment variables
   - Database connection
   - Port availability

3. **Test Components**:
   - API endpoints with Postman
   - Database queries with MongoDB Compass
   - Frontend components individually

## 🔒 **Security Considerations**

### 🛡️ **Best Practices**
- **Strong Passwords**: Enforce password complexity
- **Regular Updates**: Keep dependencies current
- **Access Control**: Assign minimum required permissions
- **Audit Monitoring**: Review activity logs regularly
- **Backup Strategy**: Implement regular data backups
- **SSL/HTTPS**: Use encryption in production
- **Input Validation**: All user inputs are sanitized
- **Rate Limiting**: API endpoints have request limits

### 📋 **Compliance Features**
- **Audit Trail**: Complete activity logging
- **Data Export**: Full data portability
- **User Tracking**: All actions tied to specific users
- **Change History**: Previous values stored for rollback

## 🚀 **Future Enhancements**

### 📈 **Planned Features**
- [ ] Mobile application (iOS/Android)
- [ ] Advanced analytics dashboard
- [ ] Integration with external ERP systems
- [ ] Automated reorder points
- [ ] Multi-location support
- [ ] Advanced reporting tools
- [ ] API webhooks for external integrations

### 🔧 **Technical Improvements**
- [ ] Real-time notifications
- [ ] Offline capability
- [ ] Performance optimization
- [ ] Advanced search with Elasticsearch
- [ ] Containerization with Docker
- [ ] Microservices architecture

## 📞 **Support & Contact**

For technical support, system administration, or feature requests:

- **System Administrator**: [Your IT Department]
- **Documentation**: This README file
- **Issue Tracking**: [Internal Ticket System]
- **Training Resources**: [Internal Training Portal]

---

## 📄 **License**

This inventory management system is proprietary software developed for internal organizational use. All rights reserved.

**Version**: 2.0  
**Last Updated**: September 10, 2025  
**Maintained By**: IT Department

---

*This system represents a comprehensive solution for modern inventory management, designed to streamline operations and provide complete visibility into organizational assets.*
