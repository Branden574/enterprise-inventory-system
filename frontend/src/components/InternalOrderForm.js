import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Grid,
  Autocomplete,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import axios from '../utils/axios';

function InternalOrderForm() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    requesterName: '',
    deliverySite: '',
    requestedDeliveryDate: null,
    department: '',
    purpose: '',
    notes: ''
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/items');
      const availableItems = response.data.filter(item => item.quantity > 0);
      setItems(availableItems);
      console.log('Fetched items:', availableItems.length, 'items available');
    } catch (err) {
      console.error('Failed to fetch items:', err);
      setError('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addItem = () => {
    setSelectedItems(prev => [...prev, {
      item: null,
      requestedQuantity: 1,
      notes: ''
    }]);
  };

  const removeItem = (index) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateSelectedItem = (index, field, value) => {
    setSelectedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const validateForm = () => {
    if (!formData.requesterName.trim()) return 'Requester name is required';
    if (!formData.deliverySite.trim()) return 'Delivery site is required';
    if (!formData.requestedDeliveryDate) return 'Requested delivery date is required';
    if (selectedItems.length === 0) return 'At least one item is required';
    
    for (let i = 0; i < selectedItems.length; i++) {
      const item = selectedItems[i];
      if (!item.item) return `Item ${i + 1}: Please select an item`;
      if (!item.requestedQuantity || item.requestedQuantity < 1) return `Item ${i + 1}: Quantity must be at least 1`;
      if (item.requestedQuantity > item.item.quantity) {
        return `Item ${i + 1}: Requested quantity (${item.requestedQuantity}) exceeds available stock (${item.item.quantity})`;
      }
    }
    
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const orderData = {
        ...formData,
        items: selectedItems.map(item => ({
          item: item.item._id,
          requestedQuantity: item.requestedQuantity,
          notes: item.notes
        }))
      };

      const response = await axios.post('/api/internal-orders', orderData);
      setSuccess(`Internal order ${response.data.orderNumber} created successfully!`);
      setConfirmDialog(false);
      
      // Reset form after successful submission
      setTimeout(() => {
        navigate('/internal-orders');
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create internal order');
      setConfirmDialog(false);
    } finally {
      setLoading(false);
    }
  };

  const getTotalItems = () => {
    return selectedItems.reduce((total, item) => total + (item.requestedQuantity || 0), 0);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/internal-orders')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          New Internal Order Request
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {items.length === 0 && !loading && !error && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No items with available stock found. Make sure items are added to the inventory with stock quantity greater than 0.
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        {/* Request Information */}
        <Typography variant="h6" gutterBottom>
          Request Information
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Requester Name"
              fullWidth
              required
              value={formData.requesterName}
              onChange={(e) => handleFormChange('requesterName', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Delivery Site"
              fullWidth
              required
              value={formData.deliverySite}
              onChange={(e) => handleFormChange('deliverySite', e.target.value)}
              placeholder="e.g., Building A - Room 101, Warehouse B"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <DatePicker
              label="Requested Delivery Date"
              value={formData.requestedDeliveryDate}
              onChange={(date) => handleFormChange('requestedDeliveryDate', date)}
              renderInput={(params) => <TextField {...params} fullWidth required />}
              minDate={new Date()}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Department"
              fullWidth
              value={formData.department}
              onChange={(e) => handleFormChange('department', e.target.value)}
              placeholder="e.g., IT, Marketing, Operations"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Purpose/Reason"
              fullWidth
              multiline
              rows={2}
              value={formData.purpose}
              onChange={(e) => handleFormChange('purpose', e.target.value)}
              placeholder="Brief description of why these items are needed"
            />
          </Grid>
        </Grid>

        {/* Items Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Requested Items ({selectedItems.length} items, {getTotalItems()} total quantity)
          </Typography>
          <Box>
            <Button
              variant="text"
              onClick={fetchItems}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              {loading ? 'Loading...' : `Refresh Items (${items.length} available)`}
            </Button>
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              onClick={addItem}
            >
              Add Item
            </Button>
          </Box>
        </Box>

        {selectedItems.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No items added yet. Click "Add Item" to get started.
            </Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell>Available Stock</TableCell>
                  <TableCell>Requested Quantity</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedItems.map((selectedItem, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Autocomplete
                        options={items}
                        getOptionLabel={(option) => `${option.name} (${option.sku})`}
                        value={selectedItem.item}
                        onChange={(_, newValue) => updateSelectedItem(index, 'item', newValue)}
                        loading={loading}
                        noOptionsText={loading ? "Loading items..." : items.length === 0 ? "No items with stock available" : "No options"}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Select Item"
                            variant="outlined"
                            size="small"
                            required
                            helperText={items.length === 0 && !loading ? "No items available or loading..." : ""}
                          />
                        )}
                        sx={{ minWidth: 250 }}
                      />
                    </TableCell>
                    <TableCell>
                      {selectedItem.item ? (
                        <Chip 
                          label={selectedItem.item.quantity} 
                          color={selectedItem.item.quantity > 0 ? 'success' : 'error'}
                          size="small"
                        />
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={selectedItem.requestedQuantity}
                        onChange={(e) => updateSelectedItem(index, 'requestedQuantity', parseInt(e.target.value) || 0)}
                        inputProps={{ 
                          min: 1, 
                          max: selectedItem.item?.quantity || 999999 
                        }}
                        sx={{ width: 100 }}
                        error={selectedItem.requestedQuantity > (selectedItem.item?.quantity || 0)}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        placeholder="Optional notes"
                        value={selectedItem.notes}
                        onChange={(e) => updateSelectedItem(index, 'notes', e.target.value)}
                        sx={{ minWidth: 150 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton 
                        color="error" 
                        onClick={() => removeItem(index)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Additional Notes */}
        <Box sx={{ mt: 3 }}>
          <TextField
            label="Additional Notes"
            fullWidth
            multiline
            rows={3}
            value={formData.notes}
            onChange={(e) => handleFormChange('notes', e.target.value)}
            placeholder="Any additional information that might be helpful for approval..."
          />
        </Box>

        {/* Submit Button */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/internal-orders')}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={() => setConfirmDialog(true)}
            disabled={loading || selectedItems.length === 0}
          >
            Submit Order Request
          </Button>
        </Box>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Order Request</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to submit this internal order request?
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Summary:</Typography>
            <Typography>• Requester: {formData.requesterName}</Typography>
            <Typography>• Delivery Site: {formData.deliverySite}</Typography>
            <Typography>• Requested Date: {formData.requestedDeliveryDate ? format(formData.requestedDeliveryDate, 'MMM dd, yyyy') : 'Not set'}</Typography>
            <Typography>• Items: {selectedItems.length} different items, {getTotalItems()} total quantity</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Confirm & Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default InternalOrderForm;
