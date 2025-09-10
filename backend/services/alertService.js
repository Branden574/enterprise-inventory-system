const cron = require('node-cron');
const Item = require('../models/Item');
const Notification = require('../models/Notification');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Check for low stock items and send alerts
const checkLowStockItems = async () => {
  try {
    console.log('Running low stock check...');
    
    // Find items that are below 10 quantity and have alerts enabled
    const lowStockItems = await Item.find({
      quantity: { $lt: 10 }, // Less than 10
      alertEnabled: true,
      $or: [
        { lastAlertSent: { $exists: false } },
        { lastAlertSent: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // 24 hours ago
      ]
    });

    if (lowStockItems.length === 0) {
      console.log('No low stock items found');
      return;
    }

    console.log(`Found ${lowStockItems.length} low stock items`);

    // Get all admin and superadmin users
    const adminUsers = await User.find({ 
      role: { $in: ['admin', 'superadmin'] }
    });

    for (const item of lowStockItems) {
      // Create notifications for each admin user
      for (const user of adminUsers) {
        const existingNotification = await Notification.findOne({
          itemId: item._id,
          userId: user._id,
          type: 'low_stock',
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        });

        if (!existingNotification) {
          const notification = new Notification({
            type: 'low_stock',
            title: 'Low Stock Alert',
            message: `${item.name} is running low (${item.quantity} remaining, threshold: 10)`,
            itemId: item._id,
            userId: user._id
          });

          await notification.save();

          // Send email notification if enabled
          if (item.alertSettings?.email && user.email) {
            try {
              const mailOptions = {
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: `Low Stock Alert - ${item.name}`,
                text: `Item "${item.name}" is running low.\nCurrent quantity: ${item.quantity}\nStock threshold: 10\nLocation: ${item.location || 'Not specified'}\n\nPlease restock soon.`,
                html: `
                  <h2>Low Stock Alert</h2>
                  <p>Item "<strong>${item.name}</strong>" is running low.</p>
                  <table style="border-collapse: collapse; margin: 20px 0;">
                    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Current quantity:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${item.quantity}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Stock threshold:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">10</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Location:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${item.location || 'Not specified'}</td></tr>
                  </table>
                  <p>Please restock soon.</p>
                `
              };

              await transporter.sendMail(mailOptions);
              notification.emailSent = true;
              await notification.save();
              console.log(`Email sent to ${user.email} for item ${item.name}`);
            } catch (emailErr) {
              console.error('Error sending email:', emailErr);
            }
          }
        }
      }

      // Update last alert sent time
      item.lastAlertSent = new Date();
      await item.save();
    }

    console.log('Low stock check completed');
  } catch (err) {
    console.error('Error in low stock check:', err);
  }
};

// Schedule to run every hour
const startLowStockMonitoring = () => {
  cron.schedule('0 * * * *', checkLowStockItems); // Run every hour
  console.log('Low stock monitoring scheduled to run every hour');
  
  // Run once on startup after 30 seconds
  setTimeout(checkLowStockItems, 30000);
};

module.exports = {
  checkLowStockItems,
  startLowStockMonitoring
};
