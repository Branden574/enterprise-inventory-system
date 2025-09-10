const express = require('express');
const router = express.Router();
const PurchaseOrder = require('../models/PurchaseOrder');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure purchase orders uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/purchase-orders/');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/purchase-orders/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

// Get all purchase orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    let query = {};
    
    // Non-admin users can only see their own purchase orders
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      query.createdBy = req.user.id;
    }
    
    // Filter by status if provided
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Filter by date range if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const purchaseOrders = await PurchaseOrder.find(query)
      .populate('items.item', 'name')
      .populate('createdBy', 'username')
      .populate('approvedBy', 'username')
      .sort('-createdAt');
    res.json(purchaseOrders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single purchase order by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id)
      .populate('items.item', 'name')
      .populate('createdBy', 'username')
      .populate('approvedBy', 'username')
      .populate('history.user', 'username');
    
    if (!purchaseOrder) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    
    res.json(purchaseOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new purchase order
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Generate order number manually as a fallback
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    // Get the count of POs for this month and increment
    const count = await PurchaseOrder.countDocuments({
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), 1),
        $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1)
      }
    });
    
    const orderNumber = `PO-${year}-${month}-${(count + 1).toString().padStart(4, '0')}`;
    
    const purchaseOrder = new PurchaseOrder({
      ...req.body,
      orderNumber: orderNumber,
      createdBy: req.user.id,
      status: 'draft'
    });
    
    // Add creation history entry
    purchaseOrder.history.push({
      action: 'created',
      user: req.user.id,
      timestamp: new Date()
    });
    
    await purchaseOrder.save();
    res.status(201).json(purchaseOrder);
  } catch (err) {
    console.error('Purchase order creation error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Update purchase order
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    
    // Store original status for history
    const originalStatus = purchaseOrder.status;
    
    // Update the purchase order
    Object.assign(purchaseOrder, req.body);
    purchaseOrder.modifiedBy = req.user.id;
    
    // Add history entry for updates
    purchaseOrder.history.push({
      action: 'updated',
      user: req.user.id,
      timestamp: new Date()
    });
    
    // If status changed, add status change history
    if (originalStatus !== purchaseOrder.status) {
      purchaseOrder.history.push({
        action: 'status_changed',
        user: req.user.id,
        previousStatus: originalStatus,
        newStatus: purchaseOrder.status,
        timestamp: new Date()
      });
      
      // If approved, set approval info
      if (purchaseOrder.status === 'approved') {
        purchaseOrder.approvedBy = req.user.id;
        purchaseOrder.approvalDate = new Date();
      }
    }
    
    await purchaseOrder.save();
    res.json(purchaseOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Change purchase order status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    console.log('=== STATUS UPDATE REQUEST ===');
    console.log('User from token:', req.user);
    console.log('Request body:', req.body);
    console.log('PO ID:', req.params.id);
    
    const { status } = req.body;
    const purchaseOrder = await PurchaseOrder.findById(req.params.id).populate('items.item');
    
    if (!purchaseOrder) {
      console.log('Purchase order not found');
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    
    console.log('Current PO status:', purchaseOrder.status);
    console.log('Requested new status:', status);
    
    // Check if user has permission to change status
    const userRole = req.user.role;
    console.log('User role:', userRole);
    
    // Staff/users can only submit for approval (draft -> pending)
    if (['user', 'staff'].includes(userRole)) {
      console.log('User is staff/user, checking draft->pending transition');
      if (!(purchaseOrder.status === 'draft' && status === 'pending')) {
        console.log('Permission denied: Invalid transition for user role');
        return res.status(403).json({ error: 'Insufficient permissions for this status change' });
      }
      console.log('Permission granted for draft->pending');
    }
    
    // Only admins/superadmins can approve or change other statuses
    if (!['admin', 'superadmin'].includes(userRole) && status !== 'pending') {
      console.log('Permission denied: Admin required for non-pending status');
      return res.status(403).json({ error: 'Admin privileges required for this action' });
    }
    
    const originalStatus = purchaseOrder.status;
    purchaseOrder.status = status;
    purchaseOrder.modifiedBy = req.user.id;
    
    // Add status change history
    purchaseOrder.history.push({
      action: 'status_changed',
      user: req.user.id,
      previousStatus: originalStatus,
      newStatus: status,
      timestamp: new Date()
    });
    
    // Add approval info if being approved
    if (status === 'approved') {
      purchaseOrder.approvedBy = req.user.id;
      purchaseOrder.approvalDate = new Date();
      
      // Update inventory quantities when approved
      const Item = require('../models/Item');
      const auditLogger = require('../middleware/auditLogger');
      
      for (const poItem of purchaseOrder.items) {
        if (poItem.item && poItem.item._id) {
          const item = await Item.findById(poItem.item._id);
          if (item) {
            const oldQuantity = item.quantity;
            item.quantity += poItem.quantity; // Add the ordered quantity
            await item.save();
            
            // Log the inventory update
            await auditLogger.logItemChange('UPDATE', item, req.user, 
              { quantity: item.quantity }, 
              { quantity: oldQuantity }, 
              req,
              `Inventory increased by ${poItem.quantity} due to approved purchase order ${purchaseOrder.orderNumber}`
            );
          }
        }
      }
    }

    // Add rejection info if being rejected
    if (status === 'rejected') {
      const { rejectionReason } = req.body;
      
      if (!rejectionReason || !rejectionReason.trim()) {
        return res.status(400).json({ error: 'Rejection reason is required when rejecting a purchase order' });
      }
      
      purchaseOrder.rejectedBy = req.user.id;
      purchaseOrder.rejectionDate = new Date();
      purchaseOrder.rejectionReason = rejectionReason.trim();
      
      // Add rejection reason to history
      purchaseOrder.history.push({
        action: 'rejected',
        user: req.user.id,
        timestamp: new Date(),
        notes: rejectionReason.trim()
      });
    }
    
    await purchaseOrder.save();
    
    // Populate user fields for response
    await purchaseOrder.populate('createdBy', 'username');
    await purchaseOrder.populate('approvedBy', 'username');
    
    res.json(purchaseOrder);
  } catch (err) {
    console.error('=== STATUS UPDATE ERROR ===');
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    console.error('Full error:', err);
    res.status(400).json({ error: err.message, details: err.toString() });
  }
});

// Upload attachments
router.post('/:id/attachments', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    if (!purchaseOrder) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    
    // Add attachment to purchase order
    purchaseOrder.attachments.push({
      filename: req.file.originalname,
      path: req.file.filename,
      uploadedAt: new Date()
    });
    
    await purchaseOrder.save();
    res.json({ message: 'File uploaded successfully', attachment: purchaseOrder.attachments[purchaseOrder.attachments.length - 1] });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete purchase order
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    if (!purchaseOrder) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    
    // Only allow deletion of draft orders
    if (purchaseOrder.status !== 'draft') {
      return res.status(400).json({ error: 'Can only delete draft purchase orders' });
    }
    
    await purchaseOrder.deleteOne();
    res.json({ message: 'Purchase order deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get printable purchase order
router.get('/:id/print', authenticateToken, async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id)
      .populate('createdBy', 'username email')
      .populate('approvedBy', 'username email')
      .populate('items.item', 'name');
    
    if (!purchaseOrder) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    
    // Generate printable HTML
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Purchase Order ${purchaseOrder.orderNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-info { margin-bottom: 20px; }
        .po-details { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .supplier-info { margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .total { text-align: right; margin-top: 20px; font-weight: bold; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
        @media print { 
          .no-print { display: none; } 
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>PURCHASE ORDER</h1>
        <h2>${purchaseOrder.orderNumber}</h2>
      </div>
      
      <div class="company-info">
        <h3>Your Company Name</h3>
        <p>Company Address<br>City, State ZIP<br>Phone: (xxx) xxx-xxxx</p>
      </div>
      
      <div class="po-details">
        <div>
          <strong>Order Date:</strong> ${new Date(purchaseOrder.createdAt).toLocaleDateString()}<br>
          <strong>Expected Delivery:</strong> ${purchaseOrder.expectedDeliveryDate ? new Date(purchaseOrder.expectedDeliveryDate).toLocaleDateString() : 'Not specified'}<br>
          <strong>Status:</strong> ${purchaseOrder.status.toUpperCase()}
        </div>
        <div>
          <strong>Created By:</strong> ${purchaseOrder.createdBy?.username || 'Unknown'}<br>
          ${purchaseOrder.approvedBy ? `<strong>Approved By:</strong> ${purchaseOrder.approvedBy.username}<br>` : ''}
          ${purchaseOrder.approvalDate ? `<strong>Approval Date:</strong> ${new Date(purchaseOrder.approvalDate).toLocaleDateString()}` : ''}
        </div>
      </div>
      
      <div class="supplier-info">
        <h3>Supplier Information</h3>
        <strong>${purchaseOrder.supplier.name}</strong><br>
        ${purchaseOrder.supplier.contactPerson ? `Contact: ${purchaseOrder.supplier.contactPerson}<br>` : ''}
        ${purchaseOrder.supplier.email ? `Email: ${purchaseOrder.supplier.email}<br>` : ''}
        ${purchaseOrder.supplier.phone ? `Phone: ${purchaseOrder.supplier.phone}<br>` : ''}
        ${purchaseOrder.supplier.address ? `Address: ${purchaseOrder.supplier.address}` : ''}
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${purchaseOrder.items.map(item => `
            <tr>
              <td>${item.item?.name || 'Item not found'}</td>
              <td>${item.quantity}</td>
              <td>$${item.unitPrice.toFixed(2)}</td>
              <td>$${(item.quantity * item.unitPrice).toFixed(2)}</td>
              <td>${item.notes || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="total">
        <h3>Total Amount: $${purchaseOrder.totalAmount.toFixed(2)}</h3>
      </div>
      
      ${purchaseOrder.deliveryAddress ? `
        <div>
          <h3>Delivery Address</h3>
          <p>${purchaseOrder.deliveryAddress}</p>
        </div>
      ` : ''}
      
      ${purchaseOrder.notes ? `
        <div>
          <h3>Notes</h3>
          <p>${purchaseOrder.notes}</p>
        </div>
      ` : ''}
      
      <div class="footer">
        <p>Generated on ${new Date().toLocaleString()}</p>
        <button class="no-print" onclick="window.print()">Print</button>
      </div>
    </body>
    </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    console.error('Print generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
