// Enhanced inventory management system with fixed cases display
// DC4 Inventory Management System - Item Type Selector
import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import {
  Button, TextField, Select, MenuItem, InputLabel, FormControl, Card, CardContent, CardActions, Typography, Grid, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Box, Pagination, Checkbox, FormControlLabel, SpeedDial, SpeedDialAction
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import BarcodeScanner from './BarcodeScanner';

function Items() {
  // VERSION 5.0 - Check localStorage for direct HTML flags
  const [initialType] = useState(() => {
    if (localStorage.getItem('showAddItemForm') === 'true') {
      const selectedType = localStorage.getItem('selectedItemType') || 'item';
      localStorage.removeItem('showAddItemForm');
      localStorage.removeItem('selectedItemType');
      return selectedType;
    }
    return 'item';
  });
  // FORCE CODE CHANGES TO BE OBVIOUS - VERSION 2.0.0
  console.log('� Items component loaded - VERSION 2.0.0 - DIRECT SOURCE CODE EDIT');
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
    cases: 0,
    caseQty: 0,
    total: 0,
    status: '',
    publisher: '',
    edition: '',
    subject: '',
    gradeLevel: ''
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  // Simple and clean type selector implementation
  // (Deprecated modal type selector removed in favor of animated SpeedDial)
  const [selectedItemType, setSelectedItemType] = useState('item'); // 'item' or 'book'
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [customFieldsConfig, setCustomFieldsConfig] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanMode, setScanMode] = useState('search'); // 'search' or 'add'
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;
  
  // Bulk delete state
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
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
      const updatedForm = { ...form, [e.target.name]: e.target.value };
      
      // Auto-generate name from title for books if name is empty
      if (selectedItemType === 'book' && e.target.name === 'title' && !form.name) {
        updatedForm.name = e.target.value;
      }
      
      setForm(updatedForm);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (selectedItemType === 'book') {
      // Book validation
      if (!form.title?.trim()) errors.title = 'Book title is required';
      if (form.quantity < 0) errors.quantity = 'Quantity cannot be negative';
      if (!form.location?.trim()) errors.location = 'Location is required';
      if (!form.status) errors.status = 'Status is required';
    } else {
      // General item validation
      if (!form.name?.trim()) errors.name = 'Item name is required';
      if (form.quantity < 0) errors.quantity = 'Quantity cannot be negative';
      if (!form.location?.trim()) errors.location = 'Location is required';
      if (!form.status) errors.status = 'Status is required';
    }
    
    // Category validation - if selected, must exist
    if (form.category) {
      const categoryExists = categories.some(cat => cat._id === form.category);
      if (!categoryExists) {
        errors.category = 'Selected category is invalid';
      }
    }
    
    // Custom fields validation
    customFieldsConfig.filter(field => field && field.type).forEach(field => {
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
    
    // Auto-generate name from title if name is empty
    if (!form.name.trim() && form.title.trim()) {
      setForm(prev => ({ ...prev, name: form.title }));
    }
    
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

      // Ensure name is set from title if not provided
      const finalForm = {
        ...form,
        name: form.name.trim() || form.title.trim()
      };

      let response;

      // If there's a photo, use FormData (multipart)
      if (finalForm.photo) {
        console.log('📸 Uploading with image...');
        const data = new FormData();
        
        // Only add essential fields to avoid "too many parts" error
        const essentialFields = [
          'name', 'title', 'quantity', 'location', 'category', 'notes',
          'isbn13', 'isbn10', 'publisher', 'edition', 'status'
        ];

        essentialFields.forEach(key => {
          if (finalForm[key] && finalForm[key] !== '') {
            data.append(key, finalForm[key]);
            console.log(`📋 Added ${key}:`, finalForm[key]);
          }
        });

        // Add photo
        data.append('photo', finalForm.photo);
        console.log('📋 Added photo:', finalForm.photo.name);

        // Add customFields if present
        if (finalForm.customFields && Object.keys(finalForm.customFields).length > 0) {
          data.append('customFields', JSON.stringify(finalForm.customFields));
          console.log('📋 Added customFields:', JSON.stringify(finalForm.customFields));
        }

        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
            // Don't set Content-Type for FormData - let axios handle it
          }
        };

        if (editingId) {
          response = await axios.put(`/api/items/${editingId}`, data, config);
        } else {
          response = await axios.post('/api/items', data, config);
        }
      } else {
        // No photo, use JSON
        console.log('📝 Uploading without image...');
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

        // Add optional fields only if they have values
        if (finalForm.isbn10) jsonData.isbn10 = finalForm.isbn10;
        if (finalForm.publisher) jsonData.publisher = finalForm.publisher;
        if (finalForm.edition) jsonData.edition = finalForm.edition;
        if (finalForm.customFields && Object.keys(finalForm.customFields).length > 0) {
          jsonData.customFields = finalForm.customFields;
        }

        console.log('📋 JSON data being sent:', jsonData);

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
      
      // Reset form with default values for custom fields
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
        cases: 0,
        caseQty: 0,
        total: 0,
        status: '',
        publisher: '',
        edition: '',
        subject: '',
        gradeLevel: ''
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
    // Determine if this is a book based on its properties
    const isBook = !!(item.isbn13 || item.isbn10 || item.title || 
      (item.category && categories.find(c => c._id === item.category)?.name?.toLowerCase().includes('book')));
    
    setSelectedItemType(isBook ? 'book' : 'item');
    setForm({
      ...item,
      photo: item.photo || null, // Keep the existing photo URL
      customFields: item.customFields || {}
    });
    setEditingId(item._id);
    // Don't set imagePreview for existing images - let the form.photo handle it
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

  // Bulk delete functions
  const handleSelectItem = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === paginatedItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(paginatedItems.map(item => item._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedItems.size} item(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Delete items in parallel
      const deletePromises = Array.from(selectedItems).map(id =>
        axios.delete(`/api/items/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      );

      await Promise.all(deletePromises);
      
      setSnackbar({ 
        open: true, 
        message: `Successfully deleted ${selectedItems.size} item(s)!`, 
        severity: 'success' 
      });
      
      setSelectedItems(new Set());
      setBulkDeleteMode(false);
      fetchItems();
    } catch (err) {
      console.error('Bulk delete error:', err);
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.error || err.message || 'Failed to delete items', 
        severity: 'error' 
      });
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete ALL items? This action cannot be undone and will delete every item in your inventory!')) {
      return;
    }
    
    if (!confirm('This will permanently delete ALL inventory items. Type DELETE to confirm:') || 
        prompt('Type "DELETE" to confirm:') !== 'DELETE') {
      return;
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      await axios.delete('/api/items/bulk/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setSnackbar({ 
        open: true, 
        message: 'All items deleted successfully!', 
        severity: 'success' 
      });
      
      setSelectedItems(new Set());
      setBulkDeleteMode(false);
      fetchItems();
    } catch (err) {
      console.error('Delete all error:', err);
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.error || err.message || 'Failed to delete all items', 
        severity: 'error' 
      });
    }
  };

  // Open dialog directly for a given type (used by SpeedDial actions)
  const openAddDialog = (type) => {
    setSelectedItemType(type);
    setEditingId(null);
    // Reset form when starting a new add flow
    setForm(prev => ({
      ...prev,
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
      cases: 0,
      caseQty: 0,
      total: 0,
      status: '',
      publisher: '',
      edition: '',
      subject: '',
      gradeLevel: ''
    }));
    setImagePreview(null);
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setEditingId(null);
    setForm({ name: '', quantity: 1, location: '', notes: '', category: '', photo: null, customFields: {} });
    setImagePreview(null);
  };

  // Handle removing image from item
  const handleRemoveImage = async () => {
    if (!editingId) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/items/${editingId}/image`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        // Update the form to remove the photo
        setForm(prev => ({ ...prev, photo: null }));
        
        // Show success message
        setSnackbar({
          open: true,
          message: 'Image removed successfully!',
          severity: 'success'
        });
        
        // Refresh the items list to reflect the change
        fetchItems();
      } else {
        throw new Error('Failed to remove image');
      }
    } catch (error) {
      console.error('Error removing image:', error);
      setSnackbar({
        open: true,
        message: 'Failed to remove image. Please try again.',
        severity: 'error'
      });
    }
  };

  // Filter items by search and category
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
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset to page 1 when search or filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter]);

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
    <Box sx={{ 
      position: 'relative', 
      minHeight: '80vh', 
      pb: 6, 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      px: { xs: 1, sm: 2 }, // Mobile padding
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
          fontSize: { xs: '1.75rem', sm: '2.125rem' } // Responsive font size
        }}
      >
        Items
      </Typography>
      
      {/* Search and Filter Section - Mobile Responsive */}
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
        
        {/* Mobile-friendly button and filter layout */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 2 },
          alignItems: { xs: 'stretch', sm: 'center' },
          mb: 1
        }}>
          {/* Quick add general item button (opens item form directly). Optional. */}
          <Button
            variant="contained"
            color="primary"
            onClick={() => openAddDialog('item')}
            size="medium"
            sx={{ 
              order: { xs: 1, sm: 1 },
              minHeight: '40px',
              fontWeight: 'bold'
            }}
          >
            Add Item
          </Button>
          
          {/* Barcode Search Button */}
          <Button
            variant="outlined"
            startIcon={<QrCodeScannerIcon />}
            onClick={openScannerForSearch}
            size="small"
            sx={{ 
              order: { xs: 2, sm: 2 },
              minHeight: '40px'
            }}
          >
            Scan to Search
          </Button>
          
          {/* Category Filter */}
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
          
          {/* Clear Filters Button */}
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
        
        {/* Bulk Delete Controls - SuperAdmin Only */}
        {userRole === 'superadmin' && (
          <Box sx={{ 
            mt: 2, 
            p: 2, 
            border: '1px solid #ddd', 
            borderRadius: 2,
            backgroundColor: '#f9f9f9'
          }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              SuperAdmin Tools
            </Typography>
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1,
              alignItems: { xs: 'stretch', sm: 'center' }
            }}>
              <Button
                variant={bulkDeleteMode ? "contained" : "outlined"}
                color={bulkDeleteMode ? "secondary" : "primary"}
                size="small"
                onClick={() => {
                  setBulkDeleteMode(!bulkDeleteMode);
                  setSelectedItems(new Set());
                }}
              >
                {bulkDeleteMode ? "Exit Select Mode" : "Select Multiple Items"}
              </Button>
              
              {bulkDeleteMode && (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleSelectAll}
                    disabled={paginatedItems.length === 0}
                  >
                    {selectedItems.size === paginatedItems.length ? "Deselect All" : "Select All"}
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={handleBulkDelete}
                    disabled={selectedItems.size === 0}
                  >
                    Delete Selected ({selectedItems.size})
                  </Button>
                </>
              )}
              
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={handleDeleteAll}
                sx={{ ml: { sm: 'auto' } }}
              >
                Delete ALL Items
              </Button>
            </Box>
          </Box>
        )}
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
                  height: '100%', // Ensure consistent card heights
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}>
                  {/* Bulk Delete Checkbox */}
                  {bulkDeleteMode && (
                    <Checkbox
                      checked={selectedItems.has(item._id)}
                      onChange={() => handleSelectItem(item._id)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '50%',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 1)',
                        }
                      }}
                    />
                  )}
                  
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
                      {item.isbn13 && (
                        <Typography color="text.secondary" variant="body2" sx={{ 
                          textAlign: 'center',
                          fontSize: { xs: '0.7rem', sm: '0.75rem' },
                          wordBreak: 'break-all'
                        }}>
                          ISBN: {item.isbn13}
                        </Typography>
                      )}
                      {item.publisher && (
                        <Typography color="text.secondary" variant="body2" sx={{ 
                          textAlign: 'center',
                          fontSize: { xs: '0.7rem', sm: '0.75rem' }
                        }}>
                          {item.publisher}
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
                      {item.notes && (
                        <Typography color="text.secondary" sx={{ 
                          textAlign: 'center',
                          fontSize: { xs: '0.7rem', sm: '0.75rem' },
                          mt: 1
                        }}>
                          Notes: {item.notes}
                        </Typography>
                      )}
                      {item.customFields && Object.entries(item.customFields).map(([key, value]) => (
                        <Typography color="text.secondary" key={key} sx={{ 
                          textAlign: 'center',
                          fontSize: { xs: '0.7rem', sm: '0.75rem' }
                        }}>
                          {key}: {value}
                        </Typography>
                      ))}
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
          
          {/* Pagination Controls - Mobile Responsive */}
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
                sx={{
                  '& .MuiPaginationItem-root': {
                    fontSize: { xs: '0.75rem', sm: '1rem' },
                    minWidth: { xs: '28px', sm: '32px' },
                    height: { xs: '28px', sm: '32px' }
                  }
                }}
              />
            </Box>
          )}
        </>
      )}
      
      {/* Animated SpeedDial for choosing item type */}
      <SpeedDial
        ariaLabel="add-item-speed-dial"
        icon={<AddIcon />}
        sx={{
          position: 'fixed',
          bottom: { xs: 20, sm: 32 },
          right: { xs: 20, sm: 32 },
          zIndex: 1300,
          '& .MuiFab-primary': {
            animation: 'pulse 1.8s infinite',
            '@keyframes pulse': {
              '0%': { boxShadow: '0 0 0 0 rgba(33,150,243,0.6)' },
              '70%': { boxShadow: '0 0 0 12px rgba(33,150,243,0)' },
              '100%': { boxShadow: '0 0 0 0 rgba(33,150,243,0)' }
            }
          }
        }}
      >
        <SpeedDialAction
          icon={<Box component="span" sx={{ fontSize: 22, lineHeight: 1 }}>📦</Box>}
          tooltipTitle="Add General Item"
          onClick={() => openAddDialog('item')}
        />
        <SpeedDialAction
          icon={<Box component="span" sx={{ fontSize: 22, lineHeight: 1 }}>📚</Box>}
          tooltipTitle="Add Book"
          onClick={() => openAddDialog('book')}
        />
      </SpeedDial>
      
      {/* Mobile-responsive Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleDialogClose} 
        maxWidth="sm" 
        fullWidth
        fullScreen={{ xs: true, sm: false }} // Full screen on mobile
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 0, sm: 2 },
            width: { xs: '100%', sm: 'calc(100% - 64px)' },
            maxHeight: { xs: '100%', sm: 'calc(100% - 64px)' }
          }
        }}
      >
        <DialogTitle sx={{ 
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
          py: { xs: 1, sm: 2 }
        }}>
          {editingId ? `Edit ${selectedItemType === 'book' ? 'Book' : 'Item'}` : `Add ${selectedItemType === 'book' ? 'Book' : 'Item'}`}
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
          {console.log('🔥 Main dialog rendering with selectedItemType:', selectedItemType, 'openDialog:', openDialog)}
          <form id="item-form" onSubmit={handleSubmit} encType="multipart/form-data">
            <Grid container spacing={{ xs: 1, sm: 2 }} alignItems="center">
              {/* Essential Fields */}
              <Grid item xs={12}>
                <TextField 
                  name={selectedItemType === 'book' ? 'title' : 'name'}
                  label={selectedItemType === 'book' ? 'Book Title *' : 'Item Name *'}
                  value={selectedItemType === 'book' ? (form.title || '') : (form.name || form.title || '')} 
                  onChange={handleChange} 
                  required
                  fullWidth 
                  margin="normal"
                  size={{ xs: 'small', sm: 'medium' }}
                />
              </Grid>
              
              {/* Show ISBN field for books */}
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
                    size={{ xs: 'small', sm: 'medium' }}
                  />
                </Grid>
              )}
              
              <Grid item xs={12} sm={6}>
                <TextField 
                  name="quantity" 
                  label="Quantity *" 
                  type="number" 
                  inputProps={{ 
                    min: "0",
                    style: { textAlign: 'center' }
                  }}
                  value={form.quantity} 
                  onChange={handleChange} 
                  required 
                  fullWidth
                  margin="normal"
                  error={!!formErrors.quantity}
                  helperText={formErrors.quantity}
                  size={{ xs: 'small', sm: 'medium' }}
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
                  size={{ xs: 'small', sm: 'medium' }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl 
                  fullWidth 
                  margin="normal" 
                  error={!!formErrors.category}
                  size={{ xs: 'small', sm: 'medium' }}
                >
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
                  {formErrors.category && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                      {formErrors.category}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl 
                  fullWidth 
                  margin="normal"
                  size={{ xs: 'small', sm: 'medium' }}
                >
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

              {/* Optional Fields - Collapsible */}
              <Grid item xs={12}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    mt: 2, 
                    mb: 1, 
                    color: 'text.secondary',
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}
                >
                  Additional Information (Optional)
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TextField 
                  name="description" 
                  label="Description" 
                  value={form.description || ''} 
                  onChange={handleChange} 
                  fullWidth 
                  multiline 
                  rows={{ xs: 2, sm: 3 }}
                  margin="normal"
                  size={{ xs: 'small', sm: 'medium' }}
                />
              </Grid>

              {/* Book-specific fields - Only show when selectedItemType is 'book' */}
              {selectedItemType === 'book' && (
                <>
                  <Grid item xs={12}>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        mt: 1, 
                        mb: 1, 
                        color: 'primary.main',
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }}
                    >
                      Book Information
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      name="publisher" 
                      label="Publisher" 
                      value={form.publisher || ''} 
                      onChange={handleChange} 
                      fullWidth 
                      margin="normal"
                      size={{ xs: 'small', sm: 'medium' }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      name="edition" 
                      label="Edition" 
                      value={form.edition || ''} 
                      onChange={handleChange} 
                      fullWidth 
                      margin="normal"
                      size={{ xs: 'small', sm: 'medium' }}
                    />
                  </Grid>
                </>
              )}
              
              <Grid item xs={12}>
                <TextField 
                  name="notes" 
                  label="Notes" 
                  value={form.notes || ''} 
                  onChange={handleChange} 
                  fullWidth 
                  multiline 
                  rows={{ xs: 2, sm: 3 }}
                  margin="normal"
                  size={{ xs: 'small', sm: 'medium' }}
                />
              </Grid>
                {customFieldsConfig.filter(field => field && field.type).map((field, idx) => (
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
                          {(field.options || []).map((opt, i) => (
                            <MenuItem key={i} value={opt}>{opt}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </Grid>
                ))}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {/* DEBUG INFO - Remove this after testing */}
                  <Typography variant="caption" sx={{ color: 'red', backgroundColor: 'yellow', p: 1 }}>
                    DEBUG: editingId={editingId ? 'YES' : 'NO'} | form.photo={form.photo ? 'YES' : 'NO'} | imagePreview={imagePreview ? 'YES' : 'NO'}
                  </Typography>
                  
                  <Button variant="contained" component="label" fullWidth>
                    {editingId && form.photo ? 'Replace Image' : 'Upload Image'}
                    <input name="photo" type="file" accept="image/*" hidden onChange={handleChange} />
                  </Button>
                  
                  {/* Show current image if editing and has image */}
                  {editingId && form.photo && !imagePreview && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <img 
                        src={form.photo} 
                        alt="Current" 
                        style={{ 
                          maxWidth: 120, 
                          maxHeight: 120, 
                          borderRadius: 8,
                          border: '1px solid #ddd'
                        }} 
                      />
                      <Button 
                        variant="outlined" 
                        color="error" 
                        size="small"
                        onClick={handleRemoveImage}
                        sx={{ ml: 1 }}
                      >
                        Remove Image
                      </Button>
                    </Box>
                  )}
                  
                  {/* Show new image preview */}
                  {imagePreview && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        New image preview:
                      </Typography>
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
                    </Box>
                  )}
                </Box>
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
        <DialogActions sx={{ 
          px: { xs: 2, sm: 3 }, 
          pb: { xs: 2, sm: 3 },
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          gap: { xs: 1, sm: 0 }
        }}>
          <Button 
            onClick={handleDialogClose}
            fullWidth={{ xs: true, sm: false }}
            sx={{ minWidth: { sm: 'auto' } }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="item-form" 
            variant="contained" 
            color="primary"
            fullWidth={{ xs: true, sm: false }}
            sx={{ minWidth: { sm: 'auto' } }}
          >
            {editingId ? 'Update' : 'Add'}
          </Button>
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

  {/* (Removed legacy type selector dialog now replaced by SpeedDial) */}
    </Box>
  );
}

export default Items;
