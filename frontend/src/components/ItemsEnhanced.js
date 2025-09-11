// Enhanced Items component with core features but safer MUI implementation
import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import {
  Button, TextField, Select, MenuItem, InputLabel, FormControl, 
  Card, CardContent, CardActions, Typography, Grid, IconButton, 
  Dialog, DialogTitle, DialogContent, DialogActions, Fab, 
  Snackbar, Alert, Box, Pagination, CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';

function ItemsEnhanced() {
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
    status: 'available',
    publisher: '',
    edition: ''
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
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
      fetchCategories()
    ]).finally(() => setLoading(false));
  }, []);

  const fetchItems = async () => {
    try {
      console.log('📦 Fetching items...');
      const res = await axios.get('/api/items');
      const itemsData = res.data.items || res.data || [];
      const realItemsArray = Array.isArray(itemsData) ? itemsData : [];
      console.log('✅ Items loaded:', realItemsArray.length);
      setItems(realItemsArray);
    } catch (err) {
      console.error('❌ Items error:', err);
      setItems([]);
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.error || 'Failed to load items', 
        severity: 'error' 
      });
    }
  };
  
  const fetchCategories = async () => {
    try {
      console.log('📂 Fetching categories...');
      const res = await axios.get('/api/categories');
      const categoriesData = Array.isArray(res.data) ? res.data : [];
      console.log('✅ Categories loaded:', categoriesData.length);
      setCategories(categoriesData.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      console.error('❌ Categories error:', err);
      setCategories([]);
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.error || 'Failed to load categories', 
        severity: 'error' 
      });
    }
  };

  const handleChange = e => {
    const { name, value, files } = e.target;
    
    if (name === 'photo') {
      setForm({ ...form, photo: files[0] });
      if (files[0]) {
        setImagePreview(URL.createObjectURL(files[0]));
      }
    } else {
      const updatedForm = { ...form, [name]: value };
      
      // Auto-generate name from title if name is empty
      if (name === 'title' && !form.name) {
        updatedForm.name = value;
      }
      
      setForm(updatedForm);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    if (!form.title || !form.isbn13 || !form.location || !form.status) {
      setSnackbar({ 
        open: true, 
        message: 'Please fill in required fields: Title, ISBN-13, Location, Status', 
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
        name: form.name || form.title
      };

      console.log('💾 Saving item...', editingId ? 'UPDATE' : 'CREATE');

      let response;

      if (finalForm.photo) {
        // FormData for image upload
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

        const config = { headers: { 'Authorization': `Bearer ${token}` } };

        if (editingId) {
          response = await axios.put(`/api/items/${editingId}`, data, config);
        } else {
          response = await axios.post('/api/items', data, config);
        }
      } else {
        // JSON for no image
        const jsonData = {
          name: finalForm.name,
          title: finalForm.title,
          category: finalForm.category || '',
          quantity: finalForm.quantity,
          location: finalForm.location,
          notes: finalForm.notes || '',
          isbn13: finalForm.isbn13,
          isbn10: finalForm.isbn10 || '',
          status: finalForm.status,
          publisher: finalForm.publisher || '',
          edition: finalForm.edition || ''
        };

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

      console.log('✅ Item saved successfully');
      setSnackbar({ 
        open: true, 
        message: editingId ? 'Item updated!' : 'Item added!', 
        severity: 'success' 
      });
      
      // Reset form
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
        status: 'available',
        publisher: '',
        edition: ''
      });
      setImagePreview(null);
      setEditingId(null);
      setOpenDialog(false);
      fetchItems();
    } catch (err) {
      console.error('❌ Save item error:', err);
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.error || err.message || 'Failed to save item', 
        severity: 'error' 
      });
    }
  };

  const handleEdit = item => {
    console.log('✏️ Editing item:', item.name);
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
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('🗑️ Deleting item:', id);
      await axios.delete(`/api/items/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ Item deleted');
      setSnackbar({ open: true, message: 'Item deleted!', severity: 'success' });
      fetchItems();
    } catch (err) {
      console.error('❌ Delete item error:', err);
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.error || err.message || 'Failed to delete item', 
        severity: 'error' 
      });
    }
  };

  const handleAddClick = () => {
    console.log('➕ Adding new item');
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
      status: 'available',
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
    setImagePreview(null);
  };

  // Filter and sort items
  const filteredItems = (Array.isArray(items) ? items : []).filter(item => {
    const searchLower = (search || '').toLowerCase();
    const matchesSearch = !search || (
      (item.name && item.name.toLowerCase().includes(searchLower)) ||
      (item.title && item.title.toLowerCase().includes(searchLower)) ||
      (item.isbn13 && item.isbn13.toLowerCase().includes(searchLower)) ||
      (item.location && item.location.toLowerCase().includes(searchLower)) ||
      (item.publisher && item.publisher.toLowerCase().includes(searchLower))
    );
    
    const matchesCategory = !categoryFilter || (item.category && item.category._id === categoryFilter);
    
    return matchesSearch && matchesCategory;
  });

  // Sort items
  const sortedItems = filteredItems.sort((a, b) => {
    const titleA = (a.title || a.name || '').toLowerCase();
    const titleB = (b.title || b.name || '').toLowerCase();
    return titleA.localeCompare(titleB);
  });

  // Pagination
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = sortedItems.slice(startIndex, startIndex + itemsPerPage);

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
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading items...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      position: 'relative', 
      minHeight: '80vh', 
      pb: 6, 
      px: { xs: 1, sm: 2 }
    }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, textAlign: 'center', mt: 2, mb: 2 }}>
        Items ({items.length} total)
      </Typography>
      
      {/* Search and Filter Section */}
      <Box sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
        <TextField
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title, ISBN, publisher..."
          variant="outlined"
          size="small"
          fullWidth
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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
            <Button variant="outlined" size="small" onClick={() => { setSearch(''); setCategoryFilter(''); }}>
              Clear Filters
            </Button>
          )}
        </Box>
      </Box>
      
      {/* Results Info */}
      {sortedItems.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No items found.
          </Typography>
          <Typography color="text.secondary">
            {items.length === 0 ? 'Click the + button to add your first item.' : 'Try adjusting your search or filters.'}
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedItems.length)} of {sortedItems.length} items
              {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
            </Typography>
          </Box>
          
          <Grid container spacing={3} justifyContent="center">
            {paginatedItems.map(item => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: '0.2s',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 }
                }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    {item.photo && (
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <img 
                          src={item.photo} 
                          alt={item.name} 
                          style={{ 
                            maxWidth: '100%', 
                            maxHeight: 120, 
                            borderRadius: 8,
                            objectFit: 'contain'
                          }} 
                        />
                      </Box>
                    )}
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {item.name}
                    </Typography>
                    {item.title && item.title !== item.name && (
                      <Typography color="text.secondary" sx={{ fontStyle: 'italic', mb: 1 }}>
                        {item.title}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      <strong>Qty:</strong> {item.quantity}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Location:</strong> {item.location}
                    </Typography>
                    {item.isbn13 && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>ISBN:</strong> {item.isbn13}
                      </Typography>
                    )}
                    {item.category && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Category:</strong> {item.category.name}
                      </Typography>
                    )}
                    {item.status && (
                      <Typography 
                        variant="body2" 
                        color={
                          item.status === 'available' ? 'success.main' :
                          item.status === 'low-stock' ? 'warning.main' :
                          item.status === 'out-of-stock' ? 'error.main' :
                          'text.secondary'
                        }
                        sx={{ fontWeight: 500 }}
                      >
                        <strong>Status:</strong> {item.status.replace('-', ' ')}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'center' }}>
                    <IconButton color="primary" onClick={() => handleEdit(item)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(item._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination 
                count={totalPages} 
                page={currentPage} 
                onChange={handlePageChange}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}
      
      {/* Add Button */}
      <Fab 
        color="primary" 
        aria-label="add" 
        onClick={handleAddClick} 
        sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 100 }}
      >
        <AddIcon />
      </Fab>
      
      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Edit Item' : 'Add Item'}
        </DialogTitle>
        <DialogContent>
          <form id="item-form" onSubmit={handleSubmit}>
            <TextField 
              name="title" 
              label="Book Title *" 
              value={form.title} 
              onChange={handleChange} 
              required
              fullWidth 
              margin="normal"
            />
            
            <TextField 
              name="isbn13" 
              label="ISBN-13 *" 
              value={form.isbn13} 
              onChange={handleChange} 
              required
              fullWidth 
              margin="normal"
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField 
                name="quantity" 
                label="Quantity *" 
                type="number" 
                value={form.quantity} 
                onChange={handleChange} 
                required 
                sx={{ width: '30%' }}
                margin="normal"
                inputProps={{ min: 0 }}
              />
              
              <TextField 
                name="location" 
                label="Location *" 
                value={form.location} 
                onChange={handleChange} 
                required
                sx={{ width: '70%' }}
                margin="normal"
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Status *</InputLabel>
                <Select 
                  name="status" 
                  value={form.status} 
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
                  value={form.category} 
                  onChange={handleChange} 
                  label="Category"
                >
                  <MenuItem value="">None</MenuItem>
                  {categories.map(cat => (
                    <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <TextField 
              name="publisher" 
              label="Publisher" 
              value={form.publisher} 
              onChange={handleChange} 
              fullWidth 
              margin="normal"
            />
            
            <TextField 
              name="notes" 
              label="Notes" 
              value={form.notes} 
              onChange={handleChange} 
              fullWidth 
              multiline 
              rows={2}
              margin="normal"
            />
            
            <Button variant="contained" component="label" fullWidth sx={{ mt: 2 }}>
              Upload Image
              <input name="photo" type="file" accept="image/*" hidden onChange={handleChange} />
            </Button>
            {imagePreview && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <img src={imagePreview} alt="Preview" style={{ maxWidth: 120, maxHeight: 120, borderRadius: 8 }} />
              </Box>
            )}
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

export default ItemsEnhanced;
