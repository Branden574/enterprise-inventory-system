import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, TextField, Select, MenuItem } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

function Users() {
  const [users, setUsers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState('user');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await axios.get('/api/users');
    setUsers(res.data);
  };
  return (
    <div>
      <Typography variant="h4" gutterBottom>Accounts</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(user => (
              <TableRow key={user._id}>
                <TableCell>
                  {editingId === user._id ? (
                    <TextField value={editUsername} onChange={e => setEditUsername(e.target.value)} />
                  ) : (
                    user.username
                  )}
                </TableCell>
                <TableCell>
                  {editingId === user._id ? (
                    <Select value={editRole} onChange={e => setEditRole(e.target.value)}>
                      <MenuItem value="user">user</MenuItem>
                      <MenuItem value="admin">admin</MenuItem>
                    </Select>
                  ) : (
                    user.role
                  )}
                </TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  {editingId === user._id ? (
                    <>
                      <Button onClick={() => handleEditSubmit(user._id)} variant="contained" color="primary" size="small">Save</Button>
                      <Button onClick={() => setEditingId(null)} size="small" sx={{ ml: 1 }}>Cancel</Button>
                    </>
                  ) : (
                    <>
                      <IconButton onClick={() => handleEdit(user)}><EditIcon /></IconButton>
                      <IconButton onClick={() => handleDelete(user._id)}><DeleteIcon /></IconButton>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default Users;
