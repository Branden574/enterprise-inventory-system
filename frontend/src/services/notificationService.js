// Live Notification Service with real-time updates
import { io } from 'socket.io-client';

class NotificationService {
  constructor() {
    this.socket = null;
    this.listeners = new Set();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // Initialize socket connection
  connect(token, userRole) {
    // Don't connect if no token provided
    if (!token) {
      console.log('⚠️ No token provided for socket connection, skipping...');
      return;
    }

    try {
      // Use environment variable or default to production URL
      const socketUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:5000' 
        : 'https://enterprise-inventory-system-production.up.railway.app';

      console.log('🔌 Attempting to connect to socket with token:', !!token);

      this.socket = io(socketUrl, {
        auth: { token: token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        autoConnect: true
      });

      this.socket.on('connect', () => {
        console.log('🔗 Connected to notification service');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Join user-specific room
        this.socket.emit('join-room', { userRole });
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Disconnected from notification service');
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('🔌 Socket connection error:', error.message);
        this.reconnectAttempts++;
        
        // If it's an authentication error, don't keep trying to reconnect
        if (error.message && error.message.includes('Authentication error')) {
          console.log('🔐 Socket authentication failed, stopping reconnection attempts');
          this.socket.disconnect();
          return;
        }
      });

      // Listen for different notification types
      this.socket.on('low-stock-alert', (data) => {
        this.notifyListeners({
          type: 'low-stock',
          title: '⚠️ Low Stock Alert',
          message: `${data.itemName} is running low (${data.quantity} remaining)`,
          severity: 'warning',
          timestamp: new Date(data.timestamp),
          data: data
        });
      });

      this.socket.on('order-created', (data) => {
        this.notifyListeners({
          type: 'order-created',
          title: '🛒 New Order Created',
          message: `Order #${data.orderNumber} has been created`,
          severity: 'info',
          timestamp: new Date(data.timestamp),
          data: data
        });
      });

      this.socket.on('internal-order-created', (data) => {
        this.notifyListeners({
          type: 'internal-order-created',
          title: '📋 New Internal Order',
          message: `Internal Order #${data.orderNumber} created by ${data.requestedBy || 'Unknown User'}`,
          severity: 'info',
          timestamp: new Date(data.timestamp),
          data: data
        });
      });

      this.socket.on('order-status-update', (data) => {
        const statusMessages = {
          approved: '✅ Order Approved',
          rejected: '❌ Order Rejected',
          processing: '⏳ Order Processing',
          completed: '📦 Order Completed'
        };
        
        this.notifyListeners({
          type: 'order-status',
          title: statusMessages[data.status] || '📋 Order Updated',
          message: `Your order #${data.orderNumber} has been ${data.status}`,
          severity: data.status === 'approved' || data.status === 'completed' ? 'success' : 
                   data.status === 'rejected' ? 'error' : 'info',
          timestamp: new Date(data.timestamp),
          data: data
        });
      });

      this.socket.on('internal-order-status-change', (data) => {
        const statusMessages = {
          approved: '✅ Internal Order Approved',
          rejected: '❌ Internal Order Rejected',
          completed: '📦 Internal Order Completed',
          cancelled: '⚠️ Internal Order Cancelled'
        };
        
        this.notifyListeners({
          type: 'internal-order-status',
          title: statusMessages[data.status] || '📋 Internal Order Updated',
          message: `Internal Order #${data.orderNumber} has been ${data.status}`,
          severity: data.status === 'approved' || data.status === 'completed' ? 'success' : 
                   data.status === 'rejected' || data.status === 'cancelled' ? 'error' : 'info',
          timestamp: new Date(data.timestamp),
          data: data
        });
      });

      this.socket.on('item-added', (data) => {
        this.notifyListeners({
          type: 'item-added',
          title: '📦 New Item Added',
          message: `${data.itemName} has been added to inventory`,
          severity: 'success',
          timestamp: new Date(data.timestamp),
          data: data
        });
      });

      this.socket.on('system-alert', (data) => {
        this.notifyListeners({
          type: 'system',
          title: '🔔 System Alert',
          message: data.message,
          severity: data.severity || 'info',
          timestamp: new Date(data.timestamp),
          data: data
        });
      });

    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  // Add notification listener
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  notifyListeners(notification) {
    this.listeners.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  // Emit events (for admin actions)
  emitLowStockCheck() {
    if (this.socket && this.isConnected) {
      this.socket.emit('check-low-stock');
    }
  }

  emitOrderUpdate(orderData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('order-update', orderData);
    }
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }
}

// Export singleton instance
export default new NotificationService();
