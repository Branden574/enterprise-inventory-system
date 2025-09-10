import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon
} from '@mui/icons-material';
import axios from '../utils/axios';

function InternalOrderView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const userRole = localStorage.getItem('role') || sessionStorage.getItem('role');
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`/api/internal-orders/${id}`);
      setOrder(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await axios.patch(`/api/internal-orders/${id}/status`, {
        status: 'approved'
      });
      await fetchOrder(); // Refresh the data
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve order');
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

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Order not found
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Internal Order Details
        </Typography>
        <Box>
          {isAdmin && order.status === 'pending' && (
            <Tooltip title="Approve Order">
              <IconButton 
                color="success" 
                onClick={handleApprove}
                sx={{ mr: 1 }}
              >
                <ApproveIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        {/* Order Header Info */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Order Information
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Order Number
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {order.orderNumber}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Status
              </Typography>
              <Chip 
                label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                color={getStatusColor(order.status)}
                size="small"
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Requested By
              </Typography>
              <Typography variant="body1">
                {order.requesterName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                User: {order.requestedBy?.username || 'Unknown'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Delivery Information
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Delivery Site
              </Typography>
              <Typography variant="body1">
                {order.deliverySite}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Requested Delivery Date
              </Typography>
              <Typography variant="body1">
                {new Date(order.requestedDeliveryDate).toLocaleDateString()}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Department
              </Typography>
              <Typography variant="body1">
                {order.department || 'N/A'}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Purpose */}
        {order.purpose && (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Purpose/Reason
              </Typography>
              <Typography variant="body1">
                {order.purpose}
              </Typography>
            </Box>
          </>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Items Table */}
        <Typography variant="h6" gutterBottom>
          Requested Items
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item Name</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell align="right">Requested Quantity</TableCell>
                <TableCell align="right">Available Stock</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {order.items?.map((item, index) => {
                const hasStock = item.requestedQuantity <= item.item.quantity;
                return (
                  <TableRow key={index}>
                    <TableCell>{item.item?.name || 'Unknown Item'}</TableCell>
                    <TableCell>{item.item?.sku || 'N/A'}</TableCell>
                    <TableCell align="right">{item.requestedQuantity}</TableCell>
                    <TableCell align="right">{item.item?.quantity || 0}</TableCell>
                    <TableCell>
                      <Chip 
                        label={hasStock ? 'Available' : 'Insufficient Stock'}
                        color={hasStock ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{item.notes || '-'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Additional Notes */}
        {order.notes && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              Additional Notes
            </Typography>
            <Typography variant="body1">
              {order.notes}
            </Typography>
          </>
        )}

        {/* Approval/Rejection Information */}
        {order.status === 'approved' && order.approvedBy && (
          <>
            <Divider sx={{ my: 3 }} />
            <Alert severity="success">
              <Typography variant="h6" gutterBottom>
                Order Approved
              </Typography>
              <Typography variant="body1">
                Approved by: {order.approvedBy.username}
              </Typography>
              <Typography variant="caption" display="block">
                Approval Date: {new Date(order.approvalDate).toLocaleString()}
              </Typography>
            </Alert>
          </>
        )}

        {order.status === 'rejected' && order.rejectionReason && (
          <>
            <Divider sx={{ my: 3 }} />
            <Alert severity="error">
              <Typography variant="h6" gutterBottom>
                Order Rejected
              </Typography>
              <Typography variant="body1" gutterBottom>
                {order.rejectionReason}
              </Typography>
              {order.rejectedBy && (
                <Typography variant="caption" display="block">
                  Rejected by: {order.rejectedBy.username} on{' '}
                  {new Date(order.rejectionDate).toLocaleString()}
                </Typography>
              )}
            </Alert>
          </>
        )}

        {/* Timestamps */}
        <Divider sx={{ my: 3 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Created
            </Typography>
            <Typography variant="body2">
              {new Date(order.createdAt).toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Last Updated
            </Typography>
            <Typography variant="body2">
              {new Date(order.updatedAt).toLocaleString()}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default InternalOrderView;
