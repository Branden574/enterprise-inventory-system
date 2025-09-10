import React, { useState, useEffect } from 'react';
import {
  Badge,
  Box,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemText,
  Typography,
  Divider,
  Button,
  CircularProgress,
  ListItemIcon,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from '../utils/axios';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/notifications');
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      await fetchNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.put('/api/notifications/mark-all-read');
      await fetchNotifications();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      await fetchNotifications();
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ width: 360, maxHeight: 480 }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Notifications</Typography>
            {unreadCount > 0 && (
              <Button size="small" onClick={handleMarkAllRead}>
                Mark all read
              </Button>
            )}
          </Box>
          <Divider />
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">No notifications</Typography>
            </Box>
          ) : (
            <List sx={{ maxHeight: 400, overflowY: 'auto' }}>
              {notifications.map((notification) => (
                <ListItem
                  key={notification._id}
                  sx={{
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleDelete(notification._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemIcon>
                    {notification.type === 'low_stock' ? (
                      <WarningAmberIcon color="warning" />
                    ) : (
                      <CheckCircleIcon color="success" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={notification.title}
                    secondary={
                      <>
                        <Typography variant="body2" component="span" display="block">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(notification.createdAt).toLocaleString()}
                        </Typography>
                      </>
                    }
                    onClick={() => !notification.read && handleMarkAsRead(notification._id)}
                    sx={{ cursor: notification.read ? 'default' : 'pointer' }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Popover>
    </>
  );
}

export default Notifications;
