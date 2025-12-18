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

const queryClient = new QueryClient();

export default function RootLayout() {
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
}
