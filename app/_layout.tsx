import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { themes } from '@/constants/theme';
import { ThemeProvider, useThemeMode } from '@/hooks/use-theme';

function RootNavigator() {
  const mode = useThemeMode();
  const theme = themes[mode];

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.background).catch(() => {
      // Ignore: setting the root background is best-effort.
    });
  }, [theme.background]);

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="index" />
      </Stack>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}
