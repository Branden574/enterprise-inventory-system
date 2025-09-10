import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Alert, CircularProgress } from '@mui/material';
import axios from '../utils/axios';

function SystemTest() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    setResults({});

    const tests = [
      {
        name: 'Items API',
        url: '/api/items',
        requiresAuth: false
      },
      {
        name: 'Internal Orders API (All)',
        url: '/api/internal-orders',
        requiresAuth: true
      },
      {
        name: 'Internal Orders API (Pending)',
        url: '/api/internal-orders/pending',
        requiresAuth: true
      }
    ];

    const testResults = {};

    for (const test of tests) {
      try {
        console.log(`Testing ${test.name}...`);
        const response = await axios.get(test.url);
        testResults[test.name] = {
          status: 'success',
          data: response.data,
          count: Array.isArray(response.data) ? response.data.length : 1
        };
      } catch (error) {
        console.error(`${test.name} failed:`, error);
        testResults[test.name] = {
          status: 'error',
          error: error.response?.data?.error || error.message,
          statusCode: error.response?.status
        };
      }
    }

    setResults(testResults);
    setLoading(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        System Test - Internal Orders
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={runTests} 
        disabled={loading}
        sx={{ mb: 3 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Run Tests'}
      </Button>

      {Object.entries(results).map(([testName, result]) => (
        <Alert 
          key={testName}
          severity={result.status === 'success' ? 'success' : 'error'}
          sx={{ mb: 2 }}
        >
          <Typography variant="h6">{testName}</Typography>
          {result.status === 'success' ? (
            <Typography>
              ✅ Success - {result.count} items returned
            </Typography>
          ) : (
            <Typography>
              ❌ Error: {result.error} (Status: {result.statusCode})
            </Typography>
          )}
        </Alert>
      ))}
    </Box>
  );
}

export default SystemTest;
