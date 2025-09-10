import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  IconButton, 
  Grid, 
  Paper, 
  Select, 
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import axios from '../utils/axios';

const FIELD_TYPES = [
  { label: 'Text', value: 'text' },
  { label: 'Number', value: 'number' },
  { label: 'Date', value: 'date' },
  { label: 'Dropdown', value: 'dropdown' },
];

function CustomFieldsManager() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingField, setEditingField] = useState(null);
  const [newField, setNewField] = useState({ 
    name: '', 
    type: 'text', 
    options: '', 
    required: false,
    description: '',
    defaultValue: ''
  });

  useEffect(() => {
    fetchCustomFields();
  }, []);

  const fetchCustomFields = async () => {
    try {
      const response = await axios.get('/api/customFields');
      setFields(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load custom fields');
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      if (!newField.name.trim()) {
        setError('Field name is required');
        return;
      }

      const fieldData = {
        ...newField,
        options: newField.type === 'dropdown' ? 
          newField.options.split(',').map(o => o.trim()).filter(o => o) : 
          undefined
      };

      const response = await axios.post('/api/customFields', fieldData);
      setFields([...fields, response.data]);
      setNewField({ 
        name: '', 
        type: 'text', 
        options: '', 
        required: false,
        description: '',
        defaultValue: ''
      });
      setSuccess('Custom field added successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add custom field');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this custom field?')) {
      return;
    }

    try {
      await axios.delete(`/api/customFields/${id}`);
      setFields(fields.filter(field => field._id !== id));
      setSuccess('Custom field deleted successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete custom field');
    }
  };

  const handleEdit = (field) => {
    setEditingField(field);
    setNewField({
      name: field.name,
      type: field.type,
      options: field.options ? field.options.join(', ') : '',
      required: field.required || false,
      description: field.description || '',
      defaultValue: field.defaultValue || ''
    });
  };

  const handleUpdate = async () => {
    try {
      const fieldData = {
        ...newField,
        options: newField.type === 'dropdown' ? 
          newField.options.split(',').map(o => o.trim()).filter(o => o) : 
          undefined
      };

      const response = await axios.put(`/api/customFields/${editingField._id}`, fieldData);
      setFields(fields.map(f => f._id === editingField._id ? response.data : f));
      setEditingField(null);
      setNewField({ 
        name: '', 
        type: 'text', 
        options: '', 
        required: false,
        description: '',
        defaultValue: ''
      });
      setSuccess('Custom field updated successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update custom field');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Custom Fields</Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      <Grid container spacing={2} alignItems="start">
        <Grid item xs={12} sm={6}>
          <TextField 
            label="Field Name" 
            value={newField.name} 
            onChange={e => setNewField({ ...newField, name: e.target.value })} 
            fullWidth 
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Field Type</InputLabel>
            <Select
              value={newField.type}
              onChange={e => setNewField({ ...newField, type: e.target.value })}
              label="Field Type"
            >
              {FIELD_TYPES.map(ft => <MenuItem key={ft.value} value={ft.value}>{ft.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField 
            label="Description" 
            value={newField.description} 
            onChange={e => setNewField({ ...newField, description: e.target.value })} 
            fullWidth 
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField 
            label="Default Value" 
            value={newField.defaultValue} 
            onChange={e => setNewField({ ...newField, defaultValue: e.target.value })} 
            fullWidth 
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          {newField.type === 'dropdown' && (
            <TextField 
              label="Options (comma separated)" 
              value={newField.options} 
              onChange={e => setNewField({ ...newField, options: e.target.value })} 
              fullWidth 
              margin="normal"
              helperText="Enter options separated by commas"
            />
          )}
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox 
                checked={newField.required}
                onChange={e => setNewField({ ...newField, required: e.target.checked })}
              />
            }
            label="Required Field"
          />
        </Grid>
        <Grid item xs={12}>
          <Button 
            variant="contained" 
            onClick={editingField ? handleUpdate : handleAdd}
            fullWidth
          >
            {editingField ? 'Update Field' : 'Add Field'}
          </Button>
          {editingField && (
            <Button 
              onClick={() => {
                setEditingField(null);
                setNewField({ 
                  name: '', 
                  type: 'text', 
                  options: '', 
                  required: false,
                  description: '',
                  defaultValue: ''
                });
              }}
              sx={{ mt: 1 }}
              fullWidth
            >
              Cancel Edit
            </Button>
          )}
        </Grid>
      </Grid>
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>Existing Custom Fields</Typography>
        {fields.length === 0 ? (
          <Typography color="text.secondary">No custom fields defined yet.</Typography>
        ) : (
          fields.map((field) => (
            <Paper key={field._id} sx={{ p: 2, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="subtitle1">{field.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Type: {field.type}
                  {field.type === 'dropdown' ? ` (Options: ${field.options.join(', ')})` : ''}
                  {field.required ? ' • Required' : ''}
                  {field.description ? ` • ${field.description}` : ''}
                </Typography>
              </Box>
              <Box>
                <IconButton onClick={() => handleEdit(field)} color="primary">
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDelete(field._id)} color="error">
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Paper>
          ))
        )}
      </Box>
    </Paper>
  );
}

export default CustomFieldsManager;
