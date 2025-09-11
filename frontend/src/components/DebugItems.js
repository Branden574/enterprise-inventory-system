// Debug component to check authentication and API connectivity
import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import {
  Typography, Box, Button, Alert, Paper, Divider
} from '@mui/material';

function DebugItems() {
  const [authInfo, setAuthInfo] = useState({});
  const [apiTests, setApiTests] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    console.log('🔧 Running diagnostics...');
    
    // Check authentication
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    let userRole = null;
    let tokenValid = false;
    
    try {
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userRole = payload.role;
        tokenValid = true;
        console.log('✅ Token decoded successfully:', { role: userRole, exp: new Date(payload.exp * 1000) });
      }
    } catch (error) {
      console.error('❌ Token decode error:', error);
    }
    
    setAuthInfo({
      hasToken: !!token,
      tokenValid,
      userRole,
      tokenSource: token ? (localStorage.getItem('token') ? 'localStorage' : 'sessionStorage') : null
    });

    // Test API endpoints
    const tests = {
      items: { status: 'pending', error: null, data: null },
      categories: { status: 'pending', error: null, data: null },
      customFields: { status: 'pending', error: null, data: null }
    };

    // Test items endpoint
    try {
      console.log('🧪 Testing /api/items...');
      const itemsResponse = await axios.get('/api/items');
      tests.items = {
        status: 'success',
        error: null,
        data: `${itemsResponse.data?.items?.length || itemsResponse.data?.length || 0} items`
      };
      console.log('✅ Items API success:', itemsResponse.data);
    } catch (error) {
      tests.items = {
        status: 'error',
        error: error.response?.data?.message || error.message,
        data: null
      };
      console.error('❌ Items API error:', error);
    }

    // Test categories endpoint
    try {
      console.log('🧪 Testing /api/categories...');
      const categoriesResponse = await axios.get('/api/categories');
      tests.categories = {
        status: 'success',
        error: null,
        data: `${categoriesResponse.data?.length || 0} categories`
      };
      console.log('✅ Categories API success:', categoriesResponse.data);
    } catch (error) {
      tests.categories = {
        status: 'error',
        error: error.response?.data?.message || error.message,
        data: null
      };
      console.error('❌ Categories API error:', error);
    }

    // Test custom fields endpoint
    try {
      console.log('🧪 Testing /api/customFields...');
      const customFieldsResponse = await axios.get('/api/customFields');
      tests.customFields = {
        status: 'success',
        error: null,
        data: `${customFieldsResponse.data?.length || 0} custom fields`
      };
      console.log('✅ Custom fields API success:', customFieldsResponse.data);
    } catch (error) {
      tests.customFields = {
        status: 'error',
        error: error.response?.data?.message || error.message,
        data: null
      };
      console.error('❌ Custom fields API error:', error);
    }

    setApiTests(tests);
    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'success.main';
      case 'error': return 'error.main';
      default: return 'warning.main';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Running diagnostics...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Items Page Diagnostics
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This diagnostic page will help identify why the Items page isn't loading.
      </Alert>

      {/* Authentication Status */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🔐 Authentication Status
        </Typography>
        <Box sx={{ ml: 2 }}>
          <Typography variant="body2">
            <strong>Has Token:</strong> {authInfo.hasToken ? '✅ Yes' : '❌ No'}
          </Typography>
          <Typography variant="body2">
            <strong>Token Valid:</strong> {authInfo.tokenValid ? '✅ Yes' : '❌ No'}
          </Typography>
          <Typography variant="body2">
            <strong>User Role:</strong> {authInfo.userRole || 'Unknown'}
          </Typography>
          <Typography variant="body2">
            <strong>Token Source:</strong> {authInfo.tokenSource || 'None'}
          </Typography>
        </Box>
        
        {!authInfo.hasToken && (
          <Alert severity="error" sx={{ mt: 2 }}>
            No authentication token found. You may need to log in again.
          </Alert>
        )}
      </Paper>

      {/* API Tests */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🌐 API Connectivity Tests
        </Typography>
        
        {Object.entries(apiTests).map(([endpoint, test]) => (
          <Box key={endpoint} sx={{ ml: 2, mb: 2 }}>
            <Typography variant="body2">
              <strong>{getStatusIcon(test.status)} /api/{endpoint}:</strong>{' '}
              <span style={{ color: getStatusColor(test.status) }}>
                {test.status.toUpperCase()}
              </span>
            </Typography>
            {test.data && (
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                {test.data}
              </Typography>
            )}
            {test.error && (
              <Typography variant="body2" color="error.main" sx={{ ml: 2 }}>
                Error: {test.error}
              </Typography>
            )}
          </Box>
        ))}
      </Paper>

      {/* Browser Information */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🌐 Browser Information
        </Typography>
        <Box sx={{ ml: 2 }}>
          <Typography variant="body2">
            <strong>User Agent:</strong> {navigator.userAgent}
          </Typography>
          <Typography variant="body2">
            <strong>Current URL:</strong> {window.location.href}
          </Typography>
          <Typography variant="body2">
            <strong>Local Storage Keys:</strong> {Object.keys(localStorage).join(', ') || 'None'}
          </Typography>
          <Typography variant="body2">
            <strong>Session Storage Keys:</strong> {Object.keys(sessionStorage).join(', ') || 'None'}
          </Typography>
        </Box>
      </Paper>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ textAlign: 'center' }}>
        <Button 
          variant="contained" 
          onClick={runDiagnostics}
          sx={{ mr: 2 }}
        >
          Re-run Diagnostics
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => window.location.href = '/login'}
        >
          Go to Login
        </Button>
      </Box>
    </Box>
  );
}

export default DebugItems;
