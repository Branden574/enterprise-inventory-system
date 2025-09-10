import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axios from '../utils/axios';

function ImportExport() {
  const [importing, setImporting] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrors, setShowErrors] = useState(false);

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setErrors(['Please upload a CSV file']);
      setShowErrors(true);
      return;
    }

    setImporting(true);
    setErrors([]);
    setSuccessMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/import-export/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 207) {
        // Partial success with errors
        setErrors(response.data.errors);
        setShowErrors(true);
        setSuccessMessage('Import completed with some errors');
      } else {
        setSuccessMessage('Import completed successfully');
      }
    } catch (err) {
      setErrors([err.response?.data?.error || 'Error importing data']);
      setShowErrors(true);
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const response = await axios.get('/api/import-export/export', {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'inventory.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccessMessage('Export completed successfully');
    } catch (err) {
      setErrors(['Error exporting data']);
      setShowErrors(true);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Import/Export Inventory
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Import Inventory
        </Typography>
        <Typography color="text.secondary" paragraph>
          Upload a CSV file to import inventory items. The file should include columns for: Name,
          Quantity, Location, Category, Notes, and any custom fields.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            component="label"
            startIcon={<UploadFileIcon />}
            disabled={importing}
          >
            Upload CSV
            <input
              type="file"
              hidden
              accept=".csv"
              onChange={handleImport}
            />
          </Button>
          {importing && <CircularProgress size={24} sx={{ ml: 1 }} />}
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Export Inventory
        </Typography>
        <Typography color="text.secondary" paragraph>
          Download your current inventory as a CSV file.
        </Typography>
        <Button
          variant="contained"
          onClick={handleExport}
          startIcon={<DownloadIcon />}
          disabled={exportLoading}
        >
          Export CSV
        </Button>
        {exportLoading && <CircularProgress size={24} sx={{ ml: 1 }} />}
      </Paper>

      {successMessage && (
        <Alert 
          severity="success" 
          sx={{ mt: 2 }}
          onClose={() => setSuccessMessage('')}
        >
          {successMessage}
        </Alert>
      )}

      <Dialog open={showErrors} onClose={() => setShowErrors(false)} maxWidth="md" fullWidth>
        <DialogTitle>Import Errors</DialogTitle>
        <DialogContent>
          <List>
            {errors.map((error, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <ErrorIcon color="error" />
                </ListItemIcon>
                <ListItemText primary={error} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowErrors(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ImportExport;
