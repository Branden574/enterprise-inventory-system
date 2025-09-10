const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Debug endpoint to check uploads directory
router.get('/uploads-check', (req, res) => {
  try {
    const uploadsPath = path.join(__dirname, '../uploads');
    console.log('Checking uploads directory at:', uploadsPath);
    
    if (!fs.existsSync(uploadsPath)) {
      return res.json({
        error: 'Uploads directory does not exist',
        path: uploadsPath,
        exists: false
      });
    }
    
    const files = fs.readdirSync(uploadsPath);
    res.json({
      uploadsPath,
      exists: true,
      files: files.slice(0, 10), // First 10 files
      totalFiles: files.length
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
      stack: err.stack
    });
  }
});

// Test static file serving
router.get('/test-static/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    console.log('Testing static file:', filePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'File not found',
        path: filePath,
        exists: false
      });
    }
    
    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;
