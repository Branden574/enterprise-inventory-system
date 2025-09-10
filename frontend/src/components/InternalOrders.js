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
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from '../utils/axios';

function InternalOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/internal-orders');
      setOrders(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch internal orders');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading internal orders...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          My Internal Orders
        </Typography>
        <Box>
          <IconButton onClick={fetchOrders} sx={{ mr: 1 }}>
            <RefreshIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/internal-orders/new')}
          >
            New Order Request
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {orders.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No internal orders found
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            You haven't created any internal order requests yet.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/internal-orders/new')}
          >
            Create Your First Order Request
          </Button>
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
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {order.orderNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>{order.requesterName}</TableCell>
                  <TableCell>{order.deliverySite}</TableCell>
                  <TableCell>
                    {new Date(order.requestedDeliveryDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {order.items.length} items ({getTotalQuantity(order.items)} total)
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton 
                        onClick={() => navigate(`/internal-orders/view/${order._id}`)}
                        size="small"
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default InternalOrders;
