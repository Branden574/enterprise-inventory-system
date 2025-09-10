const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

// Middleware to check admin access
const isAdminOrSuperAdmin = (req, res, next) => {
  if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Get audit logs (admin only)
router.get('/', authenticateToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      entityType,
      userId,
      startDate,
      endDate,
      search
    } = req.query;

    // Build filter
    const filter = {};
    
    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;
    if (userId) filter.userId = userId;
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { userEmail: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get audit logs with user population
    const auditLogs = await AuditLog.find(filter)
      .populate('userId', 'email firstName lastName role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await AuditLog.countDocuments(filter);

    res.json({
      auditLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Error fetching audit logs' });
  }
});

// Get audit log statistics (admin only)
router.get('/stats', authenticateToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) dateFilter.timestamp.$gte = new Date(startDate);
      if (endDate) dateFilter.timestamp.$lte = new Date(endDate);
    }

    // Get action statistics
    const actionStats = await AuditLog.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get entity type statistics
    const entityStats = await AuditLog.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$entityType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get user activity statistics
    const userStats = await AuditLog.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$userId',
          userEmail: { $first: '$userEmail' },
          userRole: { $first: '$userRole' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get daily activity for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyActivity = await AuditLog.aggregate([
      {
        $match: {
          timestamp: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      actionStats,
      entityStats,
      userStats,
      dailyActivity
    });
  } catch (error) {
    console.error('Error fetching audit statistics:', error);
    res.status(500).json({ message: 'Error fetching audit statistics' });
  }
});

// Get recent activity for dashboard
router.get('/recent', authenticateToken, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const recentActivity = await AuditLog.find()
      .populate('userId', 'email firstName lastName role')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json(recentActivity);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ message: 'Error fetching recent activity' });
  }
});

module.exports = router;
