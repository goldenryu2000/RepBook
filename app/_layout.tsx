import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { TamaguiProvider, Theme } from 'tamagui';

import { setupDatabase } from '../db/database';
import { useUserStore } from '../store/userStore';
import tamaguiConfig from '../tamagui.config';
import { CustomAlert } from '../components/CustomAlert';

export default function RootLayout() {
  const { loadUser } = useUserStore();
  useEffect(() => {
    setupDatabase()
      .then(() => loadUser())
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
      <Theme name="dark">
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            animationDuration: 600,
            contentStyle: { backgroundColor: '#09090b' },
          }}
        >
          <Stack.Screen name="(tabs)" />
        </Stack>
        <CustomAlert />
      </Theme>
    </TamaguiProvider>
  );
}
