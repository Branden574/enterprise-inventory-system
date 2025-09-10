import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  Button
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ShoppingCart as ShoppingCartIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  QrCodeScanner as QrCodeScannerIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import axios from '../utils/axios';
import AuditTrail from './AuditTrail';

function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    totalItems: 0,
    totalCategories: 0,
    lowStockItems: [],
    recentItems: [],
    purchaseOrders: {
      total: 0,
      pending: 0,
      approved: 0
    },
    topCategories: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || 'user');
  const [recentActivity, setRecentActivity] = useState([]);

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const promises = [
        axios.get('/api/items'),
        axios.get('/api/categories'),
        axios.get('/api/notifications'),
        axios.get('/api/purchase-orders')
      ];

      // Add recent activity for admins
      if (isAdmin) {
        promises.push(axios.get('/api/audit-logs/recent?limit=10'));
      }

      const responses = await Promise.all(promises);
      const [itemsRes, categoriesRes, notificationsRes, purchaseOrdersRes, activityRes] = responses;

      const items = itemsRes.data;
      const categories = categoriesRes.data;
      const notifications = notificationsRes.data;
      const purchaseOrders = purchaseOrdersRes.data;

      // Set recent activity for admins
      if (isAdmin && activityRes) {
        setRecentActivity(activityRes.data);
      }

      // Calculate low stock items (universal threshold of 10)
      const lowStockItems = items.filter(item => 
        item.quantity < 10 && item.alertEnabled
      );

      // Get recent items (last 7 days)
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentItems = items
        .filter(item => new Date(item.createdAt) > oneWeekAgo)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      // Calculate category distribution
      const categoryCount = {};
      items.forEach(item => {
        if (item.category) {
          const categoryName = item.category.name || 'Unknown';
          categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1;
        }
      });

      const topCategories = Object.entries(categoryCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // Purchase order stats
      const poStats = {
        total: purchaseOrders.length,
        pending: purchaseOrders.filter(po => po.status === 'pending').length,
        approved: purchaseOrders.filter(po => po.status === 'approved').length
      };

      setDashboardData({
        totalItems: items.length,
        totalCategories: categories.length,
        lowStockItems: lowStockItems.slice(0, 5), // Show top 5
        recentItems,
        purchaseOrders: poStats,
        topCategories
      });

    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color = 'primary' }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="h2">
              {value}
            </Typography>
          </Box>
          <Box color={`${color}.main`}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // Helper functions for activity display
  const getActivityIcon = (action) => {
    switch (action) {
      case 'CREATE': return <AddIcon color="success" fontSize="small" />;
      case 'UPDATE': return <EditIcon color="primary" fontSize="small" />;
      case 'DELETE': return <DeleteIcon color="error" fontSize="small" />;
      case 'LOGIN': return <LoginIcon color="info" fontSize="small" />;
      case 'LOGOUT': return <LogoutIcon color="info" fontSize="small" />;
      case 'EXPORT': return <DownloadIcon color="secondary" fontSize="small" />;
      case 'IMPORT': return <UploadIcon color="secondary" fontSize="small" />;
      case 'STATUS_CHANGE': return <EditIcon color="warning" fontSize="small" />;
      case 'BARCODE_SEARCH': return <QrCodeScannerIcon color="info" fontSize="small" />;
      default: return <HistoryIcon fontSize="small" />;
    }
  };

  const getActivityColor = (action) => {
    switch (action) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'primary';
      case 'DELETE': return 'error';
      case 'LOGIN': return 'info';
      case 'LOGOUT': return 'info';
      case 'EXPORT': return 'secondary';
      case 'IMPORT': return 'secondary';
      case 'STATUS_CHANGE': return 'warning';
      case 'BARCODE_SEARCH': return 'info';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Dashboard</Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabs for Admin/Regular Dashboard */}
      <Paper sx={{ width: '100%', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" />
          {isAdmin && <Tab label="Audit Trail" />}
        </Tabs>
      </Paper>

      {/* Overview Tab */}
      {tabValue === 0 && (
        <Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Items"
            value={dashboardData.totalItems}
            icon={<InventoryIcon sx={{ fontSize: 40 }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Categories"
            value={dashboardData.totalCategories}
            icon={<CategoryIcon sx={{ fontSize: 40 }} />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Low Stock Alerts"
            value={dashboardData.lowStockItems.length}
            icon={<WarningIcon sx={{ fontSize: 40 }} />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Purchase Orders"
            value={dashboardData.purchaseOrders.total}
            icon={<ShoppingCartIcon sx={{ fontSize: 40 }} />}
            color="info"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Low Stock Items */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Low Stock Items
            </Typography>
            {dashboardData.lowStockItems.length === 0 ? (
              <Box display="flex" alignItems="center" justifyContent="center" height={200}>
                <Typography color="textSecondary">
                  No low stock items
                </Typography>
              </Box>
            ) : (
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <List>
                  {dashboardData.lowStockItems.map((item) => (
                    <ListItem key={item._id} divider>
                      <ListItemIcon>
                        <WarningIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.name}
                        secondary={`${item.quantity} remaining (min: ${item.minimumQuantity})`}
                      />
                      <Chip
                        label="Low Stock"
                        color="warning"
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Items */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Recently Added Items
            </Typography>
            {dashboardData.recentItems.length === 0 ? (
              <Box display="flex" alignItems="center" justifyContent="center" height={200}>
                <Typography color="textSecondary">
                  No recent items
                </Typography>
              </Box>
            ) : (
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <List>
                  {dashboardData.recentItems.map((item) => (
                    <ListItem key={item._id} divider>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.name}
                        secondary={
                          <span>
                            Added {new Date(item.createdAt).toLocaleDateString()}
                            {item.createdBy ? (
                              <span style={{ marginLeft: '8px', fontWeight: 'bold', color: '#1976d2' }}>
                                by {item.createdBy.username}
                              </span>
                            ) : (
                              <span style={{ marginLeft: '8px', fontStyle: 'italic', color: '#666' }}>
                                (user unknown)
                              </span>
                            )}
                          </span>
                        }
                      />
                      <Chip
                        label={`Qty: ${item.quantity}`}
                        size="small"
                        variant="outlined"
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Top Categories */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Top Categories
            </Typography>
            {dashboardData.topCategories.length === 0 ? (
              <Box display="flex" alignItems="center" justifyContent="center" height={200}>
                <Typography color="textSecondary">
                  No categories with items
                </Typography>
              </Box>
            ) : (
              <List>
                {dashboardData.topCategories.map((category, index) => (
                  <ListItem key={category.name} divider>
                    <ListItemIcon>
                      <TrendingUpIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={category.name}
                      secondary={`${category.count} items`}
                    />
                    <Chip
                      label={`#${index + 1}`}
                      color="primary"
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Purchase Order Status */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Purchase Order Status
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography>Total Purchase Orders</Typography>
                <Chip label={dashboardData.purchaseOrders.total} color="primary" />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography>Pending Approval</Typography>
                <Chip label={dashboardData.purchaseOrders.pending} color="warning" />
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography>Approved</Typography>
                <Chip label={dashboardData.purchaseOrders.approved} color="success" />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Activity Section for Admins */}
      {isAdmin && (
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <HistoryIcon sx={{ mr: 1 }} />
                Recent System Activity
                <Button 
                  variant="outlined" 
                  size="small" 
                  sx={{ ml: 'auto' }} 
                  onClick={() => setTabValue(1)}
                >
                  View Full Audit Trail
                </Button>
              </Typography>
              {recentActivity.length === 0 ? (
                <Box display="flex" alignItems="center" justifyContent="center" height={100}>
                  <Typography color="textSecondary">
                    No recent activity
                  </Typography>
                </Box>
              ) : (
                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {recentActivity.map((log) => (
                    <ListItem key={log._id} divider>
                      <ListItemIcon>
                        {getActivityIcon(log.action)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              {log.description || `${log.action} on ${log.entityType}`}
                            </Typography>
                            <Chip 
                              label={log.action} 
                              size="small" 
                              color={getActivityColor(log.action)}
                              sx={{ minWidth: 60 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" color="textSecondary">
                              By: {log.userEmail} ({log.userRole}) • {new Date(log.timestamp).toLocaleString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

        </Box>
      )}

      {/* Audit Trail Tab - Admin Only */}
      {tabValue === 1 && isAdmin && (
        <Box>
          <AuditTrail userRole={userRole} />
        </Box>
      )}
    </Box>
  );
}

export default Dashboard;
