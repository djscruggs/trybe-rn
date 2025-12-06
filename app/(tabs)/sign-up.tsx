import { useAuth, useSSO } from '@clerk/clerk-expo';
import { SocialIcon } from '@rneui/themed';
import * as AuthSession from 'expo-auth-session';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect } from 'react';
import { View, SafeAreaView, ViewStyle, ActivityIndicator } from 'react-native';

import { Text } from '~/components/nativewindui/Text';
import { useCurrentUser } from '~/contexts/currentuser-context';

const ROOT_STYLE: ViewStyle = { flex: 1 };

export const useWarmUpBrowser = () => {
  useEffect(() => {
    // Preloads the browser for Android devices to reduce authentication load time
    // See: https://docs.expo.dev/guides/authentication/#improving-user-experience
    void WebBrowser.warmUpAsync();
    return () => {
      // Cleanup: closes browser when component unmounts
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession();

export default function SignUpPage() {
  useWarmUpBrowser();
  const { currentUser } = useCurrentUser();
  const { isSignedIn, isLoaded } = useAuth();

  // Redirect to home if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn && currentUser) {
      router.replace('/');
    }
  }, [isLoaded, isSignedIn, currentUser]);

  // Use the `useSSO()` hook to access the `startSSOFlow()` method
  const { startSSOFlow } = useSSO();

  const googleSignIn = useCallback(async () => {
    try {
      // Start the authentication process by calling `startSSOFlow()`
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
        // Defaults to current path
        redirectUrl: AuthSession.makeRedirectUri(),
      });

      // If sign in was successful, set the active session
      if (createdSessionId) {
        setActive!({ session: createdSessionId });
        router.replace('/');
      } else {
        // If there is no `createdSessionId`,
        // there are missing requirements, such as MFA
        console.log('Additional steps required for authentication');
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error('Sign in error:', JSON.stringify(err, null, 2));
    }
  }, [startSSOFlow]);

  // Show loading while checking auth state
  if (!isLoaded) {
    return (
      <SafeAreaView style={ROOT_STYLE}>
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator size="large" color="red" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={ROOT_STYLE}>
      <View className="flex-1 items-center justify-center bg-white px-6">
        <View className="mb-8 items-center">
          <Text className="mb-4 text-3xl font-bold text-gray-900">Welcome to Trybe</Text>
          <Text className="text-center text-base text-gray-600">
            Sign in to join challenges, track your progress, and connect with the community
          </Text>
        </View>

        <View className="w-full max-w-sm">
          <SocialIcon
            type="google"
            iconType="font-awesome"
            style={{ width: '100%', height: 60, borderRadius: 8 }}
            title="Continue with Google"
            button
            onPress={googleSignIn}
          />
        </View>

        <View className="mt-8">
          <Text className="text-center text-sm text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
