import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  MoreVert as MoreVertIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import axios from '../utils/axios';

const statusColors = {
  draft: 'default',
  pending: 'warning',
  approved: 'info',
  ordered: 'primary',
  partially_received: 'secondary',
  received: 'success',
  cancelled: 'error',
};

function PurchaseOrders() {
  const navigate = useNavigate();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [selectedPO, setSelectedPO] = useState(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [userRole] = useState(localStorage.getItem('role') || 'user');

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  useEffect(() => {
    fetchPurchaseOrders();
  }, [statusFilter, dateRange]);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError('');
      let url = '/api/purchase-orders';
      const params = new URLSearchParams();
      
      if (statusFilter) params.append('status', statusFilter);
      if (dateRange.start) params.append('startDate', dateRange.start.toISOString());
      if (dateRange.end) params.append('endDate', dateRange.end.toISOString());
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(url);
      if (!response.data) {
        throw new Error('No data received from server');
      }
      setPurchaseOrders(response.data);
    } catch (err) {
      console.error('Purchase orders error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load purchase orders');
      setPurchaseOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePO = () => {
    navigate('/purchase-orders/new');
  };

  const handleStatusChange = async (poId, newStatus) => {
    try {
      await axios.patch(`/api/purchase-orders/${poId}/status`, { status: newStatus });
      fetchPurchaseOrders();
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Status update error:', err);
      const errorMessage = err.response?.data?.error || 'Failed to update status';
      setError(errorMessage);
    }
  };

  const handleEdit = (po) => {
    navigate(`/purchase-orders/edit/${po._id}`);
  };

  const handleActionClick = (event, po) => {
    setSelectedPO(po);
    setActionMenuAnchor(event.currentTarget);
  };

  const handleActionClose = () => {
    setActionMenuAnchor(null);
    setSelectedPO(null);
  };

  const handlePrint = async (po) => {
    try {
      // Get the print-ready HTML from the backend
      const response = await axios.get(`/api/purchase-orders/${po._id}/print`, {
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
      console.error('Failed to generate print version:', err);
    }
    handleActionClose();
  };

  const filteredPOs = purchaseOrders.filter(po => {
    return (
      (po.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
       po.supplier?.name?.toLowerCase().includes(search.toLowerCase())) &&
      (!statusFilter || po.status === statusFilter)
    );
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Purchase Orders
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreatePO}
        >
          Create Purchase Order
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            placeholder="Search POs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
          
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="ordered">Ordered</MenuItem>
              <MenuItem value="partially_received">Partially Received</MenuItem>
              <MenuItem value="received">Received</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>

          <DatePicker
            label="Start Date"
            value={dateRange.start}
            onChange={(date) => setDateRange({ ...dateRange, start: date })}
            slotProps={{ textField: { sx: { width: 200 } } }}
          />
          
          <DatePicker
            label="End Date"
            value={dateRange.end}
            onChange={(date) => setDateRange({ ...dateRange, end: date })}
            slotProps={{ textField: { sx: { width: 200 } } }}
          />
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order Number</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Created Date</TableCell>
              <TableCell>Expected Delivery</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Total Amount</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredPOs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No purchase orders found
                </TableCell>
              </TableRow>
            ) : (
              filteredPOs.map((po) => (
                <TableRow key={po._id}>
                  <TableCell>{po.orderNumber}</TableCell>
                  <TableCell>{po.supplier.name}</TableCell>
                  <TableCell>{format(new Date(po.createdAt), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    {po.expectedDeliveryDate
                      ? format(new Date(po.expectedDeliveryDate), 'MMM dd, yyyy')
                      : 'Not set'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={po.status.replace('_', ' ')}
                      color={statusColors[po.status]}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    ${po.totalAmount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={(e) => handleActionClick(e, po)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionClose}
      >
        {selectedPO?.status === 'draft' && (
          <MenuItem onClick={() => {
            handleEdit(selectedPO);
            handleActionClose();
          }}>
            Edit
          </MenuItem>
        )}
        <MenuItem onClick={() => handlePrint(selectedPO)}>
          <PrintIcon sx={{ mr: 1, fontSize: 'small' }} />
          Print
        </MenuItem>
        {selectedPO?.status === 'draft' && (
          <MenuItem onClick={() => {
            handleStatusChange(selectedPO._id, 'pending');
            handleActionClose();
          }}>
            Submit for Approval
          </MenuItem>
        )}
        {isAdmin && selectedPO?.status === 'pending' && (
          <MenuItem onClick={() => {
            handleStatusChange(selectedPO._id, 'approved');
            handleActionClose();
          }}>
            Approve
          </MenuItem>
        )}
        {isAdmin && selectedPO?.status === 'approved' && (
          <MenuItem onClick={() => {
            handleStatusChange(selectedPO._id, 'ordered');
            handleActionClose();
          }}>
            Mark as Ordered
          </MenuItem>
        )}
        {isAdmin && ['ordered', 'partially_received'].includes(selectedPO?.status) && (
          <MenuItem onClick={() => {
            // Navigate to receive items page
            handleActionClose();
          }}>
            Receive Items
          </MenuItem>
        )}
        {((isAdmin && !['received', 'cancelled'].includes(selectedPO?.status)) || 
          (!isAdmin && selectedPO?.status === 'draft')) && (
          <MenuItem onClick={() => {
            handleStatusChange(selectedPO._id, 'cancelled');
            handleActionClose();
          }}>
            Cancel
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}

export default PurchaseOrders;
