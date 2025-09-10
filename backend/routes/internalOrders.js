const express = require('express');
const router = express.Router();
const InternalOrder = require('../models/InternalOrder');
const Item = require('../models/Item');
const { authenticateToken } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');

// Get all internal orders (admin) or user's own orders (staff)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = {};
    
    // If not admin, only show user's own orders
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      query.requestedBy = req.user.id;
    }
    
    const orders = await InternalOrder.find(query)
      .populate('requestedBy', 'username email')
      .populate('approvedBy', 'username email')
      .populate('rejectedBy', 'username email')
      .populate('fulfilledBy', 'username email')
      .populate('items.item', 'name sku quantity')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get pending internal orders (admin only)
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const orders = await InternalOrder.find({ status: 'pending' })
      .populate('requestedBy', 'username email')
      .populate('items.item', 'name sku quantity')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get single internal order
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await InternalOrder.findById(req.params.id)
      .populate('requestedBy', 'username email')
      .populate('approvedBy', 'username email')
      .populate('rejectedBy', 'username email')
      .populate('fulfilledBy', 'username email')
      .populate('items.item', 'name sku quantity');
    
    if (!order) {
      return res.status(404).json({ error: 'Internal order not found' });
    }
    
    // Users can only view their own orders unless they're admin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && 
        order.requestedBy._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Create new internal order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      requesterName,
      deliverySite,
      requestedDeliveryDate,
      department,
      purpose,
      items,
      notes
    } = req.body;
    
    // Validate items and check stock availability
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }
    
    // Check if all requested items exist and have sufficient stock
    for (const orderItem of items) {
      const item = await Item.findById(orderItem.item);
      if (!item) {
        return res.status(400).json({ error: `Item not found: ${orderItem.item}` });
      }
      
      if (orderItem.requestedQuantity > item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for ${item.name}. Available: ${item.quantity}, Requested: ${orderItem.requestedQuantity}` 
        });
      }
    }
    
    const internalOrder = new InternalOrder({
      requestedBy: req.user.id,
      requesterName,
      deliverySite,
      requestedDeliveryDate,
      department,
      purpose,
      items,
      notes
    });

    // Generate order number if not already set
    if (!internalOrder.orderNumber) {
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      
      // Find the latest order number for this month
      const latestOrder = await InternalOrder.findOne({
        orderNumber: new RegExp(`^IO-${year}-${month}-`)
      }).sort({ orderNumber: -1 });
      
      let sequence = 1;
      if (latestOrder) {
        const lastSequence = parseInt(latestOrder.orderNumber.split('-')[3]);
        if (!isNaN(lastSequence)) {
          sequence = lastSequence + 1;
        }
      }
      
      internalOrder.orderNumber = `IO-${year}-${month}-${sequence.toString().padStart(4, '0')}`;
    }

    await internalOrder.save();
    
    // Populate the saved order before returning
    const populatedOrder = await InternalOrder.findById(internalOrder._id)
      .populate('requestedBy', 'username email')
      .populate('items.item', 'name sku quantity');
    
    res.status(201).json(populatedOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update internal order status (admin only)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { status, rejectionReason } = req.body;
    const validStatuses = ['pending', 'approved', 'rejected', 'fulfilled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    if (status === 'rejected' && !rejectionReason) {
      return res.status(400).json({ error: 'Rejection reason is required when rejecting an order' });
    }
    
    const order = await InternalOrder.findById(req.params.id)
      .populate('items.item', 'name sku quantity');
    
    if (!order) {
      return res.status(404).json({ error: 'Internal order not found' });
    }
    
    // Check if status transition is valid
    if (order.status === 'fulfilled' || order.status === 'rejected') {
      return res.status(400).json({ error: 'Cannot modify completed orders' });
    }
    
    // If approving, check stock availability again
    if (status === 'approved' && order.status === 'pending') {
      for (const orderItem of order.items) {
        const currentItem = await Item.findById(orderItem.item._id);
        if (orderItem.requestedQuantity > currentItem.quantity) {
          return res.status(400).json({ 
            error: `Insufficient stock for ${currentItem.name}. Available: ${currentItem.quantity}, Requested: ${orderItem.requestedQuantity}` 
          });
        }
      }
      
      // Update inventory quantities
      for (const orderItem of order.items) {
        await Item.findByIdAndUpdate(
          orderItem.item._id,
          { $inc: { quantity: -orderItem.requestedQuantity } }
        );
      }
      
      order.approvedBy = req.user.id;
      order.approvalDate = new Date();
    }
    
    if (status === 'rejected') {
      order.rejectedBy = req.user.id;
      order.rejectionDate = new Date();
      order.rejectionReason = rejectionReason;
    }
    
    if (status === 'fulfilled') {
      order.fulfilledBy = req.user.id;
      order.fulfillmentDate = new Date();
    }
    
    order.status = status;
    await order.save();
    
    // Populate the updated order before returning
    const updatedOrder = await InternalOrder.findById(order._id)
      .populate('requestedBy', 'username email')
      .populate('approvedBy', 'username email')
      .populate('rejectedBy', 'username email')
      .populate('fulfilledBy', 'username email')
      .populate('items.item', 'name sku quantity');
    
    res.json(updatedOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete internal order (admin only or user's own pending orders)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await InternalOrder.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Internal order not found' });
    }
    
    // Check permissions
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    const isOwner = order.requestedBy.toString() === req.user.id;
    const isPending = order.status === 'pending';
    
    if (!isAdmin && (!isOwner || !isPending)) {
      return res.status(403).json({ error: 'Cannot delete this order' });
    }
    
    await InternalOrder.findByIdAndDelete(req.params.id);
    res.json({ message: 'Internal order deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
