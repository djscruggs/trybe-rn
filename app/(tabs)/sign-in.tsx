import { useAuth, useSignIn, useSSO } from '@clerk/clerk-expo';
import { SocialIcon } from '@rneui/themed';
import * as AuthSession from 'expo-auth-session';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useState } from 'react';
import { View, SafeAreaView, ViewStyle, ActivityIndicator, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

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

export default function SignInPage() {
  useWarmUpBrowser();
  const { currentUser } = useCurrentUser();
  const { isSignedIn, isLoaded } = useAuth();
  const { signIn, setActive } = useSignIn();
  const { startSSOFlow } = useSSO();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');

  // Redirect to home if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn && currentUser) {
      router.replace('/');
    }
  }, [isLoaded, isSignedIn, currentUser]);

  // Handle Email/Password Sign In
  const onSignInPress = async () => {
    if (!isLoaded) return;

    try {
      const completeSignIn = await signIn!.create({
        identifier: emailAddress,
        password,
      });

      if (completeSignIn.status === 'complete') {
        await setActive!({ session: completeSignIn.createdSessionId });
        router.replace('/');
      } else {
        console.error('Sign in incomplete:', JSON.stringify(completeSignIn, null, 2));
      }
    } catch (err: any) {
      console.error('Sign in error:', JSON.stringify(err, null, 2));
    }
  };

  // Handle OAuth Sign In
  const onSocialSignIn = useCallback(
    async (strategy: 'oauth_google' | 'oauth_linkedin' | 'oauth_slack') => {
      try {
        const { createdSessionId, setActive: setSSOActive } = await startSSOFlow({
          strategy,
          redirectUrl: AuthSession.makeRedirectUri(),
        });

        if (createdSessionId) {
          setSSOActive!({ session: createdSessionId });
          router.replace('/');
        } else {
          console.log('Additional steps required for authentication');
        }
      } catch (err) {
        console.error('OAuth error:', JSON.stringify(err, null, 2));
      }
    },
    [startSSOFlow]
  );

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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 items-center justify-center bg-white px-6 py-8">
            <View className="mb-8 items-center">
              <Text className="mb-4 text-3xl font-bold text-gray-900">
                Welcome Back
              </Text>
              <Text className="text-center text-base text-gray-600">
                Sign in to continue your journey with Trybe
              </Text>
            </View>

            <View className="w-full max-w-sm">
              {/* Email/Password Form */}
              <View className="mb-6">
                <TextInput
                  autoCapitalize="none"
                  value={emailAddress}
                  placeholder="Email"
                  onChangeText={setEmailAddress}
                  className="mb-3 h-12 rounded-lg border border-gray-300 px-4"
                  keyboardType="email-address"
                  autoComplete="email"
                />
                <TextInput
                  value={password}
                  placeholder="Password"
                  secureTextEntry
                  onChangeText={setPassword}
                  className="mb-4 h-12 rounded-lg border border-gray-300 px-4"
                  autoComplete="password"
                />
                <TouchableOpacity
                  onPress={onSignInPress}
                  className="mb-6 h-12 items-center justify-center rounded-lg bg-red-600"
                >
                  <Text className="font-semibold text-white">Sign In with Email</Text>
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View className="mb-6 flex-row items-center">
                <View className="flex-1 border-b border-gray-300" />
                <Text className="mx-4 text-gray-500">or continue with</Text>
                <View className="flex-1 border-b border-gray-300" />
              </View>

              {/* Social Sign-In Buttons */}
              <View className="mb-6 gap-3">
                <SocialIcon
                  type="google"
                  iconType="font-awesome"
                  style={{ width: '100%', height: 50, borderRadius: 8 }}
                  title="Continue with Google"
                  button
                  onPress={() => onSocialSignIn('oauth_google')}
                />
                <SocialIcon
                  type="linkedin"
                  iconType="font-awesome"
                  style={{ width: '100%', height: 50, borderRadius: 8 }}
                  title="Continue with LinkedIn"
                  button
                  onPress={() => onSocialSignIn('oauth_linkedin')}
                />
                <SocialIcon
                  type="slack"
                  iconType="font-awesome"
                  style={{ width: '100%', height: 50, borderRadius: 8, backgroundColor: '#4A154B' }}
                  title="Continue with Slack"
                  button
                  onPress={() => onSocialSignIn('oauth_slack')}
                />
              </View>

              {/* Sign-Up Link */}
              <TouchableOpacity
                onPress={() => router.push('/sign-up')}
                className="mb-4"
              >
                <Text className="text-center text-base text-gray-700">
                  Don't have an account?{' '}
                  <Text className="font-semibold text-red-600">Sign Up</Text>
                </Text>
              </TouchableOpacity>
            </View>

            <View className="mt-8">
              <Text className="text-center text-sm text-gray-500">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
