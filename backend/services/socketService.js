// Backend Socket.IO Service for Real-time Notifications
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Item = require('../models/Item');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
  }

  // Initialize Socket.IO server
  initialize(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ["https://enterpriseinventorysystem.netlify.app"]
          : ["http://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        console.log(`🔐 User ${decoded.id} (${decoded.role}) connected to socket`);
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
      }
    });

    // Handle connections
    this.io.on('connection', (socket) => {
      const user = socket.user;
      
      // Store user connection
      this.connectedUsers.set(user.id, {
        socket: socket,
        user: user,
        joinedAt: new Date()
      });

      console.log(`✅ User ${user.id} (${user.role}) connected. Total users: ${this.connectedUsers.size}`);

      // Join user to role-based rooms
      socket.join(`role-${user.role}`);
      socket.join(`user-${user.id}`);

      // Handle room joining
      socket.on('join-room', (data) => {
        if (data.userRole) {
          socket.join(`role-${data.userRole}`);
          console.log(`🏠 User ${user.id} joined role room: ${data.userRole}`);
        }
      });

      // Handle low stock check (admin only)
      socket.on('check-low-stock', async () => {
        if (user.role === 'admin' || user.role === 'superadmin') {
          await this.checkAndNotifyLowStock();
        }
      });

      // Handle order updates
      socket.on('order-update', (data) => {
        this.notifyOrderUpdate(data);
      });

      // Handle disconnect
      socket.on('disconnect', (reason) => {
        this.connectedUsers.delete(user.id);
        console.log(`❌ User ${user.id} disconnected: ${reason}. Remaining: ${this.connectedUsers.size}`);
      });

      // User connected successfully - just log, no notification
      console.log(`🔗 User ${user.id} (${user.role}) connected successfully`);
    });

    // Periodic low stock check (every 30 minutes)
    setInterval(() => {
      this.checkAndNotifyLowStock();
    }, 30 * 60 * 1000);

    console.log('🔔 Socket.IO notification service initialized');
  }

  // Check for low stock items and notify admins
  async checkAndNotifyLowStock() {
    try {
      const lowStockItems = await Item.find({
        $expr: { $lte: ['$quantity', 5] }, // Items with 5 or fewer remaining
        alertEnabled: true
      }).populate('category', 'name');

      lowStockItems.forEach(item => {
        // Only send alert if haven't sent one in last 24 hours
        const lastAlert = item.lastAlertSent;
        const now = new Date();
        const hoursSinceLastAlert = lastAlert ? (now - lastAlert) / (1000 * 60 * 60) : 999;

        if (hoursSinceLastAlert > 24) {
          this.notifyLowStock(item);
          
          // Update last alert sent
          Item.findByIdAndUpdate(item._id, { lastAlertSent: now }).catch(console.error);
        }
      });

    } catch (error) {
      console.error('Error checking low stock:', error);
    }
  }

  // Notify about low stock item
  notifyLowStock(item) {
    const notification = {
      type: 'low-stock-alert',
      itemId: item._id,
      itemName: item.name,
      quantity: item.quantity,
      category: item.category?.name || 'Uncategorized',
      timestamp: new Date()
    };

    // Send to all admins
    this.io.to('role-admin').emit('low-stock-alert', notification);
    this.io.to('role-superadmin').emit('low-stock-alert', notification);
    
    console.log(`⚠️ Low stock alert sent for: ${item.name} (${item.quantity} remaining)`);
  }

  // Notify when new item is added
  notifyItemAdded(item, userId) {
    const notification = {
      type: 'item-added',
      itemId: item._id,
      itemName: item.name,
      addedBy: userId,
      timestamp: new Date()
    };

    // Broadcast to all users except the one who added it
    this.connectedUsers.forEach((userData, connectedUserId) => {
      if (connectedUserId !== userId) {
        userData.socket.emit('item-added', notification);
      }
    });

    console.log(`📦 Item added notification sent: ${item.name}`);
  }

  // Notify about order status changes
  notifyOrderUpdate(orderData) {
    const notification = {
      type: 'order-status-update',
      orderNumber: orderData.orderNumber,
      status: orderData.status,
      userId: orderData.userId,
      timestamp: new Date()
    };

    // Send to specific user
    if (orderData.userId) {
      this.io.to(`user-${orderData.userId}`).emit('order-status-update', notification);
    }

    // Send to admins
    this.io.to('role-admin').emit('order-created', notification);
    this.io.to('role-superadmin').emit('order-created', notification);

    console.log(`📋 Order update notification sent: ${orderData.orderNumber} -> ${orderData.status}`);
  }

  // Notify when new order is created
  notifyNewOrder(orderData) {
    const notification = {
      type: 'order-created',
      orderNumber: orderData.orderNumber,
      createdBy: orderData.userId,
      items: orderData.items || [],
      timestamp: new Date()
    };

    // Send to all admins
    this.io.to('role-admin').emit('order-created', notification);
    this.io.to('role-superadmin').emit('order-created', notification);

    console.log(`🛒 New order notification sent: ${orderData.orderNumber}`);
  }

  // Notify when new internal order is created
  notifyNewInternalOrder(orderData) {
    const notification = {
      type: 'internal-order-created',
      orderNumber: orderData.orderNumber,
      createdBy: orderData.userId,
      items: orderData.items || [],
      departmentCode: orderData.departmentCode || 'N/A',
      requestedBy: orderData.requestedBy,
      timestamp: new Date()
    };

    // Send to all admins and tech admins
    this.io.to('role-admin').emit('internal-order-created', notification);
    this.io.to('role-superadmin').emit('internal-order-created', notification);
    this.io.to('role-techadmin').emit('internal-order-created', notification);

    console.log(`📋 New internal order notification sent: ${orderData.orderNumber}`);
  }

  // Notify when internal order status changes (approve/reject/complete)
  notifyInternalOrderStatusChange(orderData) {
    const statusMessages = {
      approved: '✅ Internal Order Approved',
      rejected: '❌ Internal Order Rejected', 
      completed: '📦 Internal Order Completed',
      cancelled: '⚠️ Internal Order Cancelled'
    };

    const notification = {
      type: 'internal-order-status-change',
      orderNumber: orderData.orderNumber,
      status: orderData.status,
      updatedBy: orderData.updatedBy,
      items: orderData.items || [],
      requestedBy: orderData.requestedBy,
      timestamp: new Date()
    };

    // Send to all admins, tech admins, and the original requester
    this.io.to('role-admin').emit('internal-order-status-change', notification);
    this.io.to('role-superadmin').emit('internal-order-status-change', notification);
    this.io.to('role-techadmin').emit('internal-order-status-change', notification);
    
    // Also send to the user who created the order
    if (orderData.createdBy) {
      const userConnection = this.connectedUsers.get(orderData.createdBy);
      if (userConnection) {
        userConnection.socket.emit('internal-order-status-change', notification);
      }
    }

    const statusTitle = statusMessages[orderData.status] || '📋 Internal Order Updated';
    console.log(`${statusTitle}: ${orderData.orderNumber}`);
  }

  // Send system-wide alert
  sendSystemAlert(message, severity = 'info') {
    const notification = {
      type: 'system-alert',
      message: message,
      severity: severity,
      timestamp: new Date()
    };

    this.io.emit('system-alert', notification);
    console.log(`📢 System alert sent: ${message}`);
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get Socket.IO instance
  getIO() {
    return this.io;
  }
}

// Export singleton instance
module.exports = new SocketService();
