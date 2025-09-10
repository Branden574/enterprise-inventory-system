import React, { useState, useEffect } from 'react';
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
  TablePagination,
  Chip,
  IconButton,
  Collapse,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Tabs,
  Tab,
  Alert
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  History as HistoryIcon,
  Visibility as VisibilityIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Download as DownloadIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import axios from '../utils/axios';

const AuditTrail = ({ userRole }) => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [stats, setStats] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 25,
    action: '',
    entityType: '',
    userId: '',
    startDate: '',
    endDate: '',
    search: ''
  });

  // Check if user is admin
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  useEffect(() => {
    if (isAdmin) {
      if (tabValue === 0) {
        fetchRecentActivity();
      } else if (tabValue === 1) {
        fetchAuditLogs();
      } else if (tabValue === 2) {
        fetchAuditStats();
      }
    }
  }, [tabValue, filters, isAdmin]);

  const fetchRecentActivity = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/audit-logs/recent?limit=20');
      setRecentActivity(response.data);
    } catch (err) {
      setError('Failed to fetch recent activity');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      
      const response = await axios.get(`/api/audit-logs?${params}`);
      setAuditLogs(response.data.auditLogs);
    } catch (err) {
      setError('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/audit-logs/stats');
      setStats(response.data);
    } catch (err) {
      setError('Failed to fetch audit statistics');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE': return <AddIcon color="success" />;
      case 'UPDATE': return <EditIcon color="primary" />;
      case 'DELETE': return <DeleteIcon color="error" />;
      case 'LOGIN': return <LoginIcon color="info" />;
      case 'LOGOUT': return <LogoutIcon color="info" />;
      case 'EXPORT': return <DownloadIcon color="secondary" />;
      case 'IMPORT': return <UploadIcon color="secondary" />;
      case 'STATUS_CHANGE': return <EditIcon color="warning" />;
      default: return <HistoryIcon />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'primary';
      case 'DELETE': return 'error';
      case 'LOGIN': return 'info';
      case 'LOGOUT': return 'info';
      case 'EXPORT': return 'secondary';
      case 'IMPORT': return 'secondary';
      case 'STATUS_CHANGE': return 'warning';
      default: return 'default';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleExpandClick = (logId) => {
    setExpandedRow(expandedRow === logId ? null : logId);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 25,
      action: '',
      entityType: '',
      userId: '',
      startDate: '',
      endDate: '',
      search: ''
    });
  };

  if (!isAdmin) {
    return (
      <Alert severity="warning">
        Access denied. Admin privileges required to view audit trail.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <HistoryIcon sx={{ mr: 1 }} />
        System Audit Trail
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Recent Activity" />
          <Tab label="Full Audit Log" />
          <Tab label="Statistics" />
        </Tabs>

        {/* Recent Activity Tab */}
        {tabValue === 0 && (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent User Activity (Last 20 actions)
            </Typography>
            <List>
              {recentActivity.map((log) => (
                <ListItem key={log._id} divider>
                  <ListItemAvatar>
                    <Avatar>
                      {getActionIcon(log.action)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">
                          {log.description || `${log.action} on ${log.entityType}`}
                        </Typography>
                        <Chip 
                          label={log.action} 
                          size="small" 
                          color={getActionColor(log.action)}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          By: {log.userEmail} ({log.userRole})
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {formatTimestamp(log.timestamp)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Full Audit Log Tab */}
        {tabValue === 1 && (
          <Box sx={{ p: 2 }}>
            {/* Filters */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Action</InputLabel>
                  <Select
                    value={filters.action}
                    onChange={(e) => handleFilterChange('action', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="CREATE">Create</MenuItem>
                    <MenuItem value="UPDATE">Update</MenuItem>
                    <MenuItem value="DELETE">Delete</MenuItem>
                    <MenuItem value="LOGIN">Login</MenuItem>
                    <MenuItem value="LOGOUT">Logout</MenuItem>
                    <MenuItem value="EXPORT">Export</MenuItem>
                    <MenuItem value="IMPORT">Import</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Entity Type</InputLabel>
                  <Select
                    value={filters.entityType}
                    onChange={(e) => handleFilterChange('entityType', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="Item">Items</MenuItem>
                    <MenuItem value="Category">Categories</MenuItem>
                    <MenuItem value="User">Users</MenuItem>
                    <MenuItem value="PurchaseOrder">Purchase Orders</MenuItem>
                    <MenuItem value="CustomField">Custom Fields</MenuItem>
                    <MenuItem value="System">System</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  size="small"
                  fullWidth
                  label="Start Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  size="small"
                  fullWidth
                  label="End Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={8} md={3}>
                <TextField
                  size="small"
                  fullWidth
                  label="Search"
                  placeholder="User email or description"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4} md={1}>
                <Button onClick={clearFilters} variant="outlined" size="small">
                  Clear
                </Button>
              </Grid>
            </Grid>

            {/* Audit Log Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Entity</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditLogs.map((log) => (
                    <React.Fragment key={log._id}>
                      <TableRow>
                        <TableCell>{formatTimestamp(log.timestamp)}</TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">{log.userEmail}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              ({log.userRole})
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            icon={getActionIcon(log.action)}
                            label={log.action} 
                            size="small" 
                            color={getActionColor(log.action)}
                          />
                        </TableCell>
                        <TableCell>{log.entityType}</TableCell>
                        <TableCell>{log.description}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleExpandClick(log._id)}
                          >
                            {expandedRow === log._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={6} sx={{ py: 0 }}>
                          <Collapse in={expandedRow === log._id}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                              <Grid container spacing={2}>
                                <Grid item xs={6}>
                                  <Typography variant="subtitle2">IP Address:</Typography>
                                  <Typography variant="body2">{log.ipAddress || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                  <Typography variant="subtitle2">User Agent:</Typography>
                                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                                    {log.userAgent || 'N/A'}
                                  </Typography>
                                </Grid>
                                {Object.keys(log.changes).length > 0 && (
                                  <Grid item xs={12}>
                                    <Typography variant="subtitle2">Changes:</Typography>
                                    <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                                      {JSON.stringify(log.changes, null, 2)}
                                    </pre>
                                  </Grid>
                                )}
                              </Grid>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Statistics Tab */}
        {tabValue === 2 && stats && (
          <Box sx={{ p: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Actions by Type
                    </Typography>
                    <List>
                      {stats.actionStats.map((stat) => (
                        <ListItem key={stat._id}>
                          <ListItemText 
                            primary={stat._id} 
                            secondary={`${stat.count} actions`}
                          />
                          <Chip 
                            label={stat.count} 
                            color={getActionColor(stat._id)}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Most Active Users
                    </Typography>
                    <List>
                      {stats.userStats.slice(0, 10).map((stat, index) => (
                        <ListItem key={stat._id}>
                          <ListItemText 
                            primary={stat.userEmail} 
                            secondary={`${stat.userRole} - ${stat.count} actions`}
                          />
                          <Chip label={`#${index + 1}`} variant="outlined" />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default AuditTrail;
