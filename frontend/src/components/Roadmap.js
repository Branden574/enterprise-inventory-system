import React from 'react';
import { Box, Typography, List, ListItem, ListItemIcon, ListItemText, Divider, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

const features = [
  { section: 'Organize', items: [
    { name: 'Items', done: true },
    { name: 'Inventory Import', done: true },
    { name: 'Item Photos', done: true },
    { name: 'Inventory Lists', done: true },
    { name: 'User Licenses', done: true },
  ]},
  { section: 'Customize', items: [
    { name: 'Custom Fields', done: true },
    { name: 'Custom Folders', done: false },
    { name: 'Custom Tags', done: false },
    { name: 'Customizable User Access', done: true },
    { name: 'Customizable Roles', done: true },
  ]},
  { section: 'Manage', items: [
    { name: 'Pick Lists', done: false },
    { name: 'Barcode/QR Scanning & Label Generation', done: false },
    { name: 'Purchase Orders', done: true },
    { name: 'Item Check-in/Check-out', done: false },
  ]},
  { section: 'Track & Update', items: [
    { name: 'Low Stock Alerts', done: true },
    { name: 'Date-Based Alerts', done: false },
    { name: 'Offline Mobile Access', done: false },
    { name: 'Automatic Sync', done: false },
    { name: 'In-App/Email Alerts', done: true },
  ]},
  { section: 'Report', items: [
    { name: 'Activity History Reports', done: false },
    { name: 'Inventory Summary Reports', done: false },
    { name: 'User Activity Summary Reports', done: false },
    { name: 'Low Stock Reports', done: false },
    { name: 'Move Summary Reports', done: false },
    { name: 'Item Flow Report', done: false },
    { name: 'Saved Reports', done: false },
    { name: 'Report Subscriptions', done: false },
  ]},
  { section: 'Integrations', items: [
    { name: 'QuickBooks Online', done: false },
    { name: 'Slack', done: false },
    { name: 'Webhooks', done: false },
    { name: 'Microsoft Teams', done: false },
    { name: 'API', done: false },
  ]},
];

function Roadmap() {
  return (
    <Box maxWidth={700} mx="auto" mt={6} p={3} bgcolor="#fff" borderRadius={4} boxShadow={3}>
      <Typography variant="h3" align="center" fontWeight={700} gutterBottom>
        Feature Roadmap
      </Typography>
      <Typography align="center" color="text.secondary" mb={4}>
        Here’s what’s planned and in progress for your Sortly-like inventory system.
      </Typography>
      {features.map(section => (
        <Box key={section.section} mb={3}>
          <Typography variant="h5" fontWeight={600} mb={1}>{section.section}</Typography>
          <List>
            {section.items.map(item => (
              <ListItem key={item.name}>
                <ListItemIcon>
                  {item.done ? <CheckCircleIcon color="success" /> : <RadioButtonUncheckedIcon color="disabled" />}
                </ListItemIcon>
                <ListItemText primary={item.name} />
                {item.done && <Chip label="Done" color="success" size="small" />}
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 2 }} />
        </Box>
      ))}
    </Box>
  );
}

export default Roadmap;
