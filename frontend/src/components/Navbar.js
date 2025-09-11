import React, { useState, useEffect } from 'react';
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
  Divider,
  ListItemIcon,
  ListItemText,
  Fade,
  Zoom
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import SettingsIcon from '@mui/icons-material/Settings';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CategoryIcon from '@mui/icons-material/Category';
import BookIcon from '@mui/icons-material/Book';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';
import axios from '../utils/axios';
import NotificationBell from './NotificationBell';

function Navbar({ token, setToken }) {
  const navigate = useNavigate();
  const [menuAnchor, setMenuAnchor] = useState({
    inventory: null,
    purchase: null,
    internal: null,
    importExport: null,
    admin: null,
    itemsSubmenu: null
  });
  
  // Categories state for submenu
  const [categories, setCategories] = useState([]);
  const [submenuOpen, setSubmenuOpen] = useState(false);

  // Get user role from localStorage or sessionStorage
  const remembered = localStorage.getItem('rememberMe') === 'true';
  const userRole = remembered ? localStorage.getItem('role') : sessionStorage.getItem('role');
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';
  
  // Debug logging
  console.log('Remembered?', remembered);
  console.log('Current user role:', userRole);
  console.log('Is admin?', isAdmin);

  // Fetch categories for submenu
  useEffect(() => {
    if (token) {
      fetchCategories();
    }
  }, [token]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

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
    if (menu === 'inventory') {
      setSubmenuOpen(false);
      setMenuAnchor(prev => ({ ...prev, itemsSubmenu: null }));
    }
  };

  const handleSubmenuOpen = (event) => {
    setMenuAnchor(prev => ({
      ...prev,
      itemsSubmenu: event.currentTarget
    }));
    setSubmenuOpen(true);
  };

  const handleSubmenuClose = () => {
    setMenuAnchor(prev => ({ ...prev, itemsSubmenu: null }));
    setSubmenuOpen(false);
  };

  const navigateToItemsByCategory = (categoryId, categoryName) => {
    if (categoryId) {
      navigate(`/items?category=${categoryId}&categoryName=${encodeURIComponent(categoryName)}`);
    } else {
      navigate('/items');
    }
    handleClose('inventory');
    handleSubmenuClose();
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
              
              {/* Live Notifications Bell */}
              <NotificationBell />
              
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
                TransitionComponent={Fade}
                transitionDuration={200}
              >
                {/* Items List with Submenu */}
                <MenuItem 
                  onClick={handleSubmenuOpen}
                  onMouseEnter={handleSubmenuOpen}
                  sx={{ 
                    pr: 4, 
                    position: 'relative',
                    '&:hover': {
                      backgroundColor: 'primary.light',
                      color: 'primary.contrastText'
                    }
                  }}
                >
                  <ListItemIcon>
                    <InventoryIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Items List" />
                  <KeyboardArrowRightIcon 
                    sx={{ 
                      position: 'absolute', 
                      right: 8,
                      transition: 'transform 0.2s ease',
                      transform: submenuOpen ? 'rotate(90deg)' : 'rotate(0deg)'
                    }} 
                  />
                </MenuItem>
                
                <Divider sx={{ my: 0.5 }} />
                
                <MenuItem onClick={() => { navigate('/categories'); handleClose('inventory'); }}>
                  <ListItemIcon>
                    <CategoryIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Categories" />
                </MenuItem>
              </Menu>

              {/* Items Submenu */}
              <Menu
                anchorEl={menuAnchor.itemsSubmenu}
                open={submenuOpen && Boolean(menuAnchor.itemsSubmenu)}
                onClose={handleSubmenuClose}
                elevation={3}
                MenuListProps={{
                  sx: { py: 0.5, minWidth: 200 }
                }}
                sx={{ 
                  mt: -1,
                  ml: 1,
                  '& .MuiMenu-paper': {
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  }
                }}
                TransitionComponent={Zoom}
                transitionDuration={150}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right'
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left'
                }}
              >
                {/* All Items Option */}
                <MenuItem 
                  onClick={() => navigateToItemsByCategory(null, 'All Items')}
                  sx={{ 
                    fontWeight: 600,
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'primary.light',
                      color: 'primary.contrastText'
                    }
                  }}
                >
                  <ListItemIcon>
                    <InventoryIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="All Items" />
                </MenuItem>
                
                <Divider sx={{ my: 0.5 }} />
                
                {/* Category Options */}
                {categories.map((category) => (
                  <MenuItem 
                    key={category._id}
                    onClick={() => navigateToItemsByCategory(category._id, category.name)}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'secondary.light',
                        color: 'secondary.contrastText'
                      }
                    }}
                  >
                    <ListItemIcon>
                      <BookIcon fontSize="small" color="secondary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={category.name} 
                      secondary={`${category.itemCount || 0} items`}
                    />
                  </MenuItem>
                ))}
                
                {categories.length === 0 && (
                  <MenuItem disabled>
                    <ListItemText 
                      primary="No categories found" 
                      sx={{ fontStyle: 'italic' }}
                    />
                  </MenuItem>
                )}
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
                TransitionComponent={Fade}
                transitionDuration={200}
              >
                <MenuItem onClick={() => { navigate('/purchase-orders'); handleClose('purchase'); }}>
                  <ListItemIcon>
                    <ListAltIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="View Orders" />
                </MenuItem>
                <MenuItem onClick={() => { navigate('/purchase-orders/new'); handleClose('purchase'); }}>
                  <ListItemIcon>
                    <ShoppingCartIcon fontSize="small" color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Create Order" />
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { navigate('/completed-pos'); handleClose('purchase'); }}>
                  <ListItemIcon>
                    <AssignmentIcon fontSize="small" color="warning" />
                  </ListItemIcon>
                  <ListItemText primary="Completed POs" />
                </MenuItem>
                <MenuItem onClick={() => { navigate('/completed-pos/new'); handleClose('purchase'); }}>
                  <ListItemIcon>
                    <CloudUploadIcon fontSize="small" color="info" />
                  </ListItemIcon>
                  <ListItemText primary="Upload Completed PO" />
                </MenuItem>
                {isAdmin && (
                  <>
                    <Divider />
                    <MenuItem onClick={() => { navigate('/purchase-orders/requests'); handleClose('purchase'); }}>
                      <ListItemIcon>
                        <NotificationsIcon fontSize="small" color="error" />
                      </ListItemIcon>
                      <ListItemText primary="PO Requests" />
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/order-requests'); handleClose('purchase'); }}>
                      <ListItemIcon>
                        <AssignmentIcon fontSize="small" color="secondary" />
                      </ListItemIcon>
                      <ListItemText primary="Order Requests" />
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
                TransitionComponent={Fade}
                transitionDuration={200}
              >
                <MenuItem onClick={() => { navigate('/internal-orders'); handleClose('internal'); }}>
                  <ListItemIcon>
                    <ListAltIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="My Orders" />
                </MenuItem>
                <MenuItem onClick={() => { navigate('/internal-orders/new'); handleClose('internal'); }}>
                  <ListItemIcon>
                    <ShoppingCartIcon fontSize="small" color="success" />
                  </ListItemIcon>
                  <ListItemText primary="New Order Request" />
                </MenuItem>
                {isAdmin && (
                  <>
                    <Divider />
                    <MenuItem onClick={() => { navigate('/internal-orders/pending'); handleClose('internal'); }}>
                      <ListItemIcon>
                        <NotificationsIcon fontSize="small" color="warning" />
                      </ListItemIcon>
                      <ListItemText primary="Pending Requests" />
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/internal-orders/all'); handleClose('internal'); }}>
                      <ListItemIcon>
                        <ListAltIcon fontSize="small" color="info" />
                      </ListItemIcon>
                      <ListItemText primary="All Internal Orders" />
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
                TransitionComponent={Fade}
                transitionDuration={200}
              >
                <MenuItem onClick={() => { navigate('/import-export'); handleClose('importExport'); }}>
                  <ListItemIcon>
                    <ImportExportIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Import/Export Data" />
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
                TransitionComponent={Fade}
                transitionDuration={200}
              >
                <MenuItem onClick={() => { navigate('/custom-fields'); handleClose('admin'); }}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Custom Fields" />
                </MenuItem>
                <MenuItem onClick={() => { navigate('/users'); handleClose('admin'); }}>
                  <ListItemIcon>
                    <PeopleIcon fontSize="small" color="info" />
                  </ListItemIcon>
                  <ListItemText primary="User Management" />
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { navigate('/settings'); handleClose('admin'); }}>
                  <ListItemIcon>
                    <SecurityIcon fontSize="small" color="warning" />
                  </ListItemIcon>
                  <ListItemText primary="System Settings" />
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
