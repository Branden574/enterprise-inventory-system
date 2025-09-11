// Minimal Items component to test core functionality
import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import {
  Typography, Box, CircularProgress, Alert
} from '@mui/material';

function ItemsMinimal() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      console.log('🚀 Starting fetchItems...');
      const response = await axios.get('/api/items');
      console.log('📦 Items response:', response.data);
      
      const itemsData = response.data?.items || response.data || [];
      console.log('📋 Processed items:', itemsData);
      
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setLoading(false);
    } catch (err) {
      console.error('❌ Error fetching items:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load items');
      setLoading(false);
    }
  };

  console.log('🔄 Component render - loading:', loading, 'items:', items.length, 'error:', error);

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        gap: 2
      }}>
        <CircularProgress />
        <Typography>Loading items...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Error: {error}
        </Alert>
        <Typography variant="h6">Items page failed to load</Typography>
        <Typography color="text.secondary">
          Check the browser console for more details.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Items (Minimal Test)
      </Typography>
      
      <Typography variant="body1" color="success.main" gutterBottom>
        ✅ Items page loaded successfully!
      </Typography>
      
      <Typography variant="h6" gutterBottom>
        Items Count: {items.length}
      </Typography>
      
      {items.length === 0 ? (
        <Typography color="text.secondary">
          No items found. This could be normal if your inventory is empty.
        </Typography>
      ) : (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Sample items:
          </Typography>
          {items.slice(0, 3).map((item, index) => (
            <Box key={item._id || index} sx={{ mb: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>{item.name || item.title || `Item ${index + 1}`}</strong>
                {item.quantity && ` - Qty: ${item.quantity}`}
                {item.location && ` - Location: ${item.location}`}
              </Typography>
            </Box>
          ))}
          {items.length > 3 && (
            <Typography variant="body2" color="text.secondary">
              ...and {items.length - 3} more items
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

export default ItemsMinimal;
