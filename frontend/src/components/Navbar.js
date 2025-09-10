import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Stack, 
  Menu, 
  MenuItem, 
  IconButton,
  Divider
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SettingsIcon from '@mui/icons-material/Settings';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import NotificationsIcon from '@mui/icons-material/Notifications';

function Navbar({ token, setToken }) {
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState({
    inventory: null,
    purchase: null,
    internal: null,
    importExport: null,
    admin: null
  });

  // Get user role from localStorage or sessionStorage
  const remembered = localStorage.getItem('rememberMe') === 'true';
  const userRole = remembered ? localStorage.getItem('role') : sessionStorage.getItem('role');
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';
  
  // Debug logging
  console.log('Remembered?', remembered);
  console.log('Current user role:', userRole);
  console.log('Is admin?', isAdmin);

  const handleClick = (event, menu) => {
    setMenuAnchor(prev => ({
      ...prev,
      [menu]: event.currentTarget
    }));
  };

  const handleClose = (menu) => {
    setMenuAnchor(prev => ({
      ...prev,
      [menu]: null
    }));
  };

  const handleLogout = () => {
    // Clear from both storage locations to be safe
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('rememberMe');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    setToken('');
    navigate('/login');
  };

  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: '#fff', color: '#222', borderBottom: '1px solid #eee' }}>
      <Toolbar sx={{ minHeight: 72, px: { xs: 2, sm: 6 } }}>
        <Typography variant="h4" sx={{ flexGrow: 1, fontWeight: 700, color: '#e53935', fontFamily: 'Montserrat, sans-serif', letterSpacing: 1 }}>
          DC4 Inventory Management
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ flexGrow: 0 }}>
          <Button color="inherit" component={Link} to="/" sx={{ fontWeight: 500, fontSize: 16, textTransform: 'none' }}>Home</Button>
          
          {/* Dashboard */}
          {token && (
            <Button color="inherit" component={Link} to="/dashboard" sx={{ fontWeight: 500, fontSize: 16, textTransform: 'none' }}>
              Dashboard
            </Button>
          )}
          
          {/* Inventory Management Menu */}
          <Button
            color="inherit"
            onClick={(e) => handleClick(e, 'inventory')}
            endIcon={<KeyboardArrowDownIcon />}
            sx={{ fontWeight: 500, fontSize: 16, textTransform: 'none' }}
          >
            <InventoryIcon sx={{ mr: 0.5 }} />
            Inventory
          </Button>

          {/* Purchase Orders Menu */}
          {token && (
            <Button
              color="inherit"
              onClick={(e) => handleClick(e, 'purchase')}
              endIcon={<KeyboardArrowDownIcon />}
              sx={{ fontWeight: 500, fontSize: 16, textTransform: 'none' }}
            >
              <ShoppingCartIcon sx={{ mr: 0.5 }} />
              Purchase Orders
            </Button>
          )}

          {/* Internal Orders Menu */}
          {token && (
            <Button
              color="inherit"
              onClick={(e) => handleClick(e, 'internal')}
              endIcon={<KeyboardArrowDownIcon />}
              sx={{ fontWeight: 500, fontSize: 16, textTransform: 'none' }}
            >
              <InventoryIcon sx={{ mr: 0.5 }} />
              Internal Orders
            </Button>
          )}

          {/* Import/Export Menu */}
          {token && (
            <Button
              color="inherit"
              onClick={(e) => handleClick(e, 'importExport')}
              endIcon={<KeyboardArrowDownIcon />}
              sx={{ fontWeight: 500, fontSize: 16, textTransform: 'none' }}
            >
              <SystemUpdateAltIcon sx={{ mr: 0.5 }} />
              Import/Export
            </Button>
          )}

          {/* Admin Menu */}
          {token && (
            <>
              <Button
                color="inherit"
                onClick={(e) => handleClick(e, 'admin')}
                endIcon={<KeyboardArrowDownIcon />}
                sx={{ 
                  fontWeight: 500, 
                  fontSize: 16, 
                  textTransform: 'none',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <SettingsIcon sx={{ mr: 0.5 }} />
                Admin
              </Button>
              
              {/* Notifications */}
              <IconButton color="inherit" component={Link} to="/notifications">
                <NotificationsIcon />
              </IconButton>
              {/* Inventory Menu */}
              <Menu
                anchorEl={menuAnchor.inventory}
                open={Boolean(menuAnchor.inventory)}
                onClose={() => handleClose('inventory')}
                elevation={2}
                MenuListProps={{
                  sx: { py: 0.5 }
                }}
                sx={{ mt: 1 }}
              >
                <MenuItem onClick={() => { navigate('/items'); handleClose('inventory'); }}>
                  Items List
                </MenuItem>
                <MenuItem onClick={() => { navigate('/categories'); handleClose('inventory'); }}>
                  Categories
                </MenuItem>
              </Menu>

              {/* Purchase Orders Menu */}
              <Menu
                anchorEl={menuAnchor.purchase}
                open={Boolean(menuAnchor.purchase)}
                onClose={() => handleClose('purchase')}
                elevation={2}
                MenuListProps={{
                  sx: { py: 0.5 }
                }}
                sx={{ mt: 1 }}
              >
                <MenuItem onClick={() => { navigate('/purchase-orders'); handleClose('purchase'); }}>
                  View Orders
                </MenuItem>
                <MenuItem onClick={() => { navigate('/purchase-orders/new'); handleClose('purchase'); }}>
                  Create Order
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { navigate('/completed-pos'); handleClose('purchase'); }}>
                  Completed POs
                </MenuItem>
                <MenuItem onClick={() => { navigate('/completed-pos/new'); handleClose('purchase'); }}>
                  Upload Completed PO
                </MenuItem>
                {isAdmin && (
                  <>
                    <Divider />
                    <MenuItem onClick={() => { navigate('/purchase-orders/requests'); handleClose('purchase'); }}>
                      PO Requests
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/order-requests'); handleClose('purchase'); }}>
                      Order Requests
                    </MenuItem>
                  </>
                )}
              </Menu>

              {/* Internal Orders Menu */}
              <Menu
                anchorEl={menuAnchor.internal}
                open={Boolean(menuAnchor.internal)}
                onClose={() => handleClose('internal')}
                elevation={2}
                MenuListProps={{
                  sx: { py: 0.5 }
                }}
                sx={{ mt: 1 }}
              >
                <MenuItem onClick={() => { navigate('/internal-orders'); handleClose('internal'); }}>
                  My Orders
                </MenuItem>
                <MenuItem onClick={() => { navigate('/internal-orders/new'); handleClose('internal'); }}>
                  New Order Request
                </MenuItem>
                {isAdmin && (
                  <>
                    <Divider />
                    <MenuItem onClick={() => { navigate('/internal-orders/pending'); handleClose('internal'); }}>
                      Pending Requests
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/internal-orders/all'); handleClose('internal'); }}>
                      All Internal Orders
                    </MenuItem>
                  </>
                )}
              </Menu>

              {/* Import/Export Menu */}
              <Menu
                anchorEl={menuAnchor.importExport}
                open={Boolean(menuAnchor.importExport)}
                onClose={() => handleClose('importExport')}
                elevation={2}
                MenuListProps={{
                  sx: { py: 0.5 }
                }}
                sx={{ mt: 1 }}
              >
                <MenuItem onClick={() => { navigate('/import-export'); handleClose('importExport'); }}>
                  Import/Export Data
                </MenuItem>
              </Menu>

              {/* Admin Menu */}
              <Menu
                anchorEl={menuAnchor.admin}
                open={Boolean(menuAnchor.admin)}
                onClose={() => handleClose('admin')}
                elevation={2}
                MenuListProps={{
                  sx: { py: 0.5 }
                }}
                sx={{ mt: 1 }}
              >
                <MenuItem onClick={() => { navigate('/custom-fields'); handleClose('admin'); }}>
                  Custom Fields
                </MenuItem>
                <MenuItem onClick={() => { navigate('/users'); handleClose('admin'); }}>
                  User Management
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { navigate('/settings'); handleClose('admin'); }}>
                  System Settings
                </MenuItem>
              </Menu>
            </>
          )}
        </Stack>
        <Box sx={{ flexGrow: 0, ml: 3 }}>
          {!token ? (
            <Button color="inherit" component={Link} to="/login" sx={{ borderRadius: 8, fontWeight: 600, mr: 1, px: 3, fontSize: 16, textTransform: 'none', border: '1px solid #e53935', color: '#e53935' }}>Login</Button>
          ) : (
            <Button variant="contained" sx={{ bgcolor: '#e53935', color: '#fff', borderRadius: 8, fontWeight: 700, px: 3, fontSize: 16, textTransform: 'none', boxShadow: 'none', '&:hover': { bgcolor: '#b71c1c' } }} onClick={handleLogout}>Logout</Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
