import { createTheme } from '@mantine/core';

export const palette = {
  pageBackground: '#F7F9FC',
  surface: '#FFFFFF',
  border: '#DBE3EF',
  textPrimary: '#172033',
  textMuted: '#526070',
  primary: '#2563EB',
  primarySoft: '#DBEAFE',
  neutralSoft: '#EEF2F7',
} as const;

export const theme = createTheme({
  primaryColor: 'callBlue',
  defaultRadius: 8,
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  headings: {
    fontWeight: '760',
    sizes: {
      h1: { fontSize: '34px', lineHeight: '1.12' },
      h2: { fontSize: '26px', lineHeight: '1.18' },
      h3: { fontSize: '20px', lineHeight: '1.24' },
    },
  },
  colors: {
    callBlue: [
      '#EFF6FF',
      '#DBEAFE',
      '#BFDBFE',
      '#93C5FD',
      '#60A5FA',
      '#3B82F6',
      '#2563EB',
      '#1D4ED8',
      '#1E40AF',
      '#172F80',
    ],
  },
});
