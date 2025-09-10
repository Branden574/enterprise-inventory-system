import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  Tooltip,
  Menu,
  MenuItem
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';

function PORequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPO, setSelectedPO] = useState(null);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/purchase-orders');
      
      // Filter for pending requests only
      const pendingRequests = response.data.filter(po => po.status === 'pending');
      setRequests(pendingRequests);
    } catch (err) {
      console.error('Failed to fetch PO requests:', err);
      setError('Failed to load purchase order requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (poId) => {
    try {
      await axios.patch(`/api/purchase-orders/${poId}/status`, { status: 'approved' });
      setError('');
      fetchPendingRequests(); // Refresh the list
    } catch (err) {
      console.error('Failed to approve PO:', err);
      setError(err.response?.data?.error || 'Failed to approve purchase order');
    }
  };

  const handleReject = async () => {
    try {
      if (!rejectReason.trim()) {
        setError('Please provide a reason for rejection');
        return;
      }

      await axios.patch(`/api/purchase-orders/${selectedPO._id}/status`, { 
        status: 'rejected',
        rejectionReason: rejectReason
      });
      
      setRejectDialog(false);
      setRejectReason('');
      setSelectedPO(null);
      setError('');
      fetchPendingRequests(); // Refresh the list
    } catch (err) {
      console.error('Failed to reject PO:', err);
      setError(err.response?.data?.error || 'Failed to reject purchase order');
    }
  };

  const handleActionClick = (event, po) => {
    setSelectedPO(po);
    setActionMenuAnchor(event.currentTarget);
  };

  const handleActionClose = () => {
    setActionMenuAnchor(null);
    setSelectedPO(null);
  };

  const openRejectDialog = (po) => {
    setSelectedPO(po);
    setRejectDialog(true);
    handleActionClose();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading purchase order requests...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Purchase Order Requests
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Manage pending purchase order requests requiring approval
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {requests.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No pending purchase order requests
          </Typography>
          <Typography color="text.secondary">
            All purchase orders are either approved or processed
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order Number</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Requested By</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Request Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((po) => (
                <TableRow key={po._id} hover>
                  <TableCell>{po.orderNumber}</TableCell>
                  <TableCell>{po.supplier?.name || 'N/A'}</TableCell>
                  <TableCell>{po.createdBy?.username || 'Unknown'}</TableCell>
                  <TableCell>${po.totalAmount?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>
                    {new Date(po.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                      color={getStatusColor(po.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Approve">
                      <IconButton 
                        color="success" 
                        onClick={() => handleApprove(po._id)}
                        sx={{ mr: 1 }}
                      >
                        <ApproveIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reject">
                      <IconButton 
                        color="error" 
                        onClick={() => openRejectDialog(po)}
                        sx={{ mr: 1 }}
                      >
                        <RejectIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View Details">
                      <IconButton 
                        onClick={() => navigate(`/purchase-orders/view/${po._id}`)}
                        sx={{ mr: 1 }}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <IconButton onClick={(e) => handleActionClick(e, po)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionClose}
      >
        <MenuItem onClick={() => {
          navigate(`/purchase-orders/view/${selectedPO?._id}`);
          handleActionClose();
        }}>
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          handleApprove(selectedPO?._id);
          handleActionClose();
        }}>
          Approve Request
        </MenuItem>
        <MenuItem onClick={() => openRejectDialog(selectedPO)}>
          Reject Request
        </MenuItem>
      </Menu>

      {/* Reject Dialog */}
      <Dialog 
        open={rejectDialog} 
        onClose={() => setRejectDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Purchase Order</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to reject purchase order <strong>{selectedPO?.orderNumber}</strong>?
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
            placeholder="Please provide a detailed reason for rejecting this purchase order..."
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

export default PORequests;
