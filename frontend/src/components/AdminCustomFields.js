import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Snackbar, Alert } from '@mui/material';
import CustomFieldsManager from './CustomFieldsManager';

const LOCAL_KEY = 'customFieldsConfig';

function AdminCustomFields() {
  const [fields, setFields] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) setFields(JSON.parse(saved));
  }, []);

  const handleSave = () => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(fields));
    setSnackbar({ open: true, message: 'Custom fields saved!', severity: 'success' });
  };

  return (
    <Box maxWidth={600} mx="auto" mt={6}>
      <Typography variant="h4" fontWeight={700} gutterBottom>Manage Custom Fields</Typography>
      <CustomFieldsManager fields={fields} setFields={setFields} />
      <Button variant="contained" color="primary" onClick={handleSave}>Save Custom Fields</Button>
      <Snackbar open={snackbar.open} autoHideDuration={2000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}

export default AdminCustomFields;
