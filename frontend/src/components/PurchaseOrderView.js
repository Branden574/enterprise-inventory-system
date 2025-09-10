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
  Print as PrintIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon
} from '@mui/icons-material';
import axios from '../utils/axios';

function PurchaseOrderView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const userRole = localStorage.getItem('role') || sessionStorage.getItem('role');
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  useEffect(() => {
    fetchPurchaseOrder();
  }, [id]);

  const fetchPurchaseOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`/api/purchase-orders/${id}`);
      setPurchaseOrder(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch purchase order details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await axios.patch(`/api/purchase-orders/${id}/status`, {
        status: 'approved'
      });
      await fetchPurchaseOrder(); // Refresh the data
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve purchase order');
    }
  };

  const handlePrint = async () => {
    try {
      // Get the print-ready HTML from the backend
      const response = await axios.get(`/api/purchase-orders/${id}/print`, {
        responseType: 'text'
      });
      
      // Open a new window with the HTML content
      const printWindow = window.open('', '_blank');
      printWindow.document.write(response.data);
      printWindow.document.close();
      
      // Wait for content to load then print
      printWindow.onload = function() {
        printWindow.print();
      };
    } catch (err) {
      setError('Failed to generate print version');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'default';
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'ordered': return 'info';
      case 'partially_received': return 'secondary';
      case 'received': return 'success';
      case 'cancelled': return 'error';
      case 'rejected': return 'error';
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

  if (!purchaseOrder) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Purchase order not found
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
          Purchase Order Details
        </Typography>
        <Box>
          <Tooltip title="Print">
            <IconButton onClick={handlePrint} sx={{ mr: 1 }}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
          {isAdmin && purchaseOrder.status === 'pending' && (
            <Tooltip title="Approve">
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
        {/* Purchase Order Header Info */}
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
                {purchaseOrder.orderNumber}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Status
              </Typography>
              <Chip 
                label={purchaseOrder.status.charAt(0).toUpperCase() + purchaseOrder.status.slice(1)}
                color={getStatusColor(purchaseOrder.status)}
                size="small"
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Created By
              </Typography>
              <Typography variant="body1">
                {purchaseOrder.createdBy?.username || 'Unknown'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Supplier Information
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Supplier Name
              </Typography>
              <Typography variant="body1">
                {purchaseOrder.supplier?.name || 'N/A'}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Contact
              </Typography>
              <Typography variant="body1">
                {purchaseOrder.supplier?.contact || 'N/A'}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Expected Delivery
              </Typography>
              <Typography variant="body1">
                {purchaseOrder.expectedDelivery 
                  ? new Date(purchaseOrder.expectedDelivery).toLocaleDateString()
                  : 'N/A'
                }
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Items Table */}
        <Typography variant="h6" gutterBottom>
          Order Items
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item Name</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchaseOrder.items?.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.item?.name || 'Unknown Item'}</TableCell>
                  <TableCell>{item.item?.sku || 'N/A'}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">
                    ${item.unitPrice?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell align="right">
                    ${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={4} align="right">
                  <Typography variant="h6">Total Amount:</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="h6">
                    ${purchaseOrder.totalAmount?.toFixed(2) || '0.00'}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Notes */}
        {purchaseOrder.notes && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              Notes
            </Typography>
            <Typography variant="body1">
              {purchaseOrder.notes}
            </Typography>
          </>
        )}

        {/* Rejection Information */}
        {purchaseOrder.status === 'rejected' && purchaseOrder.rejectionReason && (
          <>
            <Divider sx={{ my: 3 }} />
            <Alert severity="error">
              <Typography variant="h6" gutterBottom>
                Rejection Reason
              </Typography>
              <Typography variant="body1">
                {purchaseOrder.rejectionReason}
              </Typography>
              {purchaseOrder.rejectedBy && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Rejected by: {purchaseOrder.rejectedBy.username} on{' '}
                  {new Date(purchaseOrder.rejectionDate).toLocaleDateString()}
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
              {new Date(purchaseOrder.createdAt).toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Last Updated
            </Typography>
            <Typography variant="body2">
              {new Date(purchaseOrder.updatedAt).toLocaleString()}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default PurchaseOrderView;
