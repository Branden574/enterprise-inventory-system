// Safe version of Items component without barcode scanner to test loading issues
import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import {
  Button, TextField, Select, MenuItem, InputLabel, FormControl, Card, CardContent, CardActions, Typography, Grid, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Fab, Snackbar, Alert, Box, Pagination, Checkbox, FormControlLabel
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';

function ItemsSafe() {
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
    status: '',
    publisher: '',
    edition: ''
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [customFieldsConfig, setCustomFieldsConfig] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;
  
  const [userRole, setUserRole] = useState(null);

  // Decode JWT to get user role
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
  }, []);

  useEffect(() => {
    Promise.all([
      fetchItems(),
      fetchCategories(),
      fetchCustomFields()
    ]).finally(() => setLoading(false));
  }, []);

  const fetchCustomFields = async () => {
    try {
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
      const updatedForm = { ...form, [e.target.name]: e.target.value };
      
      // Auto-generate name from title if name is empty
      if (e.target.name === 'title' && !form.name) {
        updatedForm.name = e.target.value;
      }
      
      setForm(updatedForm);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!form.title.trim()) errors.title = 'Book title is required';
    if (!form.isbn13.trim()) errors.isbn13 = 'ISBN-13 is required';
    if (form.quantity < 0) errors.quantity = 'Quantity cannot be negative';
    if (!form.location.trim()) errors.location = 'Location is required';
    if (!form.status) errors.status = 'Status is required';
    
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
        const essentialFields = [
          'name', 'title', 'quantity', 'location', 'category', 'notes',
          'isbn13', 'isbn10', 'publisher', 'edition', 'status'
        ];

        essentialFields.forEach(key => {
          if (finalForm[key] && finalForm[key] !== '') {
            data.append(key, finalForm[key]);
          }
        });

        data.append('photo', finalForm.photo);

        if (finalForm.customFields && Object.keys(finalForm.customFields).length > 0) {
          data.append('customFields', JSON.stringify(finalForm.customFields));
        }

        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };

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
        if (finalForm.publisher) jsonData.publisher = finalForm.publisher;
        if (finalForm.edition) jsonData.edition = finalForm.edition;
        if (finalForm.customFields && Object.keys(finalForm.customFields).length > 0) {
          jsonData.customFields = finalForm.customFields;
        }

        const config = {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };

        if (editingId) {
          response = await axios.put(`/api/items/${editingId}`, jsonData, config);
        } else {
          response = await axios.post('/api/items', jsonData, config);
        }
      }

      setSnackbar({ 
        open: true, 
        message: editingId ? 'Item updated!' : 'Item added!', 
        severity: 'success' 
      });
      
      const defaultCustomFields = {};
      customFieldsConfig.filter(field => field && field.name).forEach(field => {
        if (field.defaultValue) {
          defaultCustomFields[field.name] = field.defaultValue;
        }
      });
      
      setForm({ 
        name: '', 
        title: '',
        quantity: 1, 
        location: '', 
        notes: '', 
        category: '', 
        photo: null, 
        customFields: defaultCustomFields,
        isbn13: '',
        isbn10: '',
        status: '',
        publisher: '',
        edition: ''
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
    const defaultCustomFields = {};
    customFieldsConfig.filter(field => field && field.name).forEach(field => {
      if (field.defaultValue) {
        defaultCustomFields[field.name] = field.defaultValue;
      }
    });
    
    setForm({ 
      name: '', 
      title: '',
      quantity: 1, 
      location: '', 
      notes: '', 
      category: '', 
      photo: null, 
      customFields: defaultCustomFields,
      isbn13: '',
      status: '',
      publisher: '',
      edition: ''
    });
    setImagePreview(null);
    setEditingId(null);
    setOpenDialog(true);
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
      status: '',
      publisher: '',
      edition: ''
    });
    setImagePreview(null);
  };

  // Filter, sort, and paginate items
  const filteredItems = (Array.isArray(items) ? items : []).filter(item => {
    const searchLower = search.toLowerCase();
    const matchesSearch = (
      item.name?.toLowerCase().includes(searchLower) ||
      item.title?.toLowerCase().includes(searchLower) ||
      item.isbn13?.toLowerCase().includes(searchLower) ||
      item.location?.toLowerCase().includes(searchLower) ||
      item.notes?.toLowerCase().includes(searchLower) ||
      item.publisher?.toLowerCase().includes(searchLower) ||
      (item.category?.name?.toLowerCase().includes(searchLower))
    );
    
    const matchesCategory = !categoryFilter || item.category?._id === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Sort items alphabetically by title, then by name
  const sortedItems = filteredItems.sort((a, b) => {
    const titleA = (a.title || a.name || '').toLowerCase();
    const titleB = (b.title || b.name || '').toLowerCase();
    return titleA.localeCompare(titleB);
  });

  // Calculate pagination
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = sortedItems.slice(startIndex, startIndex + itemsPerPage);

  // Handle page change
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset to page 1 when search or filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Typography>Loading items...</Typography>
      </Box>
    );
  }

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
        Items (Safe Mode)
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
          placeholder="Search by title, ISBN, publisher..."
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
          
          {/* Category Filter */}
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: { xs: '100%', sm: 200 }
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
          
          {/* Clear Filters Button */}
          {(search || categoryFilter) && (
            <Button 
              variant="outlined" 
              size="small"
              sx={{ 
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
          {/* Pagination info */}
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
          
          {/* Pagination Controls */}
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
      
      {/* Floating Action Button */}
      <Fab 
        color="primary" 
        aria-label="add" 
        onClick={handleAddClick} 
        sx={{ 
          position: 'fixed', 
          bottom: { xs: 20, sm: 32 }, 
          right: { xs: 20, sm: 32 }, 
          zIndex: 100,
          width: { xs: 48, sm: 56 },
          height: { xs: 48, sm: 56 }
        }}
      >
        <AddIcon />
      </Fab>
      
      {/* Add/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleDialogClose} 
        maxWidth="sm" 
        fullWidth
        fullScreen={{ xs: true, sm: false }}
      >
        <DialogTitle>
          {editingId ? 'Edit Item' : 'Add Item'}
        </DialogTitle>
        <DialogContent>
          <form id="item-form" onSubmit={handleSubmit}>
            <TextField 
              name="title" 
              label="Book Title *" 
              value={form.title || ''} 
              onChange={handleChange} 
              required
              fullWidth 
              margin="normal"
            />
            
            <TextField 
              name="isbn13" 
              label="ISBN-13 *" 
              value={form.isbn13 || ''} 
              onChange={handleChange} 
              required
              fullWidth 
              margin="normal"
            />
            
            <TextField 
              name="quantity" 
              label="Quantity *" 
              type="number" 
              value={form.quantity || 1} 
              onChange={handleChange} 
              required 
              fullWidth
              margin="normal"
            />
            
            <TextField 
              name="location" 
              label="Location *" 
              value={form.location || ''} 
              onChange={handleChange} 
              fullWidth 
              required
              margin="normal"
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Status *</InputLabel>
              <Select 
                name="status" 
                value={form.status || ''} 
                onChange={handleChange} 
                label="Status"
                required
              >
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="low-stock">Low Stock</MenuItem>
                <MenuItem value="out-of-stock">Out of Stock</MenuItem>
                <MenuItem value="ordered">Ordered</MenuItem>
                <MenuItem value="discontinued">Discontinued</MenuItem>
              </Select>
            </FormControl>
            
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
            
            <Button variant="contained" component="label" fullWidth sx={{ mt: 2 }}>
              Upload Image
              <input name="photo" type="file" accept="image/*" hidden onChange={handleChange} />
            </Button>
            {imagePreview && <img src={imagePreview} alt="Preview" style={{ maxWidth: 120, maxHeight: 120, marginTop: 8, borderRadius: 8 }} />}
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button type="submit" form="item-form" variant="contained" color="primary">
            {editingId ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ItemsSafe;
