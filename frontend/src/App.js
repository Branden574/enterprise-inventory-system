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
import InternalOrderView from './components/InternalOrderView.js';
import OrderRequests from './components/OrderRequests.js';
import AdminInternalOrders from './components/AdminInternalOrders.js';
import SystemTest from './components/SystemTest.js';
import ImportExport from './components/ImportExport.js';
import Notifications from './components/Notifications.js';


import { Box, Paper, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

function Home() {
  return (
    <Box mt={6}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 4, maxWidth: 700, mx: 'auto' }}>
        <Typography variant="h3" align="center" fontWeight={700} gutterBottom color="primary">
          Welcome to DC4 Inventory Management
        </Typography>
        <Typography align="center" color="text.secondary" mb={3}>
          Your all-in-one solution for tracking, organizing, and managing your organization's inventory with ease.
        </Typography>
        <Typography variant="h5" align="center" fontWeight={600} gutterBottom mt={4}>
          Our Story
        </Typography>
        <Typography align="center" color="text.secondary" mb={3}>
          DC4 Inventory Management was created to help teams like yours stay organized, reduce loss, and make inventory simple. Whether you're tracking supplies, equipment, or assets, our platform is designed to be intuitive, flexible, and powerful for organizations of any size.
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon><CheckCircleIcon color="primary" /></ListItemIcon>
            <ListItemText primary="Login or create an account. Admins can manage users and permissions." />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckCircleIcon color="primary" /></ListItemIcon>
            <ListItemText primary="Add items to your inventory, including photos and custom details." />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckCircleIcon color="primary" /></ListItemIcon>
            <ListItemText primary="Organize items with categories, folders, and tags." />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckCircleIcon color="primary" /></ListItemIcon>
            <ListItemText primary="Use the navigation bar to view, edit, or delete items and manage custom fields." />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckCircleIcon color="primary" /></ListItemIcon>
            <ListItemText primary="Admins can access the Roadmap to see upcoming features and manage custom fields." />
          </ListItem>
        </List>
        <Typography align="center" color="text.secondary" mt={2}>
          For help or more information, contact your system administrator.
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
    return remembered ? localStorage.getItem('token') : sessionStorage.getItem('token') || '';
  });
  const [loginSnackbar, setLoginSnackbar] = useState(false);

  // Clear any existing tokens on component mount unless "Remember Me" is enabled
  React.useEffect(() => {
    const remembered = localStorage.getItem('rememberMe') === 'true';
    if (!remembered) {
      localStorage.removeItem('token');
    }
  }, []);

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

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Router>
        <Navbar token={token} setToken={setToken} />
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
          <Route path="/items" element={token ? <ItemsEnhanced token={token} /> : <ProtectedMessage tab="Items" />} />
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
