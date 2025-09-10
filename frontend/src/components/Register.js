import React, { useState } from 'react';
import axios from 'axios';
import { Button, TextField, Typography, Box, Alert } from '@mui/material';

function Register({ onSwitch }) {
  const [form, setForm] = useState({ 
    username: '', 
    password: '', 
    email: '', 
    firstName: '', 
    lastName: '' 
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (form.password.length < 10) {
      setError('Password must be at least 10 characters.');
      return;
    }
    try {
      await axios.post('http://localhost:5000/api/auth/register', form);
      setSuccess('Account created! You can now log in.');
      setForm({ username: '', password: '', email: '', firstName: '', lastName: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <Box maxWidth={400} mx="auto" mt={4}>
      <Typography variant="h5" gutterBottom>Create Account</Typography>
      <form onSubmit={handleSubmit}>
        <TextField 
          name="firstName" 
          label="First Name" 
          value={form.firstName} 
          onChange={handleChange} 
          fullWidth 
          margin="normal" 
          required 
        />
        <TextField 
          name="lastName" 
          label="Last Name" 
          value={form.lastName} 
          onChange={handleChange} 
          fullWidth 
          margin="normal" 
          required 
        />
        <TextField 
          name="email" 
          label="Email" 
          type="email" 
          value={form.email} 
          onChange={handleChange} 
          fullWidth 
          margin="normal" 
          required 
        />
        <TextField 
          name="username" 
          label="Username" 
          value={form.username} 
          onChange={handleChange} 
          fullWidth 
          margin="normal" 
          required 
        />
        <TextField 
          name="password" 
          label="Password" 
          type="password" 
          value={form.password} 
          onChange={handleChange} 
          fullWidth 
          margin="normal" 
          required 
          helperText="Password must be at least 10 characters"
        />
        <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
          Create Account
        </Button>
      </form>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
      <Button onClick={onSwitch} sx={{ mt: 2 }}>Already have an account? Log in</Button>
    </Box>
  );
}

export default Register;
