export type ColorSchemeName = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  surface: string;
  listItem: string;
  numberButton: string;
  numberButtonText: string;
  operatorButton: string;
  operatorButtonText: string;
  equalsButton: string;
  equalsButtonText: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  divider: string;
  border: string;
  errorText: string;
  modalBackdrop: string;
  shadowColor: string;
};

export const lightTheme: ThemeColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  listItem: '#F6F8FA',
  numberButton: '#FFFFFF',
  numberButtonText: '#171717',
  operatorButton: '#EEF6FF',
  operatorButtonText: '#2587F5',
  equalsButton: '#2587F5',
  equalsButtonText: '#FFFFFF',
  accent: '#2587F5',
  textPrimary: '#171717',
  textSecondary: '#777777',
  divider: '#E8E8E8',
  border: '#E8E8E8',
  errorText: '#D9534F',
  modalBackdrop: 'rgba(15, 18, 22, 0.45)',
  shadowColor: 'rgba(23, 23, 23, 0.10)',
};

export const darkTheme: ThemeColors = {
  background: '#101114',
  surface: '#181B20',
  listItem: '#1D2229',
  numberButton: '#181B20',
  numberButtonText: '#F5F5F5',
  operatorButton: '#18283A',
  operatorButtonText: '#4A9CFF',
  equalsButton: '#2587F5',
  equalsButtonText: '#FFFFFF',
  accent: '#4A9CFF',
  textPrimary: '#F5F7FA',
  textSecondary: '#9BA3AF',
  divider: '#242830',
  border: '#242830',
  errorText: '#FF6B6B',
  modalBackdrop: 'rgba(0, 0, 0, 0.6)',
  shadowColor: 'rgba(0, 0, 0, 0.45)',
};

export const themes: Record<ColorSchemeName, ThemeColors> = {
  light: lightTheme,
  dark: darkTheme,
};
