import { createTheme } from '@mui/material/styles';

const getTheme = (mode = 'light', locale) =>
  createTheme(
  {
    palette: {
      mode,
      primary: { main: '#148bea' },
      secondary: { main: '#ff4081' },
      background: {
        default: mode === 'light' ? '#fafafa' : '#303030',
        paper: mode === 'light' ? '#fff' : '#424242'
      }
    },
    typography: {
      fontFamily: ['Roboto', 'Helvetica', 'Arial', 'sans-serif'].join(','),
    },
    spacing: 8,
  },
  locale
  );

export default getTheme;
