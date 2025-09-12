import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import { Button, TextField, Typography, Box, Alert, FormControlLabel, Checkbox, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

function Login({ onSwitch, onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordChangeForm, setPasswordChangeForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [tempToken, setTempToken] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('/api/auth/login', form);
      console.log('Login response:', res.data);
      if (res.data.requirePasswordChange) {
        setTempToken(res.data.token);
        // Store role temporarily for password change flow
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('role', res.data.role);
        setShowPasswordChange(true);
        return;
      }
      // Store role in the same way as token
      onLogin(res.data.token, rememberMe);
      
      // Store role based on remember me preference
      if (rememberMe) {
        localStorage.setItem('role', res.data.role);
      } else {
        sessionStorage.setItem('role', res.data.role);
      }
      
      navigate('/items');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordChangeForm.newPassword !== passwordChangeForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (passwordChangeForm.newPassword.length < 16) {
      setError('Password must be at least 16 characters long');
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordChangeForm.newPassword)) {
      setError('Password must contain at least one special character');
      return;
    }
    try {
      // Get current role from storage since it was set during initial login
      const currentRole = (rememberMe ? localStorage : sessionStorage).getItem('role');
      
      // Change password
      await axios.post('/api/auth/change-password', 
        {
          currentPassword: passwordChangeForm.currentPassword,
          newPassword: passwordChangeForm.newPassword
        },
        {
          headers: { Authorization: `Bearer ${tempToken}` }
        }
      );
      
      setShowPasswordChange(false);
      onLogin(tempToken, rememberMe);
      navigate('/items');
    } catch (err) {
      setError(err.response?.data?.error || 'Password change failed');
    }
  };

  return (
    <>
      <Box maxWidth={400} mx="auto" mt={4}>
        <Typography variant="h5" gutterBottom>Login</Typography>
        <form onSubmit={handleSubmit}>
          <TextField name="username" label="Username" value={form.username} onChange={handleChange} fullWidth margin="normal" required />
          <TextField name="password" label="Password" type="password" value={form.password} onChange={handleChange} fullWidth margin="normal" required />
          <FormControlLabel
            control={<Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />}
            label="Remember me"
            sx={{ mt: 1, mb: 2 }}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth>Login</Button>
        </form>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        <Button onClick={onSwitch} sx={{ mt: 2 }}>Don't have an account? Create one</Button>
      </Box>

      <Dialog open={showPasswordChange} onClose={() => {}}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Typography>
            You must change your password before continuing. Password must be at least 16 characters long and contain at least one special character.
          </Typography>
          <TextField
            margin="normal"
            required
            fullWidth
            name="currentPassword"
            label="Current Password"
            type="password"
            value={passwordChangeForm.currentPassword}
            onChange={e => setPasswordChangeForm(prev => ({ ...prev, currentPassword: e.target.value }))}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="newPassword"
            label="New Password"
            type="password"
            value={passwordChangeForm.newPassword}
            onChange={e => setPasswordChangeForm(prev => ({ ...prev, newPassword: e.target.value }))}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm New Password"
            type="password"
            value={passwordChangeForm.confirmPassword}
            onChange={e => setPasswordChangeForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
          />
          {error && (
            <Typography color="error" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePasswordChange} variant="contained">
            Change Password
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Login;
