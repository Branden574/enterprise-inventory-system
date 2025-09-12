// Fresh Items component - completely rewritten to fix the button issue
import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import {
  Button, TextField, Select, MenuItem, InputLabel, FormControl, Card, CardContent, CardActions, Typography, Grid, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Box, Pagination, Checkbox, FormControlLabel, Fab
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import BarcodeScanner from './BarcodeScanner';

function Items() {
  console.log('🔥 FRESH Items component loaded - NO LEGACY CODE');
  
  // State declarations
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ 
    name: '', 
    title: '',
    quantity: 1, 
    location: '', 
    notes: '', 
    category: '', 
    photo: null, 
    customFields: {},
    isbn13: '',
    isbn10: '',
    status: 'available'
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [selectedItemType, setSelectedItemType] = useState('item');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [customFieldsConfig, setCustomFieldsConfig] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanMode, setScanMode] = useState('search');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Get user role
  const getUserRole = () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  useEffect(() => {
    setUserRole(getUserRole());
    Promise.all([
      fetchItems(),
      fetchCategories(),
      fetchCustomFields()
    ]).finally(() => setLoading(false));
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get('/api/items');
      const itemsData = res.data.items || res.data || [];
      const realItemsArray = Array.isArray(itemsData) ? itemsData : [];
      setItems(realItemsArray);
    } catch (err) {
      console.error('Items error:', err);
      setItems([]);
      setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to load items', severity: 'error' });
    }
  };
  
  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/categories');
      const categoriesData = Array.isArray(res.data) ? res.data : [];
      setCategories(categoriesData.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error('Categories error:', err);
      setCategories([]);
      setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to load categories', severity: 'error' });
    }
  };

  const fetchCustomFields = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        setSnackbar({ open: true, message: 'Please log in to view custom fields', severity: 'error' });
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
      setSnackbar({ open: true, message: 'Failed to load custom fields', severity: 'error' });
    }
  };

  // FRESH BUTTON HANDLERS - NO LEGACY CODE
  const handleFabClick = () => {
    console.log('🟢 FAB CLICKED - Opening type selector');
    setShowTypeSelector(true);
  };

  const selectItemType = (type) => {
    console.log('🎯 TYPE SELECTED:', type);
    setSelectedItemType(type);
    setShowTypeSelector(false);
    setEditingId(null);
    // Reset form completely
    setForm({
      name: '', 
      title: '',
      quantity: 1, 
      location: '', 
      notes: '', 
      category: '', 
      photo: null, 
      customFields: {},
      isbn13: '',
      isbn10: '',
      status: 'available'
    });
    setImagePreview(null);
    setOpenDialog(true);
  };

  const handleChange = e => {
    if (e.target.name === 'photo') {
      setForm({ ...form, photo: e.target.files[0] });
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    } else if (e.target.name.startsWith('customField_')) {
      const key = e.target.name.replace('customField_', '');
      setForm({ ...form, customFields: { ...form.customFields, [key]: e.target.value } });
    } else {
      const updatedForm = { ...form, [e.target.name]: e.target.value };
      setForm(updatedForm);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (selectedItemType === 'book') {
      if (!form.title?.trim()) errors.title = 'Book title is required';
    } else {
      if (!form.name?.trim()) errors.name = 'Item name is required';
    }
    
    if (form.quantity < 0) errors.quantity = 'Quantity cannot be negative';
    if (!form.location?.trim()) errors.location = 'Location is required';
    if (!form.status) errors.status = 'Status is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    if (!validateForm()) {
      setSnackbar({ open: true, message: 'Please correct the errors in the form', severity: 'error' });
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const finalForm = {
        ...form,
        name: form.name.trim() || form.title.trim()
      };

      let response;

      if (finalForm.photo) {
        const data = new FormData();
        const essentialFields = ['name', 'title', 'quantity', 'location', 'category', 'notes', 'isbn13', 'isbn10', 'status'];
        essentialFields.forEach(key => {
          if (finalForm[key] && finalForm[key] !== '') {
            data.append(key, finalForm[key]);
          }
        });
        data.append('photo', finalForm.photo);
        if (finalForm.customFields && Object.keys(finalForm.customFields).length > 0) {
          data.append('customFields', JSON.stringify(finalForm.customFields));
        }

        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        if (editingId) {
          response = await axios.put(`/api/items/${editingId}`, data, config);
        } else {
          response = await axios.post('/api/items', data, config);
        }
      } else {
        const jsonData = {
          name: finalForm.name,
          title: finalForm.title,
          category: finalForm.category,
          quantity: finalForm.quantity,
          location: finalForm.location,
          notes: finalForm.notes,
          isbn13: finalForm.isbn13,
          status: finalForm.status
        };

        if (finalForm.isbn10) jsonData.isbn10 = finalForm.isbn10;
        if (finalForm.customFields && Object.keys(finalForm.customFields).length > 0) {
          jsonData.customFields = finalForm.customFields;
        }

        const config = { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } };
        if (editingId) {
          response = await axios.put(`/api/items/${editingId}`, jsonData, config);
        } else {
          response = await axios.post('/api/items', jsonData, config);
        }
      }

      setSnackbar({ open: true, message: editingId ? 'Item updated!' : 'Item added!', severity: 'success' });
      
      setForm({ 
        name: '', 
        title: '',
        quantity: 1, 
        location: '', 
        notes: '', 
        category: '', 
        photo: null, 
        customFields: {},
        isbn13: '',
        isbn10: '',
        status: 'available'
      });
      setImagePreview(null);
      setEditingId(null);
      setOpenDialog(false);
      fetchItems();
    } catch (err) {
      console.error('Save item error:', err);
      setSnackbar({ open: true, message: err.response?.data?.error || err.message || 'Failed to save item', severity: 'error' });
    }
  };

  const handleEdit = item => {
    const isBook = !!(item.isbn13 || item.isbn10 || item.title || 
      (item.category && categories.find(c => c._id === item.category)?.name?.toLowerCase().includes('book')));
    
    setSelectedItemType(isBook ? 'book' : 'item');
    setForm({
      ...item,
      photo: item.photo || null,
      customFields: item.customFields || {}
    });
    setEditingId(item._id);
    setImagePreview(null);
    setOpenDialog(true);
  };

  const handleDelete = async id => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      await axios.delete(`/api/items/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSnackbar({ open: true, message: 'Item deleted!', severity: 'success' });
      fetchItems();
    } catch (err) {
      console.error('Delete item error:', err);
      setSnackbar({ open: true, message: err.response?.data?.error || err.message || 'Failed to delete item', severity: 'error' });
    }
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditingId(null);
    setForm({ 
      name: '', 
      title: '',
      quantity: 1, 
      location: '', 
      notes: '', 
      category: '', 
      photo: null, 
      customFields: {},
      isbn13: '',
      isbn10: '',
      status: 'available'
    });
    setImagePreview(null);
  };

  // Filter and pagination
  const filteredItems = (Array.isArray(items) ? items : []).filter(item => {
    const searchLower = search.toLowerCase();
    const matchesSearch = (
      item.name?.toLowerCase().includes(searchLower) ||
      item.title?.toLowerCase().includes(searchLower) ||
      item.isbn13?.toLowerCase().includes(searchLower) ||
      item.location?.toLowerCase().includes(searchLower) ||
      item.notes?.toLowerCase().includes(searchLower) ||
      (item.category?.name?.toLowerCase().includes(searchLower))
    );
    const matchesCategory = !categoryFilter || item.category?._id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const sortedItems = filteredItems.sort((a, b) => {
    const titleA = (a.title || a.name || '').toLowerCase();
    const titleB = (b.title || b.name || '').toLowerCase();
    return titleA.localeCompare(titleB);
  });

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = sortedItems.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter]);

  return (
    <Box sx={{ 
      position: 'relative', 
      minHeight: '80vh', 
      pb: 6, 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      px: { xs: 1, sm: 2 },
      width: '100%',
      maxWidth: '100%',
      overflow: 'hidden'
    }}>
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          fontWeight: 700, 
          letterSpacing: 1, 
          mt: 2, 
          mb: 2, 
          textAlign: 'center',
          fontSize: { xs: '1.75rem', sm: '2.125rem' }
        }}
      >
        Items
      </Typography>
      
      {/* Search and Filter Section */}
      <Box sx={{ 
        mb: 3, 
        width: '100%', 
        maxWidth: { xs: '100%', sm: 600 },
        px: { xs: 0, sm: 1 }
      }}>
        <TextField
          value={search || ''}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title, ISBN, location..."
          variant="outlined"
          size="small"
          fullWidth
          sx={{ 
            mb: 2,
            '& .MuiInputBase-input': {
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }
          }}
        />
        
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 2 },
          alignItems: { xs: 'stretch', sm: 'center' },
          mb: 1
        }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowTypeSelector(true)}
            size="medium"
            sx={{ 
              order: { xs: 1, sm: 1 },
              minHeight: '40px',
              fontWeight: 'bold'
            }}
          >
            Add New Item
          </Button>
          
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: { xs: '100%', sm: 200 },
              order: { xs: 1, sm: 2 }
            }}
          >
            <InputLabel>Filter by Category</InputLabel>
            <Select
              value={categoryFilter || ''}
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
              sx={{ 
                order: 3,
                minHeight: '40px',
                whiteSpace: 'nowrap'
              }}
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
      
      {sortedItems.length === 0 ? (
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No items found.
          </Typography>
          <Typography color="text.secondary">
            {items.length === 0 ? 'Click the + button below to add your first item.' : 'Try adjusting your search or filters.'}
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedItems.length)} of {sortedItems.length} items
              {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
            </Typography>
          </Box>
          
          <Grid container spacing={{ xs: 2, sm: 3 }} justifyContent="center" sx={{ px: { xs: 1, sm: 0 } }}>
            {paginatedItems.map(item => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={item._id} id={`item-${item._id}`}>
                <Card sx={{ 
                  boxShadow: 4, 
                  borderRadius: 3, 
                  transition: '0.2s', 
                  '&:hover': { boxShadow: 8, transform: 'translateY(-4px) scale(1.03)' },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {item.photo && <img src={item.photo} alt={item.name} style={{ 
                        maxWidth: '100%', 
                        maxHeight: 120, 
                        borderRadius: 8, 
                        marginBottom: 8,
                        objectFit: 'contain' 
                      }} />}
                      <Typography variant="h6" sx={{ 
                        fontWeight: 600, 
                        textAlign: 'center',
                        fontSize: { xs: '1rem', sm: '1.25rem' },
                        lineHeight: 1.2,
                        mb: 1
                      }}>
                        {item.name}
                      </Typography>
                      {item.title && (
                        <Typography color="text.secondary" sx={{ 
                          fontStyle: 'italic', 
                          textAlign: 'center',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          mb: 1
                        }}>
                          {item.title}
                        </Typography>
                      )}
                      <Typography color="text.secondary" sx={{ 
                        textAlign: 'center',
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                        fontWeight: 500
                      }}>
                        Qty: {item.quantity}
                      </Typography>
                      <Typography color="text.secondary" sx={{ 
                        textAlign: 'center',
                        fontSize: { xs: '0.8rem', sm: '0.875rem' }
                      }}>
                        Location: {item.location}
                      </Typography>
                      <Typography color="text.secondary" sx={{ 
                        textAlign: 'center',
                        fontSize: { xs: '0.8rem', sm: '0.875rem' }
                      }}>
                        Category: {item.category?.name || 'None'}
                      </Typography>
                      {item.status && (
                        <Typography 
                          color={
                            item.status === 'Available' || item.status === 'available' ? 'success.main' :
                            item.status === 'Low Stock' || item.status === 'low-stock' ? 'warning.main' :
                            item.status === 'Out of Stock' || item.status === 'out-of-stock' ? 'error.main' :
                            'text.secondary'
                          }
                          sx={{ 
                            fontWeight: 500,
                            textAlign: 'center',
                            fontSize: { xs: '0.8rem', sm: '0.875rem' }
                          }}
                        >
                          Status: {item.status}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'center', pt: 0 }}>
                    <IconButton 
                      color="primary" 
                      onClick={() => handleEdit(item)}
                      size={{ xs: 'small', sm: 'medium' }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => handleDelete(item._id)}
                      size={{ xs: 'small', sm: 'medium' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {totalPages > 1 && (
            <Box sx={{ 
              mt: 4, 
              display: 'flex', 
              justifyContent: 'center',
              width: '100%',
              px: { xs: 1, sm: 0 }
            }}>
              <Pagination 
                count={totalPages} 
                page={currentPage} 
                onChange={handlePageChange}
                color="primary"
                size={{ xs: 'small', sm: 'large' }}
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}
      
      {/* FRESH FAB BUTTON */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={handleFabClick}
        sx={{
          position: 'fixed',
          bottom: { xs: 20, sm: 32 },
          right: { xs: 20, sm: 32 },
          zIndex: 1300,
          animation: 'pulse 1.8s infinite',
          '@keyframes pulse': {
            '0%': { boxShadow: '0 0 0 0 rgba(33,150,243,0.6)' },
            '70%': { boxShadow: '0 0 0 12px rgba(33,150,243,0)' },
            '100%': { boxShadow: '0 0 0 0 rgba(33,150,243,0)' }
          }
        }}
      >
        <AddIcon />
      </Fab>
      
      {/* TYPE SELECTOR DIALOG */}
      <Dialog 
        open={showTypeSelector} 
        onClose={() => setShowTypeSelector(false)}
        maxWidth="xs" 
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 600, pb: 1 }}>Choose Item Type</DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => selectItemType('item')}
                sx={{
                  py: 2,
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #2196F3 10%, #21CBF3 90%)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                  '&:hover': { boxShadow: '0 6px 18px rgba(33,150,243,.35)', transform: 'translateY(-2px)' },
                  transition: 'all .2s'
                }}
              >
                <Box sx={{ fontSize: 32 }}>📦</Box>
                General Item
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => selectItemType('book')}
                sx={{
                  py: 2,
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #FF6B6B 10%, #FF8E8E 90%)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                  '&:hover': { boxShadow: '0 6px 18px rgba(255,107,107,.35)', transform: 'translateY(-2px)' },
                  transition: 'all .2s'
                }}
              >
                <Box sx={{ fontSize: 32 }}>📚</Box>
                Book
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
      
      {/* ITEM FORM DIALOG */}
      <Dialog 
        open={openDialog} 
        onClose={handleDialogClose} 
        maxWidth="sm" 
        fullWidth
        fullScreen={{ xs: true, sm: false }}
      >
        <DialogTitle>
          {editingId ? `Edit ${selectedItemType === 'book' ? 'Book' : 'Item'}` : `Add ${selectedItemType === 'book' ? 'Book' : 'Item'}`}
        </DialogTitle>
        <DialogContent>
          <form id="item-form" onSubmit={handleSubmit}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12}>
                <TextField 
                  name={selectedItemType === 'book' ? 'title' : 'name'}
                  label={selectedItemType === 'book' ? 'Book Title *' : 'Item Name *'}
                  value={selectedItemType === 'book' ? (form.title || '') : (form.name || '')} 
                  onChange={handleChange} 
                  required
                  fullWidth 
                  margin="normal"
                  error={!!formErrors.title || !!formErrors.name}
                  helperText={formErrors.title || formErrors.name}
                />
              </Grid>
              
              {selectedItemType === 'book' && (
                <Grid item xs={12}>
                  <TextField 
                    name="isbn13" 
                    label="ISBN-13" 
                    value={form.isbn13 || ''} 
                    onChange={handleChange} 
                    fullWidth 
                    margin="normal"
                    placeholder="978-1-234-56789-0"
                  />
                </Grid>
              )}
              
              <Grid item xs={12} sm={6}>
                <TextField 
                  name="quantity" 
                  label="Quantity *" 
                  type="number" 
                  inputProps={{ min: "0" }}
                  value={form.quantity} 
                  onChange={handleChange} 
                  required 
                  fullWidth
                  margin="normal"
                  error={!!formErrors.quantity}
                  helperText={formErrors.quantity}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField 
                  name="location" 
                  label="Location *" 
                  value={form.location || ''} 
                  onChange={handleChange} 
                  fullWidth 
                  required
                  margin="normal"
                  error={!!formErrors.location}
                  helperText={formErrors.location}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Category</InputLabel>
                  <Select 
                    name="category" 
                    value={form.category || ''} 
                    onChange={handleChange} 
                    label="Category"
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {categories.map(cat => (
                      <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Status</InputLabel>
                  <Select 
                    name="status" 
                    value={form.status || 'available'} 
                    onChange={handleChange} 
                    label="Status"
                  >
                    <MenuItem value="available">Available</MenuItem>
                    <MenuItem value="low-stock">Low Stock</MenuItem>
                    <MenuItem value="out-of-stock">Out of Stock</MenuItem>
                    <MenuItem value="ordered">Ordered</MenuItem>
                    <MenuItem value="discontinued">Discontinued</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField 
                  name="notes" 
                  label="Notes" 
                  value={form.notes || ''} 
                  onChange={handleChange} 
                  fullWidth 
                  multiline 
                  rows={3}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button variant="contained" component="label" fullWidth>
                  Upload Image
                  <input name="photo" type="file" accept="image/*" hidden onChange={handleChange} />
                </Button>
                {imagePreview && (
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    style={{ 
                      maxWidth: 120, 
                      maxHeight: 120, 
                      marginTop: 8, 
                      borderRadius: 8,
                      border: '1px solid #ddd'
                    }} 
                  />
                )}
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button type="submit" form="item-form" variant="contained" color="primary">
            {editingId ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={3000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Items;
