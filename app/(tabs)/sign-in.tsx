import { useAuth, useSignIn } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  View,
  SafeAreaView,
  ViewStyle,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';

import { SocialAuthButtons } from '~/components/SocialAuthButtons';
import { Text } from '~/components/nativewindui/Text';
import { useCurrentUser } from '~/contexts/currentuser-context';
import { API_HOST } from '~/lib/environment';
import { useSocialAuth } from '~/lib/useSocialAuth';
import { useWarmUpBrowser } from '~/lib/useWarmUpBrowser';

const ROOT_STYLE: ViewStyle = { flex: 1 };

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession();

export default function SignInPage() {
  useWarmUpBrowser();
  const { currentUser } = useCurrentUser();
  const { isSignedIn, isLoaded } = useAuth();
  const { signIn, setActive } = useSignIn();
  const { onSocialSignIn } = useSocialAuth();

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
      // First, try Clerk authentication (user must exist in Clerk)
      const completeSignIn = await signIn!.create({
        identifier: emailAddress,
        password,
      });

      if (completeSignIn.status === 'complete') {
        await setActive!({ session: completeSignIn.createdSessionId });
        router.replace('/');
        return;
      } else {
        console.error('Sign in incomplete:', JSON.stringify(completeSignIn, null, 2));
        Alert.alert('Sign In Failed', 'Unable to sign in. Please check your credentials.');
      }
    } catch (err: any) {
      // Handle session already exists - user is already signed in, just redirect
      if (err?.errors?.[0]?.code === 'session_exists') {
        return;
      }

      // If user not found in Clerk (form_identifier_not_found), try database login
      if (err?.errors?.[0]?.code === 'form_identifier_not_found') {
        console.log('User not found in Clerk, trying database login...');
        try {
          const formData = new FormData();
          formData.append('email', emailAddress);
          formData.append('password', password);

          const response = await fetch(`${API_HOST}/mobile/login`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });

          if (response.ok || response.status === 200 || response.redirected) {
            console.log('Database login successful');
            router.replace('/');
            return;
          } else {
            Alert.alert('Sign In Failed', 'Invalid email or password');
            return;
          }
        } catch (dbErr) {
          console.error('Database login error:', dbErr);
          Alert.alert('Sign In Failed', 'Unable to sign in. Please check your credentials.');
          return;
        }
      }

      // Log other errors for debugging
      console.error('Sign in error:', JSON.stringify(err, null, 2));
      Alert.alert('Sign In Error', err?.message || 'An error occurred during sign in');
    }
  };

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
        style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className="flex-1 items-center justify-center bg-white px-6 py-8">
            <View className="mb-8 items-center">
              <Text className="mb-4 text-3xl font-bold text-gray-900">Welcome Back</Text>
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
                  className="mb-0 h-12 items-center justify-center rounded-lg"
                  style={{ backgroundColor: '#EC5F5C' }}>
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
              <SocialAuthButtons onSocialSignIn={onSocialSignIn} />

              {/* Sign-Up Link */}
              <TouchableOpacity onPress={() => router.push('/sign-up')} className="mb-4">
                <Text className="text-center text-base text-gray-700">
                  Don't have an account? <Text className="text-red-600 font-semibold">Sign Up</Text>
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
