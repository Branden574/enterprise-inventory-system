import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  Grid,
  Paper,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Autocomplete,
  InputAdornment,
  FormHelperText,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';

function PurchaseOrderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    supplier: {
      name: '',
      email: '',
      phone: '',
      address: '',
      contactPerson: '',
    },
    items: [],
    expectedDeliveryDate: null,
    deliveryAddress: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemUnitPrice, setItemUnitPrice] = useState('');
  const [itemNotes, setItemNotes] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    fetchItems();
    if (isEditing) {
      fetchPurchaseOrder();
    }
  }, [id]);

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await axios.get('/api/items', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data) {
        setItems(response.data);
      } else {
        throw new Error('No items data received');
      }
    } catch (err) {
      console.error('Failed to fetch items:', err);
      setSubmitError(err.message || 'Failed to fetch items. Please try refreshing the page.');
    }
  };

  const fetchPurchaseOrder = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/purchase-orders/${id}`);
      
      // Convert date string to Date object for the DatePicker
      const data = { ...response.data };
      if (data.expectedDeliveryDate) {
        data.expectedDeliveryDate = new Date(data.expectedDeliveryDate);
      }
      
      setFormData(data);
    } catch (err) {
      console.error('Failed to fetch purchase order:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setSubmitError('');

      // Get the authentication token
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Prepare the data
      const method = isEditing ? 'put' : 'post';
      const url = isEditing 
        ? `/api/purchase-orders/${id}`
        : '/api/purchase-orders';

      // Calculate total amount
      const totalAmount = formData.items.reduce((sum, item) => {
        return sum + (item.quantity * item.unitPrice);
      }, 0);

      // Create the request data
      const requestData = {
        ...formData,
        totalAmount,
        status: 'draft',
      };

      console.log('Submitting purchase order:', requestData);

      const response = await axios[method](url, requestData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Upload attachments if any
      if (attachments.length > 0) {
        const attachmentFormData = new FormData();
        attachments.forEach(file => {
          attachmentFormData.append('file', file);
        });
        await axios.post(
          `/api/purchase-orders/${response.data._id}/attachments`, 
          attachmentFormData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      }

      navigate('/purchase-orders');
    } catch (err) {
      console.error('Error saving purchase order:', err);
      setSubmitError(err.response?.data?.error || err.message || 'Failed to save purchase order');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.supplier.name) {
      errors.supplierName = 'Supplier name is required';
    }
    if (formData.items.length === 0) {
      errors.items = 'At least one item is required';
    }
    formData.items.forEach((item, index) => {
      if (!item.quantity || item.quantity < 1) {
        errors[`item${index}Quantity`] = 'Quantity must be at least 1';
      }
      if (!item.unitPrice || item.unitPrice < 0) {
        errors[`item${index}Price`] = 'Unit price must be valid';
      }
    });

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleItemAdd = () => {
    if (!selectedItem || !itemQuantity || !itemUnitPrice) return;

    const newItem = {
      item: selectedItem._id,
      itemName: selectedItem.name,
      quantity: parseInt(itemQuantity),
      unitPrice: parseFloat(itemUnitPrice),
      notes: itemNotes
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setSelectedItem(null);
    setItemQuantity('');
    setItemUnitPrice('');
    setItemNotes('');
    setShowItemDialog(false);
  };

  const handleItemRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {isEditing ? 'Edit Purchase Order' : 'Create Purchase Order'}
      </Typography>

      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError('')}>
          {submitError}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Supplier Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Supplier Name"
                fullWidth
                required
                value={formData.supplier.name}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  supplier: { ...prev.supplier, name: e.target.value }
                }))}
                error={!!errors.supplierName}
                helperText={errors.supplierName}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Contact Person"
                fullWidth
                value={formData.supplier.contactPerson}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  supplier: { ...prev.supplier, contactPerson: e.target.value }
                }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                fullWidth
                type="email"
                value={formData.supplier.email}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  supplier: { ...prev.supplier, email: e.target.value }
                }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone"
                fullWidth
                value={formData.supplier.phone}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  supplier: { ...prev.supplier, phone: e.target.value }
                }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address"
                fullWidth
                multiline
                rows={2}
                value={formData.supplier.address}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  supplier: { ...prev.supplier, address: e.target.value }
                }))}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Items
            </Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={() => setShowItemDialog(true)}
            >
              Add Item
            </Button>
          </Box>

          {errors.items && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.items}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.itemName}</TableCell>
                    <TableCell align="right">{item.quantity}</TableCell>
                    <TableCell align="right">${item.unitPrice.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      ${(item.quantity * item.unitPrice).toFixed(2)}
                    </TableCell>
                    <TableCell>{item.notes}</TableCell>
                    <TableCell>
                      <IconButton 
                        color="error"
                        onClick={() => handleItemRemove(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} align="right">
                    <strong>Total:</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>${calculateTotal().toFixed(2)}</strong>
                  </TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Additional Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Expected Delivery Date"
                value={formData.expectedDeliveryDate}
                onChange={(date) => setFormData(prev => ({
                  ...prev,
                  expectedDeliveryDate: date
                }))}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Delivery Address"
                fullWidth
                multiline
                rows={2}
                value={formData.deliveryAddress}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  deliveryAddress: e.target.value
                }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Attachments
          </Typography>
          <Box>
            <Button
              component="label"
              startIcon={<AttachFileIcon />}
            >
              Upload File
              <input
                type="file"
                hidden
                multiple
                onChange={handleFileUpload}
              />
            </Button>
          </Box>
          {attachments.map((file, index) => (
            <Box
              key={index}
              display="flex"
              alignItems="center"
              gap={1}
              mt={1}
            >
              <Typography>{file.name}</Typography>
              <IconButton
                size="small"
                color="error"
                onClick={() => removeAttachment(index)}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
        </Paper>

        <Box display="flex" gap={2} justifyContent="flex-end">
          <Button
            variant="outlined"
            onClick={() => navigate('/purchase-orders')}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={loading}
          >
            {isEditing ? 'Update' : 'Create'} Purchase Order
          </Button>
        </Box>
      </form>

      <Dialog
        open={showItemDialog}
        onClose={() => setShowItemDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Item</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Autocomplete
                options={items}
                getOptionLabel={(option) => option.name}
                value={selectedItem}
                onChange={(_, newValue) => setSelectedItem(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Item"
                    required
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Quantity"
                type="number"
                fullWidth
                required
                value={itemQuantity}
                onChange={(e) => setItemQuantity(e.target.value)}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Unit Price"
                type="number"
                fullWidth
                required
                value={itemUnitPrice}
                onChange={(e) => setItemUnitPrice(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  inputProps: { min: 0, step: 0.01 }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={2}
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowItemDialog(false)}>Cancel</Button>
          <Button
            onClick={handleItemAdd}
            variant="contained"
            disabled={!selectedItem || !itemQuantity || !itemUnitPrice}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PurchaseOrderForm;
