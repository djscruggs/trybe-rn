import '~/global.css';

import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, Slot } from 'expo-router';
import React from 'react';
import Toast from 'react-native-toast-message';

import { ErrorBoundary } from './components/ErrorBoundary';

import { UserProvider } from '~/contexts/currentuser-context';
import { tokenCache } from '~/lib/cache';
import { CLERK_PUBLISHABLE_KEY } from '~/lib/environment';
import { initSentry } from '~/lib/sentry';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://b4a331c1d5b856f18542ccc6734b9c65@o4506538845929472.ingest.us.sentry.io/4510626682241024',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

// Initialize Sentry as early as possible
initSentry();

const queryClient = new QueryClient();

export default Sentry.wrap(function RootLayout() {
  const publishableKey = CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) {
    console.error('❌ RootLayout: Missing CLERK_PUBLISHABLE_KEY');
    throw new Error('Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your ~/lib/environment.ts');
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
          <UserProvider>
            <ClerkLoaded>
              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              />
            </ClerkLoaded>
            <Toast />
          </UserProvider>
        </ClerkProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
});
