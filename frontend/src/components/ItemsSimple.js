import React from 'react';
import { Typography, Box } from '@mui/material';

function ItemsSimple() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Items Page - Test Version
      </Typography>
      <Typography variant="body1">
        This is a simplified version to test if the basic component works.
      </Typography>
    </Box>
  );
}

export default ItemsSimple;
