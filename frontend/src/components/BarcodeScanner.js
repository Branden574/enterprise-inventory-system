import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  IconButton,
  TextField,
  Grid
} from '@mui/material';
import { Close as CloseIcon, CameraAlt as CameraIcon } from '@mui/icons-material';

// Dynamically import Quagga to handle loading errors
let Quagga = null;
try {
  Quagga = require('quagga');
} catch (error) {
  console.warn('Quagga library not available:', error);
}

const BarcodeScanner = ({ open, onClose, onScanResult, title = "Scan Barcode" }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    if (open && scanning) {
      startScanner();
    }
    return () => {
      try {
        stopScanner();
      } catch (error) {
        console.warn('Error in cleanup:', error);
      }
    };
  }, [open, scanning]);

  const startScanner = () => {
    if (!scannerRef.current) {
      setError('Scanner container not available');
      return;
    }

    if (!Quagga) {
      setError('Barcode scanner library not available');
      return;
    }

    try {
      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: 480,
            height: 320,
            facingMode: "environment" // Use back camera
          }
        },
        decoder: {
          readers: [
            "code_128_reader",
            "ean_reader",
            "ean_8_reader",
            "code_39_reader",
            "code_39_vin_reader",
            "codabar_reader",
            "upc_reader",
            "upc_e_reader",
            "i2of5_reader"
          ]
        },
        locate: true,
        locator: {
          patchSize: "medium",
          halfSample: true
        }
      }, (err) => {
        if (err) {
          console.error('Quagga initialization failed:', err);
          setError('Failed to initialize camera. Please check camera permissions.');
          return;
        }
        console.log("Quagga initialization finished. Ready to start");
        
        try {
          Quagga.start();
          
          // Set up detection handler
          Quagga.onDetected((data) => {
            const code = data.codeResult.code;
            console.log('Barcode detected:', code);
            
            // Stop scanner and return result
            stopScanner();
            onScanResult(code);
            onClose();
          });
        } catch (startError) {
          console.error('Failed to start Quagga:', startError);
          setError('Failed to start camera scanning.');
        }
      });
    } catch (initError) {
      console.error('Failed to initialize Quagga:', initError);
      setError('Failed to initialize barcode scanner.');
    }
  };

  const stopScanner = () => {
    try {
      if (Quagga && typeof Quagga.stop === 'function') {
        Quagga.stop();
      }
      if (Quagga && typeof Quagga.offDetected === 'function') {
        Quagga.offDetected();
      }
    } catch (error) {
      console.warn('Error stopping scanner:', error);
      // Ignore errors when stopping scanner
    }
  };

  const handleStartScanning = () => {
    setError('');
    if (!Quagga) {
      setError('Barcode scanner library not available. Please use manual entry.');
      return;
    }
    setScanning(true);
  };

  const handleStopScanning = () => {
    setScanning(false);
    try {
      stopScanner();
    } catch (error) {
      console.warn('Error stopping scanner:', error);
    }
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScanResult(manualCode.trim());
      onClose();
    }
  };

  const handleClose = () => {
    try {
      handleStopScanning();
    } catch (error) {
      console.warn('Error during close:', error);
    }
    setManualCode('');
    setError('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {title}
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            Use your camera to scan a barcode or QR code, or enter the code manually below.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Camera Scanner */}
        <Box sx={{ mb: 3 }}>
          {!scanning ? (
            <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'grey.100', borderRadius: 1 }}>
              <CameraIcon sx={{ fontSize: 48, color: 'grey.500', mb: 2 }} />
              <Typography variant="body1" color="textSecondary" gutterBottom>
                Ready to scan
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<CameraIcon />}
                onClick={handleStartScanning}
              >
                Start Camera
              </Button>
            </Box>
          ) : (
            <Box>
              <Box 
                ref={scannerRef}
                sx={{ 
                  width: '100%', 
                  height: 320,
                  border: '2px solid',
                  borderColor: 'primary.main',
                  borderRadius: 1,
                  overflow: 'hidden',
                  position: 'relative'
                }}
              />
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Position the barcode within the camera view
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={handleStopScanning}
                  color="secondary"
                >
                  Stop Camera
                </Button>
              </Box>
            </Box>
          )}
        </Box>

        {/* Manual Entry */}
        <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Or enter code manually:
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={8}>
              <TextField
                fullWidth
                label="Barcode/QR Code"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter barcode or QR code"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleManualSubmit();
                  }
                }}
              />
            </Grid>
            <Grid item xs={4}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleManualSubmit}
                disabled={!manualCode.trim()}
              >
                Submit
              </Button>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BarcodeScanner;
