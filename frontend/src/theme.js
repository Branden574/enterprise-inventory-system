import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  typography: {
    fontSize: 14, // Increase base font size
    h3: {
      fontSize: '2.5rem',
    },
    h5: {
      fontSize: '1.5rem',
    },
    h6: {
      fontSize: '1.25rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
          padding: '8px 16px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-input': {
            fontSize: '1rem',
            padding: '12px',
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          padding: '12px',
        },
      },
    },
  },
});

export default theme;
