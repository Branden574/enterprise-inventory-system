import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  Box,
  Typography,
  Slide,
  Fade,
  IconButton,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsIcon from '@mui/icons-material/Notifications';
import notificationService from '../services/notificationService';

// Custom transition for notifications
function SlideTransition(props) {
  return <Slide {...props} direction="down" />;
}

function LiveNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [currentNotification, setCurrentNotification] = useState(null);

  useEffect(() => {
    // Subscribe to notifications
    const unsubscribe = notificationService.addListener((notification) => {
      const notificationWithId = {
        ...notification,
        id: Date.now() + Math.random(), // Unique ID
        timestamp: notification.timestamp || new Date()
      };

      // Add to notifications list
      setNotifications(prev => [notificationWithId, ...prev].slice(0, 50)); // Keep last 50

      // Show as current notification
      setCurrentNotification(notificationWithId);
    });

    return unsubscribe;
  }, []);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setCurrentNotification(null);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <>
      {/* Toast Notification */}
      <Snackbar
        open={Boolean(currentNotification)}
        autoHideDuration={4000} // 4 seconds - good standard duration
        onClose={handleClose}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ 
          mt: 8, // Account for navbar height
          zIndex: 9999
        }}
      >
        {currentNotification && (
          <Alert
            onClose={handleClose}
            severity={currentNotification.severity}
            variant="filled"
            action={
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={handleClose}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
            sx={{
              minWidth: 350,
              maxWidth: 500,
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {currentNotification.title}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                {currentNotification.message}
              </Typography>
              <Typography variant="caption" color="inherit" sx={{ opacity: 0.9 }}>
                {formatTimestamp(currentNotification.timestamp)}
              </Typography>
            </Box>
          </Alert>
        )}
      </Snackbar>

      {/* Notification History (could be shown in a drawer/modal) */}
      {/* For now, we'll just keep them in state for potential future use */}
    </>
  );
}

export default LiveNotifications;
