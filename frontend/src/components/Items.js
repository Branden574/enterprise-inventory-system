import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import {
  Button, TextField, Select, MenuItem, InputLabel, FormControl, Card, CardContent, CardActions, Typography, Grid, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Fab, Snackbar, Alert, Box
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import BarcodeScanner from './BarcodeScanner';

function Items() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', quantity: 1, location: '', notes: '', category: '', photo: null, customFields: {} });
  const [imagePreview, setImagePreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [customFieldsConfig, setCustomFieldsConfig] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanMode, setScanMode] = useState('search'); // 'search' or 'add'

  useEffect(() => {
    Promise.all([
      fetchItems(),
      fetchCategories(),
      fetchCustomFields()
    ]).finally(() => setLoading(false));
  }, []);

  const fetchCustomFields = async () => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        setSnackbar({
          open: true,
          message: 'Please log in to view custom fields',
          severity: 'error'
        });
        return;
      }

      const res = await axios.get('/api/customFields');
      if (res.data) {
        setCustomFieldsConfig(res.data);
      } else {
        throw new Error('No data received from server');
      }
    } catch (err) {
      console.error('Custom fields error:', err);
      let errorMessage = 'Failed to load custom fields';
      if (err.response) {
        errorMessage += `: ${err.response.data?.error || err.response.statusText}`;
      } else if (err.request) {
        errorMessage += ': No response from server';
      } else {
        errorMessage += `: ${err.message}`;
      }
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  const fetchItems = async () => {
    try {
      const res = await axios.get('/api/items');
      // Handle the new API response structure {items: [...], pagination: {...}}
      const itemsData = res.data.items || res.data || [];
      const realItemsArray = Array.isArray(itemsData) ? itemsData : [];
      setItems(realItemsArray);
    } catch (err) {
      console.error('Items error:', err);
      setItems([]); // Set empty array on error
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.error || 'Failed to load items', 
        severity: 'error' 
      });
    }
  };
  
  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/categories');
      // Ensure res.data is an array before sorting
      const categoriesData = Array.isArray(res.data) ? res.data : [];
      setCategories(categoriesData.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error('Categories error:', err);
      setCategories([]); // Set empty array on error
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.error || 'Failed to load categories', 
        severity: 'error' 
      });
    }
  };

  const handleChange = e => {
    if (e.target.name === 'photo') {
      setForm({ ...form, photo: e.target.files[0] });
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    } else if (e.target.name.startsWith('customField_')) {
      const key = e.target.name.replace('customField_', '');
      setForm({ ...form, customFields: { ...form.customFields, [key]: e.target.value } });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Basic field validation
    if (!form.name.trim()) errors.name = 'Name is required';
    if (form.quantity < 1) errors.quantity = 'Quantity must be at least 1';
    if (!form.location.trim()) errors.location = 'Location is required';
    
    // Category validation - if selected, must exist
    if (form.category) {
      const categoryExists = categories.some(cat => cat._id === form.category);
      if (!categoryExists) {
        errors.category = 'Selected category is invalid';
      }
    }
    
    // Custom fields validation
    customFieldsConfig.forEach(field => {
      const value = form.customFields[field.name];
      if (field.required && !value) {
        errors[`customField_${field.name}`] = `${field.name} is required`;
      }
      
      if (value) {
        switch (field.type) {
          case 'number':
            if (isNaN(value)) {
              errors[`customField_${field.name}`] = `${field.name} must be a number`;
            }
            break;
          case 'date':
            if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
              errors[`customField_${field.name}`] = `${field.name} must be a valid date`;
            }
            break;
          case 'dropdown':
            if (!field.options.includes(value)) {
              errors[`customField_${field.name}`] = `${field.name} must be one of the provided options`;
            }
            break;
        }
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    if (!validateForm()) {
      setSnackbar({ 
        open: true, 
        message: 'Please correct the errors in the form', 
        severity: 'error' 
      });
      return;
    }

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === 'customFields') {
        data.append('customFields', JSON.stringify(value));
      } else if (value) {
        data.append(key, value);
      }
    });
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type for FormData - let axios handle it
        }
      };

      if (editingId) {
        await axios.put(`/api/items/${editingId}`, data, config);
        setSnackbar({ open: true, message: 'Item updated!', severity: 'success' });
      } else {
        await axios.post('/api/items', data, config);
        setSnackbar({ open: true, message: 'Item added!', severity: 'success' });
      }
      
      // Reset form with default values for custom fields
      const defaultCustomFields = {};
      customFieldsConfig.forEach(field => {
        if (field.defaultValue) {
          defaultCustomFields[field.name] = field.defaultValue;
        }
      });
      
      setForm({ 
        name: '', 
        quantity: 1, 
        location: '', 
        notes: '', 
        category: '', 
        photo: null, 
        customFields: defaultCustomFields 
      });
      setImagePreview(null);
      setEditingId(null);
      setOpenDialog(false);
      fetchItems();
    } catch (err) {
      console.error('Save item error:', err);
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.error || err.message || 'Failed to save item', 
        severity: 'error' 
      });
    }
  };

  const handleEdit = item => {
    setForm({
      ...item,
      photo: null,
      customFields: item.customFields || {}
    });
    setEditingId(item._id);
    // Use the full Cloudinary URL or construct local path for legacy uploads
    setImagePreview(item.photo ? (item.photo.startsWith('http') ? item.photo : `/uploads/${item.photo}`) : null);
    setOpenDialog(true);
  };

  const handleDelete = async id => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      await axios.delete(`/api/items/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setSnackbar({ open: true, message: 'Item deleted!', severity: 'success' });
      fetchItems();
    } catch (err) {
      console.error('Delete item error:', err);
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.error || err.message || 'Failed to delete item', 
        severity: 'error' 
      });
    }
  };

  const handleAddClick = () => {
    // Initialize custom fields with their default values
    const defaultCustomFields = {};
    customFieldsConfig.forEach(field => {
      if (field.defaultValue) {
        defaultCustomFields[field.name] = field.defaultValue;
      }
    });
    
    setForm({ 
      name: '', 
      quantity: 1, 
      location: '', 
      notes: '', 
      category: '', 
      photo: null, 
      customFields: defaultCustomFields 
    });
    setImagePreview(null);
    setEditingId(null);
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditingId(null);
    setForm({ name: '', quantity: 1, location: '', notes: '', category: '', photo: null, customFields: {} });
    setImagePreview(null);
  };

  // Filter items by search and category
  const filteredItems = (Array.isArray(items) ? items : []).filter(item => {
    const searchLower = search.toLowerCase();
    const matchesSearch = (
      item.name?.toLowerCase().includes(searchLower) ||
      item.location?.toLowerCase().includes(searchLower) ||
      item.notes?.toLowerCase().includes(searchLower) ||
      (item.category?.name?.toLowerCase().includes(searchLower))
    );
    
    const matchesCategory = !categoryFilter || item.category?._id === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Barcode scanning functions
  const handleBarcodeSearch = (code) => {
    searchItemByBarcode(code);
  };

  const handleBarcodeAdd = (code) => {
    setForm(prev => ({ 
      ...prev, 
      customFields: { 
        ...prev.customFields, 
        barcode: code 
      } 
    }));
    setSnackbar({
      open: true,
      message: `Barcode ${code} added to form`,
      severity: 'success'
    });
  };

  const searchItemByBarcode = async (code) => {
    try {
      const response = await axios.get(`/api/items/search/barcode/${code}`);
      const item = response.data;
      
      // Clear filters and search to show the found item
      setSearch('');
      setCategoryFilter('');
      
      setSnackbar({
        open: true,
        message: `Found item: ${item.name}`,
        severity: 'success'
      });

      // Optionally scroll to the item or highlight it
      setTimeout(() => {
        const element = document.getElementById(`item-${item._id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.style.boxShadow = '0 0 20px rgba(25, 118, 210, 0.5)';
          setTimeout(() => {
            element.style.boxShadow = '';
          }, 3000);
        }
      }, 100);

    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Item not found with this barcode',
        severity: 'error'
      });
    }
  };

  const openScannerForSearch = () => {
    setScanMode('search');
    setScannerOpen(true);
  };

  const openScannerForAdd = () => {
    setScanMode('add');
    setScannerOpen(true);
  };

  const handleScanResult = (code) => {
    if (scanMode === 'search') {
      handleBarcodeSearch(code);
    } else if (scanMode === 'add') {
      handleBarcodeAdd(code);
    }
    setScannerOpen(false);
  };

  return (
    <Box sx={{ position: 'relative', minHeight: '80vh', pb: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, letterSpacing: 1, mt: 2, mb: 2, textAlign: 'center' }}>Items</Typography>
      
      {/* Search and Filter Section */}
      <Box sx={{ mb: 3, width: '100%', maxWidth: 600 }}>
        <TextField
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search items..."
          variant="outlined"
          size="small"
          fullWidth
          sx={{ mb: 2 }}
        />
        
        {/* Barcode Search Button */}
        <Box display="flex" gap={1} mb={2}>
          <Button
            variant="outlined"
            startIcon={<QrCodeScannerIcon />}
            onClick={openScannerForSearch}
            size="small"
          >
            Scan to Search
          </Button>
        </Box>
        
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Category</InputLabel>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              label="Filter by Category"
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map(cat => (
                <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {(search || categoryFilter) && (
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => {
                setSearch('');
                setCategoryFilter('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </Box>
      </Box>
      
      {filteredItems.length === 0 ? (
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No items found.
          </Typography>
          <Typography color="text.secondary">
            {items.length === 0 ? 'Click the + button below to add your first item.' : 'Try adjusting your search or filters.'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3} justifyContent="center">
          {filteredItems.map(item => (
            <Grid item xs={12} sm={6} md={4} key={item._id} id={`item-${item._id}`}>
              <Card sx={{ boxShadow: 4, borderRadius: 3, transition: '0.2s', '&:hover': { boxShadow: 8, transform: 'translateY(-4px) scale(1.03)' } }}>
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {item.photo && <img src={item.photo} alt={item.name} style={{ maxWidth: 160, maxHeight: 120, borderRadius: 8, marginBottom: 8 }} />}
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>{item.name}</Typography>
                    <Typography color="text.secondary">Qty: {item.quantity}</Typography>
                    <Typography color="text.secondary">Location: {item.location}</Typography>
                    <Typography color="text.secondary">Category: {item.category?.name || 'None'}</Typography>
                    <Typography color="text.secondary">Notes: {item.notes}</Typography>
                    {item.customFields && Object.entries(item.customFields).map(([key, value]) => (
                      <Typography color="text.secondary" key={key}>{key}: {value}</Typography>
                    ))}
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center' }}>
                  <IconButton color="primary" onClick={() => handleEdit(item)}><EditIcon /></IconButton>
                  <IconButton color="error" onClick={() => handleDelete(item._id)}><DeleteIcon /></IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      <Fab color="primary" aria-label="add" onClick={handleAddClick} sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 100 }}>
        <AddIcon />
      </Fab>
      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Item' : 'Add Item'}</DialogTitle>
        <DialogContent>
          <form id="item-form" onSubmit={handleSubmit} encType="multipart/form-data">
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={8}>
                <TextField 
                  name="name" 
                  label="Name" 
                  value={form.name} 
                  onChange={handleChange} 
                  required 
                  fullWidth 
                  margin="normal"
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField 
                  name="quantity" 
                  label="Quantity" 
                  type="number" 
                  inputProps={{ 
                    min: "1",
                    style: { textAlign: 'center' }
                  }}
                  value={form.quantity} 
                  onChange={handleChange} 
                  required 
                  fullWidth
                  margin="normal"
                  error={!!formErrors.quantity}
                  helperText={formErrors.quantity}
                  sx={{ 
                    '& .MuiInputBase-root': {
                      height: '56px'
                    },
                    '& .MuiOutlinedInput-input': {
                      height: '23px',
                      padding: '16.5px 14px'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField 
                  name="location" 
                  label="Location" 
                  value={form.location} 
                  onChange={handleChange} 
                  fullWidth 
                  required
                  error={!!formErrors.location}
                  helperText={formErrors.location}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!formErrors.category}>
                  <InputLabel>Category</InputLabel>
                  <Select 
                    name="category" 
                    value={form.category} 
                    onChange={handleChange} 
                    label="Category"
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {categories.map(cat => (
                      <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
                    ))}
                  </Select>
                  {formErrors.category && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                      {formErrors.category}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField name="notes" label="Notes" value={form.notes} onChange={handleChange} fullWidth multiline rows={3} />
              </Grid>
                {customFieldsConfig.map((field, idx) => (
                  <Grid item xs={12} key={idx}>
                    {field.type === 'text' && (
                      <TextField
                        name={`customField_${field.name}`}
                        label={field.name}
                        value={form.customFields[field.name] || ''}
                        onChange={handleChange}
                        fullWidth
                      />
                    )}
                    {field.type === 'number' && (
                      <TextField
                        name={`customField_${field.name}`}
                        label={field.name}
                        type="number"
                        value={form.customFields[field.name] || ''}
                        onChange={handleChange}
                        fullWidth
                      />
                    )}
                    {field.type === 'date' && (
                      <TextField
                        name={`customField_${field.name}`}
                        label={field.name}
                        type="date"
                        value={form.customFields[field.name] || ''}
                        onChange={handleChange}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                    {field.type === 'dropdown' && (
                      <FormControl fullWidth>
                        <InputLabel>{field.name}</InputLabel>
                        <Select
                          name={`customField_${field.name}`}
                          value={form.customFields[field.name] || ''}
                          onChange={handleChange}
                          label={field.name}
                        >
                          <MenuItem value=""><em>None</em></MenuItem>
                          {field.options.map((opt, i) => (
                            <MenuItem key={i} value={opt}>{opt}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </Grid>
                ))}
              <Grid item xs={12}>
                <Button variant="contained" component="label" fullWidth>
                  Upload Image
                  <input name="photo" type="file" accept="image/*" hidden onChange={handleChange} />
                </Button>
                {imagePreview && <img src={imagePreview} alt="Preview" style={{ maxWidth: 120, maxHeight: 120, marginTop: 8, borderRadius: 8 }} />}
              </Grid>
              
              {/* Barcode Scanning Section */}
              <Grid item xs={12}>
                <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Barcode/QR Code:
                  </Typography>
                  <Box display="flex" gap={1} alignItems="center">
                    <TextField
                      name="customField_barcode"
                      label="Barcode"
                      value={form.customFields.barcode || ''}
                      onChange={handleChange}
                      placeholder="Enter or scan barcode"
                      size="small"
                      sx={{ flexGrow: 1 }}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<QrCodeScannerIcon />}
                      onClick={openScannerForAdd}
                      size="small"
                    >
                      Scan
                    </Button>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button type="submit" form="item-form" variant="contained" color="primary">{editingId ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Barcode Scanner Component */}
      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanResult={handleScanResult}
        title={scanMode === 'search' ? 'Scan to Search Item' : 'Scan to Add Barcode'}
      />
    </Box>
  );
}

export default Items;
