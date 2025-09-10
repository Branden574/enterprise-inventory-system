import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Tabs,
  Tab
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from '../utils/axios';

function AdminInternalOrders() {
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [currentTab, setCurrentTab] = useState(0);

  // Determine initial tab based on URL
  useEffect(() => {
    if (location.pathname.includes('pending')) {
      setCurrentTab(0); // Pending requests
    } else if (location.pathname.includes('all')) {
      setCurrentTab(1); // All orders
    }
  }, [location.pathname]);

  useEffect(() => {
    fetchOrders();
  }, [currentTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      let endpoint;
      if (currentTab === 0) {
        endpoint = '/api/internal-orders/pending';
      } else {
        endpoint = '/api/internal-orders'; // All orders (admin view)
      }
      
      console.log('AdminInternalOrders: Fetching from endpoint:', endpoint);
      console.log('AdminInternalOrders: Current tab:', currentTab);
      
      const response = await axios.get(endpoint);
      console.log('AdminInternalOrders: Response received:', response.data);
      setOrders(response.data);
    } catch (err) {
      console.error('AdminInternalOrders: Error fetching orders:', err);
      console.error('AdminInternalOrders: Error response:', err.response?.data);
      console.error('AdminInternalOrders: Error status:', err.response?.status);
      setError(err.response?.data?.error || 'Failed to fetch internal orders');
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
      
      // Refresh the orders list
      await fetchOrders();
      
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
      
      // Refresh the orders list
      await fetchOrders();
      
      // Close dialog and reset
      setRejectDialog(false);
      setRejectReason('');
      setSelectedOrder(null);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject order');
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    // Update URL based on tab
    if (newValue === 0) {
      navigate('/internal-orders/pending');
    } else {
      navigate('/internal-orders/all');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'fulfilled': return 'info';
      default: return 'default';
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
        <Typography>Loading internal orders...</Typography>
      </Box>
    );
  }

  const filteredOrders = currentTab === 0 
    ? orders.filter(order => order.status === 'pending')
    : orders;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Internal Orders Management
        </Typography>
        <IconButton onClick={fetchOrders}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label={`Pending Requests (${orders.filter(o => o.status === 'pending').length})`} />
          <Tab label={`All Orders (${orders.length})`} />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {filteredOrders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            {currentTab === 0 ? 'No pending requests' : 'No internal orders found'}
          </Typography>
          <Typography color="text.secondary">
            {currentTab === 0 
              ? 'All internal orders are either approved or processed'
              : 'No internal orders have been created yet'
            }
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
                <TableCell>Status</TableCell>
                {currentTab === 0 && <TableCell>Stock Status</TableCell>}
                <TableCell>Created</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.map((order) => {
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
                        label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        color={getStatusColor(order.status)}
                        size="small"
                      />
                    </TableCell>
                    {currentTab === 0 && (
                      <TableCell>
                        <Chip 
                          label={hasStock ? 'Available' : 'Insufficient Stock'}
                          color={hasStock ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
                      {order.status === 'pending' && (
                        <>
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
                        </>
                      )}
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
        <DialogTitle>Reject Internal Order</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to reject internal order <strong>{selectedOrder?.orderNumber}</strong>?
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
            placeholder="Please provide a detailed reason for rejecting this internal order..."
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

export default AdminInternalOrders;
