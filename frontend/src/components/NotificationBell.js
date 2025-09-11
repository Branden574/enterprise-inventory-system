import React, { useState, useEffect } from 'react';
import { 
  IconButton, 
  Badge, 
  Menu, 
  MenuItem, 
  Typography, 
  Box, 
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Fade,
  Zoom
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import { keyframes } from '@mui/system';
import notificationService from '../services/notificationService';

// Animation for the notification badge
const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

// Animation for new notifications
const bounceAnimation = keyframes`
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
`;

const NotificationBell = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  useEffect(() => {
    // Initialize notification service
    notificationService.connect();
    
    // Load existing notifications from localStorage
    const savedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    setNotifications(savedNotifications);
    updateUnreadCount(savedNotifications);

    // Listen for new notifications
    const handleNewNotification = (notification) => {
      const newNotification = {
        id: Date.now(),
        ...notification,
        timestamp: new Date().toISOString(),
        read: false
      };

      setNotifications(prev => {
        const updated = [newNotification, ...prev].slice(0, 50); // Keep only last 50 notifications
        localStorage.setItem('notifications', JSON.stringify(updated));
        return updated;
      });

      // Trigger animation
      setHasNewNotification(true);
      setTimeout(() => setHasNewNotification(false), 3000);
    };

    // Subscribe to notification events
    notificationService.onLowStock(handleNewNotification);
    notificationService.onItemAdded(handleNewNotification);
    notificationService.onNewPurchaseOrder(handleNewNotification);
    notificationService.onNewInternalOrder(handleNewNotification);
    notificationService.onOrderStatusChange(handleNewNotification);
    notificationService.onInternalOrderStatusChange(handleNewNotification);

    return () => {
      // Cleanup listeners would go here if the service had removeListener methods
    };
  }, []);

  useEffect(() => {
    updateUnreadCount(notifications);
  }, [notifications]);

  const updateUnreadCount = (notificationList) => {
    const count = notificationList.filter(n => !n.read).length;
    setUnreadCount(count);
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      localStorage.setItem('notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem('notifications', JSON.stringify(updated));
      return updated;
    });
    handleClose();
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.removeItem('notifications');
    handleClose();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'low-stock':
        return <WarningIcon fontSize="small" sx={{ color: '#ff9800' }} />;
      case 'item-added':
        return <InventoryIcon fontSize="small" sx={{ color: '#4caf50' }} />;
      case 'purchase-order':
      case 'internal-order':
        return <ShoppingCartIcon fontSize="small" sx={{ color: '#2196f3' }} />;
      case 'order-status':
        return <CheckCircleIcon fontSize="small" sx={{ color: '#4caf50' }} />;
      default:
        return <InfoIcon fontSize="small" sx={{ color: '#607d8b' }} />;
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{
          position: 'relative',
          animation: hasNewNotification ? `${bounceAnimation} 0.6s ease-in-out` : 'none'
        }}
      >
        <Badge
          badgeContent={unreadCount}
          color="error"
          max={99}
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.75rem',
              height: '18px',
              minWidth: '18px',
              animation: unreadCount > 0 ? `${pulseAnimation} 2s ease-in-out infinite` : 'none',
              transform: 'scale(1) translate(50%, -50%)',
              transformOrigin: '100% 0%'
            }
          }}
        >
          {unreadCount > 0 ? (
            <NotificationsActiveIcon 
              sx={{ 
                color: '#ff5722',
                filter: 'drop-shadow(0 0 4px rgba(255, 87, 34, 0.3))'
              }} 
            />
          ) : (
            <NotificationsIcon />
          )}
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        elevation={3}
        PaperProps={{
          sx: {
            minWidth: 350,
            maxWidth: 400,
            maxHeight: 500,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        TransitionComponent={Fade}
        transitionDuration={200}
      >
        {/* Header */}
        <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: '8px 8px 0 0' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
              Notifications
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              {unreadCount} unread
            </Typography>
          </Box>
          {notifications.length > 0 && (
            <Box display="flex" gap={1} mt={1}>
              {unreadCount > 0 && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    cursor: 'pointer', 
                    color: '#1976d2',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                  onClick={markAllAsRead}
                >
                  Mark all read
                </Typography>
              )}
              <Typography 
                variant="caption" 
                sx={{ 
                  cursor: 'pointer', 
                  color: '#d32f2f',
                  '&:hover': { textDecoration: 'underline' }
                }}
                onClick={clearAllNotifications}
              >
                Clear all
              </Typography>
            </Box>
          )}
        </Paper>

        <Divider />

        {/* Notifications List */}
        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <MenuItem disabled>
              <Box textAlign="center" py={3} width="100%">
                <NotificationsIcon sx={{ fontSize: 48, color: '#bbb', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No notifications yet
                </Typography>
              </Box>
            </MenuItem>
          ) : (
            notifications.map((notification) => (
              <MenuItem
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                sx={{
                  py: 1.5,
                  px: 2,
                  borderLeft: notification.read ? 'none' : '3px solid #1976d2',
                  backgroundColor: notification.read ? 'transparent' : 'rgba(25, 118, 210, 0.04)',
                  '&:hover': {
                    backgroundColor: notification.read ? 'rgba(0, 0, 0, 0.04)' : 'rgba(25, 118, 210, 0.08)'
                  },
                  display: 'block',
                  whiteSpace: 'normal'
                }}
              >
                <Box display="flex" alignItems="flex-start" gap={1.5}>
                  <Box mt={0.5}>
                    {getNotificationIcon(notification.type)}
                  </Box>
                  <Box flex={1}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: notification.read ? 400 : 600,
                        mb: 0.5,
                        lineHeight: 1.4
                      }}
                    >
                      {notification.message}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                    >
                      {formatTimeAgo(notification.timestamp)}
                    </Typography>
                  </Box>
                  {!notification.read && (
                    <Zoom in={!notification.read}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: '#1976d2',
                          mt: 1
                        }}
                      />
                    </Zoom>
                  )}
                </Box>
              </MenuItem>
            ))
          )}
        </Box>
      </Menu>
    </>
  );
};

export default NotificationBell;
