import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, Typography, Snackbar, Alert, ThemeProvider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import theme from './theme.js';

// Components
import Navbar from './components/Navbar.js';
import Dashboard from './components/Dashboard.js';
import Items from './components/Items.js';
import ItemsSimple from './components/ItemsSimple.js';
import ItemsSafe from './components/ItemsSafe.js';
import ItemsMinimal from './components/ItemsMinimal.js';
import ItemsEnhanced from './components/ItemsEnhanced.js';
import DebugItems from './components/DebugItems.js';
import Categories from './components/Categories.js';
import Login from './components/Login.js';
import Register from './components/Register.js';
import Users from './components/Users.js';
import UserManagement from './components/UserManagement.js';
import Roadmap from './components/Roadmap.js';
import AdminCustomFields from './components/AdminCustomFields.js';
import PurchaseOrders from './components/PurchaseOrders.js';
import PurchaseOrderForm from './components/PurchaseOrderForm.js';
import PurchaseOrderView from './components/PurchaseOrderView.js';
import PORequests from './components/PORequests.js';
import CompletedPOs from './components/CompletedPOs.js';
import CompletedPOForm from './components/CompletedPOForm.js';
import InternalOrders from './components/InternalOrders.js';
import InternalOrderForm from './components/InternalOrderForm.js';
import LiveNotifications from './components/LiveNotifications.js';
import notificationService from './services/notificationService.js';
import InternalOrderView from './components/InternalOrderView.js';
import OrderRequests from './components/OrderRequests.js';
import AdminInternalOrders from './components/AdminInternalOrders.js';
import SystemTest from './components/SystemTest.js';
import ImportExport from './components/ImportExport.js';
import Notifications from './components/Notifications.js';


import { Box, Paper, List, ListItem, ListItemIcon, ListItemText, Chip, Grid } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import BookIcon from '@mui/icons-material/Book';
import InventoryIcon from '@mui/icons-material/Inventory';

function Home() {
  return (
    <Box mt={4}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 4, maxWidth: 900, mx: 'auto', mb: 4 }}>
        <Typography variant="h3" align="center" fontWeight={700} gutterBottom color="primary">
          Welcome to DC4 Inventory Management
        </Typography>
        <Typography align="center" color="text.secondary" mb={3} fontSize="1.1rem">
          Your comprehensive solution for tracking, organizing, and managing inventory with professional-grade features.
        </Typography>
        
        {/* New Features Banner */}
        <Box sx={{ 
          bgcolor: 'primary.main', 
          color: 'white', 
          p: 2, 
          borderRadius: 2, 
          mb: 4, 
          textAlign: 'center',
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
        }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <NewReleasesIcon /> 🎉 Latest Updates - September 2025 🎉
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
            Enhanced item management with intelligent type selection and improved user experience!
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Key Features */}
          <Grid item xs={12} md={6}>
            <Typography variant="h5" fontWeight={600} gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InventoryIcon /> Core Features
            </Typography>
            <List dense>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon><CheckCircleIcon color="primary" fontSize="small" /></ListItemIcon>
                <ListItemText 
                  primary="Smart Item Addition" 
                  secondary="Choose between General Items and Books with animated type selector"
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon><CheckCircleIcon color="primary" fontSize="small" /></ListItemIcon>
                <ListItemText 
                  primary="Professional Book Management" 
                  secondary="Required ISBN-13 validation for accurate book cataloging"
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon><CheckCircleIcon color="primary" fontSize="small" /></ListItemIcon>
                <ListItemText 
                  primary="Photo Upload & Management" 
                  secondary="Add images to items for easy visual identification"
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon><CheckCircleIcon color="primary" fontSize="small" /></ListItemIcon>
                <ListItemText 
                  primary="Advanced Search & Filtering" 
                  secondary="Find items by name, ISBN, category, location, or custom fields"
                />
              </ListItem>
            </List>
          </Grid>

          {/* Recent Improvements */}
          <Grid item xs={12} md={6}>
            <Typography variant="h5" fontWeight={600} gutterBottom color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BookIcon /> What's New
            </Typography>
            <List dense>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon><NewReleasesIcon color="success" fontSize="small" /></ListItemIcon>
                <ListItemText 
                  primary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Redesigned Add Button <Chip label="NEW" size="small" color="success" variant="outlined" />
                  </Box>}
                  secondary="Beautiful animated type selector for choosing item types"
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon><NewReleasesIcon color="success" fontSize="small" /></ListItemIcon>
                <ListItemText 
                  primary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Enhanced Book Validation <Chip label="IMPROVED" size="small" color="primary" variant="outlined" />
                  </Box>}
                  secondary="ISBN-13 now required for all book entries ensuring data accuracy"
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon><NewReleasesIcon color="success" fontSize="small" /></ListItemIcon>
                <ListItemText 
                  primary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Improved Performance <Chip label="FIXED" size="small" color="warning" variant="outlined" />
                  </Box>}
                  secondary="Faster loading times and smoother user interactions"
                />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon><NewReleasesIcon color="success" fontSize="small" /></ListItemIcon>
                <ListItemText 
                  primary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Bug Fixes <Chip label="STABLE" size="small" color="info" variant="outlined" />
                  </Box>}
                  secondary="Resolved component crashes and infinite loading issues"
                />
              </ListItem>
            </List>
          </Grid>
        </Grid>

        {/* Quick Start Guide */}
        <Typography variant="h5" fontWeight={600} gutterBottom mt={4} color="primary">
          Quick Start Guide
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Typography variant="h6" color="primary">1. Login</Typography>
              <Typography variant="body2">Access your account or contact admin for setup</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Typography variant="h6" color="primary">2. Add Items</Typography>
              <Typography variant="body2">Click the blue + button and choose item type</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Typography variant="h6" color="primary">3. Organize</Typography>
              <Typography variant="body2">Use categories and locations to stay organized</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Typography variant="h6" color="primary">4. Manage</Typography>
              <Typography variant="body2">Search, edit, and track your inventory easily</Typography>
            </Paper>
          </Grid>
        </Grid>

        <Typography align="center" color="text.secondary" mt={4} sx={{ 
          borderTop: '1px solid', 
          borderColor: 'grey.200', 
          pt: 3,
          fontStyle: 'italic'
        }}>
          💡 Pro Tip: Books now require ISBN-13 for better cataloging. General items have flexible field requirements.
        </Typography>
      </Paper>
    </Box>
  );
}
function AuthPage({ onLogin }) {
  const [showRegister, setShowRegister] = useState(false);
  return showRegister ? (
    <Register onSwitch={() => setShowRegister(false)} />
  ) : (
    <Login onSwitch={() => setShowRegister(true)} onLogin={onLogin} />
  );
}

function App() {
  const [token, setToken] = useState(() => {
    const remembered = localStorage.getItem('rememberMe') === 'true';
    const storedToken = remembered ? localStorage.getItem('token') : sessionStorage.getItem('token') || '';
    
    // If we have a token, validate it immediately to prevent infinite loops
    if (storedToken) {
      // Try to decode the token to check if it's valid format
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        // Check if token is expired
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          console.log('Token expired on startup, clearing...');
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          return '';
        }
      } catch (e) {
        console.log('Invalid token format on startup, clearing...');
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        return '';
      }
    }
    
    return storedToken;
  });
  const [loginSnackbar, setLoginSnackbar] = useState(false);

  // Clear any existing tokens on component mount unless "Remember Me" is enabled
  React.useEffect(() => {
    const remembered = localStorage.getItem('rememberMe') === 'true';
    if (!remembered) {
      localStorage.removeItem('token');
    }
  }, []);

  // Initialize notification service when token changes
  React.useEffect(() => {
    if (token) {
      // Get user role from storage
      const remembered = localStorage.getItem('rememberMe') === 'true';
      const userRole = remembered ? localStorage.getItem('role') : sessionStorage.getItem('role');
      
      // Connect to notification service
      notificationService.connect(token, userRole);
    } else {
      // Disconnect when user logs out
      notificationService.disconnect();
    }

    // Cleanup on unmount
    return () => {
      notificationService.disconnect();
    };
  }, [token]);

  // Helper for protected route message
  const ProtectedMessage = ({ tab }) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Typography variant="h6" color="text.secondary" align="center">
        You're currently logged out.<br />Please log in to view the {tab} tab.
      </Typography>
    </Box>
  );

  const handleLogin = (t, rememberMe) => {
    setToken(t);
    if (rememberMe) {
      localStorage.setItem('token', t);
      localStorage.setItem('rememberMe', 'true');
    } else {
      sessionStorage.setItem('token', t);
      localStorage.removeItem('token');
      localStorage.removeItem('rememberMe');
    }
    setLoginSnackbar(true);
  };

  // Function to clear all authentication data
  const clearAuthData = () => {
    setToken('');
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('role');
    sessionStorage.removeItem('role');
    localStorage.removeItem('rememberMe');
    notificationService.disconnect();
  };

  // Expose clearAuthData globally for axios interceptor
  window.clearAuthData = clearAuthData;

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Router>
        <Navbar token={token} setToken={setToken} />
        
        {/* Live Notifications Component */}
        {token && <LiveNotifications />}
        
        <Box sx={{ 
          width: '100%', 
          minHeight: '100vh', 
          bgcolor: '#fff',
          px: { xs: 1, sm: 2, md: 3 }, // Responsive padding
          py: { xs: 1, sm: 2 }, // Responsive vertical padding
          overflow: 'hidden' // Prevent horizontal scroll
        }}>
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<AuthPage onLogin={handleLogin} />} />
          
          {/* Dashboard */}
          <Route path="/dashboard" element={token ? <Dashboard /> : <ProtectedMessage tab="Dashboard" />} />
          
          {/* Inventory Management */}
          <Route path="/items" element={token ? <Items token={token} /> : <ProtectedMessage tab="Items" />} />
          <Route path="/categories" element={token ? <Categories token={token} /> : <ProtectedMessage tab="Categories" />} />
          
          {/* Purchase Orders */}
          <Route path="/purchase-orders" element={token ? <PurchaseOrders /> : <ProtectedMessage tab="Purchase Orders" />} />
          <Route path="/purchase-orders/new" element={token ? <PurchaseOrderForm /> : <ProtectedMessage tab="Purchase Orders" />} />
          <Route path="/purchase-orders/edit/:id" element={token ? <PurchaseOrderForm /> : <ProtectedMessage tab="Purchase Orders" />} />
          <Route path="/purchase-orders/view/:id" element={token ? <PurchaseOrderView /> : <ProtectedMessage tab="Purchase Orders" />} />
          <Route path="/purchase-orders/requests" element={token ? <PORequests /> : <ProtectedMessage tab="PO Requests" />} />
          
          {/* Completed Purchase Orders */}
          <Route path="/completed-pos" element={token ? <CompletedPOs /> : <ProtectedMessage tab="Completed POs" />} />
          <Route path="/completed-pos/new" element={token ? <CompletedPOForm /> : <ProtectedMessage tab="Completed POs" />} />
          <Route path="/completed-pos/edit/:id" element={token ? <CompletedPOForm /> : <ProtectedMessage tab="Completed POs" />} />
          
          {/* Internal Orders */}
          <Route path="/internal-orders" element={token ? <InternalOrders /> : <ProtectedMessage tab="Internal Orders" />} />
          <Route path="/internal-orders/new" element={token ? <InternalOrderForm /> : <ProtectedMessage tab="Internal Orders" />} />
          <Route path="/internal-orders/view/:id" element={token ? <InternalOrderView /> : <ProtectedMessage tab="Internal Orders" />} />
          <Route path="/internal-orders/pending" element={token ? <AdminInternalOrders /> : <ProtectedMessage tab="Internal Orders" />} />
          <Route path="/internal-orders/all" element={token ? <AdminInternalOrders /> : <ProtectedMessage tab="Internal Orders" />} />
          <Route path="/order-requests" element={token ? <OrderRequests /> : <ProtectedMessage tab="Order Requests" />} />
          
          {/* Import/Export */}
          <Route path="/import-export" element={token ? <ImportExport /> : <ProtectedMessage tab="Import/Export" />} />
          
          {/* Admin Routes */}
          <Route path="/custom-fields" element={token ? <AdminCustomFields token={token} /> : <ProtectedMessage tab="Custom Fields" />} />
          <Route path="/users" element={token ? <UserManagement token={token} /> : <ProtectedMessage tab="User Management" />} />
          <Route path="/roadmap" element={token ? <Roadmap /> : <ProtectedMessage tab="Roadmap" />} />
          
          {/* System Test Route */}
          <Route path="/system-test" element={token ? <SystemTest /> : <ProtectedMessage tab="System Test" />} />
          
          {/* Notifications */}
          <Route path="/notifications" element={token ? <Notifications /> : <ProtectedMessage tab="Notifications" />} />
        </Routes>
        <Snackbar open={loginSnackbar} autoHideDuration={3000} onClose={() => setLoginSnackbar(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert onClose={() => setLoginSnackbar(false)} severity="success" sx={{ width: '100%' }}>
            Login successful! Welcome back.
          </Alert>
        </Snackbar>
      </Box>
    </Router>
    </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
