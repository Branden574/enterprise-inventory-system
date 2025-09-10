import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  AttachFile as AttachIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import axios from '../utils/axios';

function CompletedPOForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  
  const [formData, setFormData] = useState({
    poNumber: '',
    title: '',
    description: '',
    vendor: '',
    totalAmount: '',
    orderDate: new Date(),
    department: '',
    category: '',
    notes: ''
  });
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [attachmentsToRemove, setAttachmentsToRemove] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isEditing) {
      fetchCompletedPO();
    }
  }, [id, isEditing]);

  const fetchCompletedPO = async () => {
    try {
      const response = await axios.get(`/api/completed-pos/${id}`);
      const po = response.data;
      
      setFormData({
        poNumber: po.poNumber,
        title: po.title,
        description: po.description || '',
        vendor: po.vendor,
        totalAmount: po.totalAmount?.toString() || '',
        orderDate: new Date(po.orderDate),
        department: po.department || '',
        category: po.category || '',
        notes: po.notes || ''
      });
      
      setExistingAttachments(po.attachments || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch completed purchase order');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveNewFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingAttachment = (filename) => {
    setAttachmentsToRemove(prev => [...prev, filename]);
    setExistingAttachments(prev => prev.filter(att => att.filename !== filename));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const submitData = new FormData();
      
      // Add form data
      Object.keys(formData).forEach(key => {
        if (key === 'orderDate') {
          submitData.append(key, formData[key].toISOString());
        } else {
          submitData.append(key, formData[key]);
        }
      });
      
      // Add new files
      selectedFiles.forEach(file => {
        submitData.append('attachments', file);
      });
      
      if (isEditing) {
        // Add files to remove
        if (attachmentsToRemove.length > 0) {
          submitData.append('removeAttachments', JSON.stringify(attachmentsToRemove));
        }
        
        // Add new files with different field name for editing
        selectedFiles.forEach(file => {
          submitData.append('newAttachments', file);
        });
        
        await axios.put(`/api/completed-pos/${id}`, submitData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        setSuccess('Completed purchase order updated successfully!');
      } else {
        await axios.post('/api/completed-pos', submitData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        setSuccess('Completed purchase order uploaded successfully!');
      }
      
      setTimeout(() => {
        navigate('/completed-pos');
      }, 1500);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save completed purchase order');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (file) => {
    const type = file.type || file.mimetype;
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('word') || type.includes('document')) return '📝';
    return '📎';
  };

  const formatFileSize = (size) => {
    return (size / 1024).toFixed(1) + ' KB';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/completed-pos')} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          {isEditing ? 'Edit Completed Purchase Order' : 'Upload Completed Purchase Order'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Purchase Order Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="PO Number"
                required
                value={formData.poNumber}
                onChange={(e) => handleInputChange('poNumber', e.target.value)}
                disabled={isEditing} // Don't allow changing PO number when editing
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Title"
                required
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Vendor"
                required
                value={formData.vendor}
                onChange={(e) => handleInputChange('vendor', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total Amount"
                type="number"
                value={formData.totalAmount}
                onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                inputProps={{
                  step: "0.01",
                  min: "0"
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Order Date"
                value={formData.orderDate}
                onChange={(date) => handleInputChange('orderDate', date)}
                renderInput={(params) => <TextField {...params} fullWidth required />}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  label="Category"
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="Office Supplies">Office Supplies</MenuItem>
                  <MenuItem value="Equipment">Equipment</MenuItem>
                  <MenuItem value="Software">Software</MenuItem>
                  <MenuItem value="Maintenance">Maintenance</MenuItem>
                  <MenuItem value="Services">Services</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
            </Grid>

            {/* File Upload Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Attachments
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <input
                      accept="image/*,.pdf,.doc,.docx,.xlsx,.xls"
                      style={{ display: 'none' }}
                      id="file-upload"
                      multiple
                      type="file"
                      onChange={handleFileChange}
                    />
                    <label htmlFor="file-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<UploadIcon />}
                        sx={{ mb: 2 }}
                      >
                        Upload Files
                      </Button>
                    </label>
                    <Typography variant="body2" color="text.secondary">
                      Supported formats: Images, PDF, Word documents, Excel files (Max 10MB each)
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Existing Attachments (for editing) */}
            {isEditing && existingAttachments.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Current Attachments
                </Typography>
                <List>
                  {existingAttachments.map((attachment, index) => (
                    <ListItem key={index}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                        <span style={{ marginRight: 8 }}>{getFileIcon(attachment)}</span>
                      </Box>
                      <ListItemText
                        primary={attachment.originalName}
                        secondary={`${formatFileSize(attachment.size)} - Uploaded ${new Date(attachment.uploadDate).toLocaleDateString()}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveExistingAttachment(attachment.filename)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Grid>
            )}

            {/* New Files */}
            {selectedFiles.length > 0 && (
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  {isEditing ? 'New Attachments' : 'Selected Files'}
                </Typography>
                <List>
                  {selectedFiles.map((file, index) => (
                    <ListItem key={index}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                        <span style={{ marginRight: 8 }}>{getFileIcon(file)}</span>
                      </Box>
                      <ListItemText
                        primary={file.name}
                        secondary={formatFileSize(file.size)}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveNewFile(index)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Grid>
            )}

            {/* Submit Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/completed-pos')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? null : <AttachIcon />}
                >
                  {loading ? 'Saving...' : (isEditing ? 'Update PO' : 'Upload PO')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}

export default CompletedPOForm;
