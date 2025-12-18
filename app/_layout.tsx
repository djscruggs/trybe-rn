import React from 'react';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, Slot } from 'expo-router';
import Toast from 'react-native-toast-message';

import { UserProvider } from '~/contexts/currentuser-context';
import { ErrorBoundary } from './components/ErrorBoundary';
import { tokenCache } from '~/lib/cache';
import { CLERK_PUBLISHABLE_KEY } from '~/lib/environment';

const queryClient = new QueryClient();

export default function RootLayout() {
  console.log('🚀 RootLayout: Starting app initialization');
  
  const publishableKey = CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) {
    console.error('❌ RootLayout: Missing CLERK_PUBLISHABLE_KEY');
    throw new Error('Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your ~/lib/environment.ts');
  }

  console.log('✅ RootLayout: Clerk key found, rendering providers');

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