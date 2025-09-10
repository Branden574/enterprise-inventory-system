import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from '../utils/axios';

function OrderRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/internal-orders/pending');
      setRequests(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch order requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (orderId) => {
    try {
      setError('');
      await axios.patch(`/api/internal-orders/${orderId}/status`, {
        status: 'approved'
      });
      
      // Remove from pending list
      setRequests(prev => prev.filter(req => req._id !== orderId));
      
      // Show success message
      setError('');
      // You might want to show a success message here
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve order');
    }
  };

  const openRejectDialog = (order) => {
    setSelectedOrder(order);
    setRejectDialog(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    try {
      setError('');
      await axios.patch(`/api/internal-orders/${selectedOrder._id}/status`, {
        status: 'rejected',
        rejectionReason: rejectReason
      });
      
      // Remove from pending list
      setRequests(prev => prev.filter(req => req._id !== selectedOrder._id));
      
      // Close dialog and reset
      setRejectDialog(false);
      setRejectReason('');
      setSelectedOrder(null);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject order');
    }
  };

  const getTotalQuantity = (items) => {
    return items.reduce((total, item) => total + item.requestedQuantity, 0);
  };

  const checkStockAvailability = (items) => {
    for (const item of items) {
      if (item.requestedQuantity > item.item.quantity) {
        return false;
      }
    }
    return true;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading order requests...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Order Requests
        </Typography>
        <IconButton onClick={fetchPendingRequests}>
          <RefreshIcon />
        </IconButton>
      </Box>

      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Manage pending internal order requests from staff
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {requests.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No pending order requests
          </Typography>
          <Typography color="text.secondary">
            All internal orders are either approved or processed
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order Number</TableCell>
                <TableCell>Requester</TableCell>
                <TableCell>Delivery Site</TableCell>
                <TableCell>Requested Date</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Stock Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((order) => {
                const hasStock = checkStockAvailability(order.items);
                return (
                  <TableRow key={order._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {order.orderNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{order.requesterName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        by {order.requestedBy?.username}
                      </Typography>
                    </TableCell>
                    <TableCell>{order.deliverySite}</TableCell>
                    <TableCell>
                      {new Date(order.requestedDeliveryDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {order.items.length} items
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({getTotalQuantity(order.items)} total qty)
                      </Typography>
                    </TableCell>
                    <TableCell>{order.department || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={hasStock ? 'Available' : 'Insufficient Stock'}
                        color={hasStock ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Approve">
                        <IconButton 
                          color="success" 
                          onClick={() => handleApprove(order._id)}
                          disabled={!hasStock}
                          sx={{ mr: 1 }}
                        >
                          <ApproveIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <IconButton 
                          color="error" 
                          onClick={() => openRejectDialog(order)}
                          sx={{ mr: 1 }}
                        >
                          <RejectIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View Details">
                        <IconButton 
                          onClick={() => navigate(`/internal-orders/view/${order._id}`)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Reject Dialog */}
      <Dialog 
        open={rejectDialog} 
        onClose={() => setRejectDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Order Request</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to reject order request <strong>{selectedOrder?.orderNumber}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Requester: {selectedOrder?.requesterName}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for Rejection"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Please provide a detailed reason for rejecting this order request..."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setRejectDialog(false);
            setRejectReason('');
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleReject} 
            color="error" 
            variant="contained"
            disabled={!rejectReason.trim()}
          >
            Reject Order
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default OrderRequests;
