import React, { useState, useEffect } from 'react';
import axios from '../utils/axios';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  TextField,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';

function UserManagement({ token }) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userRole, setUserRole] = useState('');

  // Check if user is admin or superadmin
  useEffect(() => {
    const role = localStorage.getItem('role') || sessionStorage.getItem('role');
    console.log('Current user role:', role);
    setUserRole(role);
    if (!['admin', 'superadmin'].includes(role)) {
      setError('You do not have permission to access this page.');
      return;
    }
    if (role !== 'superadmin') {
      setError('Only superadmins can create admin accounts.');
    }
  }, []);
  const [editUser, setEditUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordResetDialog, setPasswordResetDialog] = useState(false);
  const [resetUserId, setResetUserId] = useState(null);
  const [resetUserName, setResetUserName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'admin' });
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Fetch users on component mount
  useEffect(() => {
    if (['admin', 'superadmin'].includes(userRole)) {
      fetchUsers();
    }
  }, [token, userRole]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (err) {
      setError('Failed to fetch users. ' + (err.response?.data?.error || err.message));
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`/api/users/${userId}/role`, { role: newRole });
      setSuccess('User role updated successfully');
      fetchUsers(); // Refresh the user list
    } catch (err) {
      setError('Failed to update user role. ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`/api/users/${userId}`);
        setSuccess('User deleted successfully');
        fetchUsers(); // Refresh the user list
      } catch (err) {
        setError('Failed to delete user. ' + (err.response?.data?.error || err.message));
      }
    }
  };

  const handlePasswordResetOpen = (user) => {
    setResetUserId(user._id);
    setResetUserName(user.username);
    setNewPassword('');
    setPasswordResetDialog(true);
  };

  const handlePasswordReset = async () => {
    try {
      if (!newPassword || newPassword.length < 10) {
        setError('Password must be at least 10 characters long');
        return;
      }

      await axios.put(`/api/users/${resetUserId}/reset-password`, { 
        newPassword: newPassword 
      });
      
      setSuccess(`Password reset successfully for ${resetUserName}. User will be required to change password on next login.`);
      setPasswordResetDialog(false);
      setNewPassword('');
      fetchUsers();
    } catch (err) {
      setError('Failed to reset password. ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditOpen = (user) => {
    setEditUser(user);
    setIsCreatingNew(false);
    setDialogOpen(true);
  };

  const handleCreateAdmin = async () => {
    try {
      setError('');
      const role = localStorage.getItem('role') || sessionStorage.getItem('role');
      console.log('Current role from storage:', role);
      
      // Validate inputs
      if (!newUser.username || !newUser.password) {
        setError('Username and password are required');
        return;
      }

      // Check if user is superadmin
      if (role !== 'superadmin') {
        console.error('Not a superadmin. Current role:', role);
        setError('Only superadmins can create admin accounts.');
        return;
      }

      // Check token
      if (!token) {
        console.error('No token available');
        setError('Authentication error. Please try logging in again.');
        return;
      }

      console.log('Attempting to create admin account...');
      console.log('Role:', role);
      console.log('Token present:', !!token);
      
      console.log('Attempting to create admin account...');
      
      const response = await axios.post('/api/auth/register', { 
        username: newUser.username,
        password: newUser.password,
        role: 'admin'
      });
      console.log('Create admin response:', response.data);
      setSuccess(`Admin account created for ${newUser.username}`);
      setNewUser({ username: '', password: '', role: 'admin' });
      setDialogOpen(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create admin account');
    }
  };

  const handleEditClose = () => {
    setDialogOpen(false);
    setEditUser(null);
  };

  const handleEditSave = async () => {
    try {
      await axios.put(`/api/users/${editUser._id}`, editUser);
      setSuccess('User updated successfully');
      fetchUsers(); // Refresh the user list
      handleEditClose();
    } catch (err) {
      setError('Failed to update user. ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        User Management
      </Typography>
      
      {userRole === 'superadmin' && (
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => setDialogOpen(true)}
          sx={{ mb: 3 }}
        >
          Create New Admin Account
        </Button>
      )}

      {!['admin', 'superadmin'].includes(userRole) ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          You must be an admin to access this page.
        </Alert>
      ) : (
        <>
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email || 'N/A'}</TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                    size="small"
                    disabled={user.role === 'superadmin'}
                  >
                    <MenuItem value="user">User</MenuItem>
                    <MenuItem value="staff">Staff</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    {user.role === 'superadmin' && <MenuItem value="superadmin">Super Admin</MenuItem>}
                  </Select>
                </TableCell>
                <TableCell>
                  {user.requirePasswordChange ? (
                    <Chip label="Must Change Password" color="warning" size="small" />
                  ) : (
                    <Chip label="Active" color="success" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEditOpen(user)} color="primary" title="Edit User">
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    onClick={() => handlePasswordResetOpen(user)} 
                    color="secondary" 
                    title="Reset Password"
                  >
                    <LockResetIcon />
                  </IconButton>
                  {user.role !== 'superadmin' && (
                    <IconButton onClick={() => handleDeleteUser(user._id)} color="error" title="Delete User">
                      <DeleteIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleEditClose}>
        <DialogTitle>{editUser ? 'Edit User' : 'Create New Admin Account'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {editUser ? (
              <>
                <Typography variant="body1">
                  Username: {editUser.username}
                </Typography>
                <Select
                  value={editUser.role}
                  onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </>
            ) : (
              <>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  The new admin will be required to change their password on first login.
                </Typography>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Username (Email)"
                  type="email"
                  fullWidth
                  value={newUser.username}
                  onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                />
                <TextField
                  margin="dense"
                  label="Default Password"
                  type="text"
                  fullWidth
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  helperText="They will be required to change this on first login"
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button 
            onClick={editUser ? handleEditSave : handleCreateAdmin} 
            color="primary" 
            variant="contained"
          >
            {editUser ? 'Save Changes' : 'Create Admin'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={passwordResetDialog} onClose={() => setPasswordResetDialog(false)}>
        <DialogTitle>Reset Password for {resetUserName}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Enter a new password for this user. They will be required to change it on their next login.
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              label="New Password"
              type="password"
              fullWidth
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              helperText="Minimum 10 characters required"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordResetDialog(false)}>Cancel</Button>
          <Button 
            onClick={handlePasswordReset} 
            color="primary" 
            variant="contained"
            disabled={!newPassword || newPassword.length < 10}
          >
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>
        </>
      )}
    </Box>
  );
}

export default UserManagement;
