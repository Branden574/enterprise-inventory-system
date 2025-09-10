const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Item = require('../models/Item');
const { authenticateToken } = require('../middleware/auth');
const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Get user's notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      userId: req.user._id 
    })
    .sort('-createdAt')
    .populate('itemId', 'name quantity minimumQuantity');
    
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check for low stock items and create notifications
router.post('/check-stock', authenticateToken, async (req, res) => {
  try {
    const items = await Item.find({ alertEnabled: true });
    const notifications = [];
    
    for (const item of items) {
      if (item.quantity <= item.minimumQuantity) {
        // Create notification
        const notification = new Notification({
          type: 'low_stock',
          title: 'Low Stock Alert',
          message: `${item.name} is running low (${item.quantity} remaining)`,
          itemId: item._id,
          userId: req.user._id
        });
        
        await notification.save();
        notifications.push(notification);
        
        // Send email if enabled
        if (item.alertSettings?.email && req.user.email) {
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: req.user.email,
            subject: `Low Stock Alert - ${item.name}`,
            text: `Item "${item.name}" is running low.\nCurrent quantity: ${item.quantity}\nMinimum quantity: ${item.minimumQuantity}\n\nPlease restock soon.`,
            html: `
              <h2>Low Stock Alert</h2>
              <p>Item "${item.name}" is running low.</p>
              <ul>
                <li>Current quantity: ${item.quantity}</li>
                <li>Minimum quantity: ${item.minimumQuantity}</li>
              </ul>
              <p>Please restock soon.</p>
            `
          };
          
          try {
            await transporter.sendMail(mailOptions);
            notification.emailSent = true;
            await notification.save();
          } catch (emailErr) {
            console.error('Error sending email:', emailErr);
          }
        }
      }
    }
    
    res.json({
      message: 'Stock check completed',
      notifications: notifications
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
