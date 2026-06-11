import {
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts as usePlusJakartaSans,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
} from '@expo-google-fonts/work-sans';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initI18n } from '../src/i18n';
import { supabase } from '../src/lib/supabase';
import { ThemeProvider, useTheme } from '../src/theme';

const queryClient = new QueryClient();

// Keep the splash screen visible until fonts are ready.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

function AppShell() {
  const theme = useTheme();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!authed && !inAuthGroup) router.replace('/(auth)/login');
    if (authed && inAuthGroup) router.replace('/(tabs)');
  }, [authed, ready, segments, router]);

  return (
    <>
      <StatusBar style={theme.name === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = usePlusJakartaSans({
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    WorkSans_400Regular,
    WorkSans_500Medium,
    WorkSans_600SemiBold,
  });
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    initI18n().then(() => setI18nReady(true));
  }, []);

  useEffect(() => {
    if (fontsLoaded && i18nReady) SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsLoaded, i18nReady]);

  if (!fontsLoaded || !i18nReady) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AppShell />
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
