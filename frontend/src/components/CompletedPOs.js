import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  InputAdornment,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  AttachFile as AttachIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import axios from '../utils/axios';

function CompletedPOs() {
  const navigate = useNavigate();
  const [completedPOs, setCompletedPOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPO, setSelectedPO] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  useEffect(() => {
    fetchCompletedPOs();
  }, []);

  const fetchCompletedPOs = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/completed-pos');
      setCompletedPOs(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch completed purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPO = (po) => {
    setSelectedPO(po);
    setViewDialog(true);
  };

  const handleDeletePO = async () => {
    try {
      setError('');
      await axios.delete(`/api/completed-pos/${selectedPO._id}`);
      await fetchCompletedPOs();
      setDeleteDialog(false);
      setSelectedPO(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete completed purchase order');
    }
  };

  const handleDownloadAttachment = async (poId, filename, originalName) => {
    try {
      const response = await axios.get(`/api/completed-pos/${poId}/attachments/${filename}`, {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to download attachment');
    }
  };

  const filteredPOs = completedPOs.filter(po =>
    po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (po.department && po.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatCurrency = (amount) => {
    return amount ? `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'N/A';
  };

  const getFileIcon = (mimetype) => {
    if (mimetype.includes('image')) return '🖼️';
    if (mimetype.includes('pdf')) return '📄';
    if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return '📊';
    if (mimetype.includes('word') || mimetype.includes('document')) return '📝';
    return '📎';
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading completed purchase orders...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Completed Purchase Orders
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={fetchCompletedPOs}>
            <RefreshIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/completed-pos/new')}
          >
            Upload New PO
          </Button>
        </Box>
      </Box>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by PO number, title, vendor, or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {filteredPOs.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            {searchTerm ? 'No completed purchase orders match your search' : 'No completed purchase orders found'}
          </Typography>
          <Typography color="text.secondary">
            {searchTerm ? 'Try adjusting your search terms' : 'Upload your first completed purchase order to get started'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredPOs.map((po) => (
            <Grid item xs={12} md={6} lg={4} key={po._id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h2" noWrap>
                      {po.poNumber}
                    </Typography>
                    <Chip
                      label={po.status}
                      color="success"
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body1" gutterBottom>
                    {po.title}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Vendor: {po.vendor}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Amount: {formatCurrency(po.totalAmount)}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Order Date: {new Date(po.orderDate).toLocaleDateString()}
                  </Typography>
                  
                  {po.department && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Department: {po.department}
                    </Typography>
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                    <AttachIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {po.attachments.length} attachment(s)
                    </Typography>
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Uploaded by {po.uploadedBy?.username} on {new Date(po.createdAt).toLocaleDateString()}
                  </Typography>
                </CardContent>
                
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => handleViewPO(po)}
                  >
                    View
                  </Button>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => navigate(`/completed-pos/edit/${po._id}`)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                      setSelectedPO(po);
                      setDeleteDialog(true);
                    }}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* View Dialog */}
      <Dialog 
        open={viewDialog} 
        onClose={() => setViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Purchase Order Details - {selectedPO?.poNumber}
        </DialogTitle>
        <DialogContent>
          {selectedPO && (
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Title:</Typography>
                  <Typography variant="body2" gutterBottom>{selectedPO.title}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Vendor:</Typography>
                  <Typography variant="body2" gutterBottom>{selectedPO.vendor}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Total Amount:</Typography>
                  <Typography variant="body2" gutterBottom>{formatCurrency(selectedPO.totalAmount)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Order Date:</Typography>
                  <Typography variant="body2" gutterBottom>{new Date(selectedPO.orderDate).toLocaleDateString()}</Typography>
                </Grid>
                {selectedPO.department && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Department:</Typography>
                    <Typography variant="body2" gutterBottom>{selectedPO.department}</Typography>
                  </Grid>
                )}
                {selectedPO.category && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Category:</Typography>
                    <Typography variant="body2" gutterBottom>{selectedPO.category}</Typography>
                  </Grid>
                )}
                {selectedPO.description && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Description:</Typography>
                    <Typography variant="body2" gutterBottom>{selectedPO.description}</Typography>
                  </Grid>
                )}
                {selectedPO.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Notes:</Typography>
                    <Typography variant="body2" gutterBottom>{selectedPO.notes}</Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Attachments:</Typography>
                  {selectedPO.attachments.map((attachment, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <span style={{ marginRight: 8 }}>{getFileIcon(attachment.mimetype)}</span>
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {attachment.originalName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                        ({(attachment.size / 1024).toFixed(1)} KB)
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleDownloadAttachment(selectedPO._id, attachment.filename, attachment.originalName)}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Box>
                  ))}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Completed Purchase Order</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete purchase order <strong>{selectedPO?.poNumber}</strong>?
            This will also delete all associated attachments and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeletePO} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default CompletedPOs;
