import { useAuth, useSignUp } from '@clerk/clerk-expo';
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
} from 'react-native';

import { SocialAuthButtons } from '~/components/SocialAuthButtons';
import { Text } from '~/components/nativewindui/Text';
import { useCurrentUser } from '~/contexts/currentuser-context';
import { useSocialAuth } from '~/lib/useSocialAuth';
import { useWarmUpBrowser } from '~/lib/useWarmUpBrowser';

const ROOT_STYLE: ViewStyle = { flex: 1 };

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession();

export default function SignUpPage() {
  useWarmUpBrowser();
  const { currentUser } = useCurrentUser();
  const { isSignedIn, isLoaded } = useAuth();
  const { signUp, setActive } = useSignUp();
  const { onSocialSignIn } = useSocialAuth();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Redirect to home if already signed in
  useEffect(() => {
    console.log('🔐 Sign-up page auth state:', {
      isLoaded,
      isSignedIn,
      hasCurrentUser: !!currentUser,
      shouldRedirect: isLoaded && isSignedIn && currentUser,
    });

    if (isLoaded && isSignedIn && currentUser) {
      console.log('✅ User is fully authenticated, redirecting to home');
      router.replace('/');
    }
  }, [isLoaded, isSignedIn, currentUser]);

  // Validate password requirements
  const validatePassword = (pwd: string): string => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (pwd.length > 64) {
      return 'Password must not exceed 64 characters';
    }
    return '';
  };

  // Handle Email/Password Sign Up
  const onSignUpPress = async () => {
    if (!isLoaded) return;

    // Clear previous errors
    setPasswordError('');

    // Validate password
    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      await signUp!.create({
        emailAddress,
        password,
      });

      await signUp!.prepareEmailAddressVerification({ strategy: 'email_code' });

      setPendingVerification(true);
    } catch (err: any) {
      console.error('Sign up error:', JSON.stringify(err, null, 2));
      // Handle Clerk-specific errors
      if (err?.errors?.[0]?.message) {
        setPasswordError(err.errors[0].message);
      }
    }
  };

  // Handle Email Verification
  const onPressVerify = async () => {
    if (!isLoaded) return;

    try {
      const completeSignUp = await signUp!.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        await setActive!({ session: completeSignUp.createdSessionId });
        router.replace('/');
      } else {
        console.error('Verification incomplete:', JSON.stringify(completeSignUp, null, 2));
      }
    } catch (err: any) {
      console.error('Verification error:', JSON.stringify(err, null, 2));
    }
  };

  // Show loading while checking auth state or if already signed in
  if (!isLoaded || isSignedIn) {
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
              <Text className="mb-4 text-3xl font-bold text-gray-900">
                {pendingVerification ? 'Verify Your Email' : 'Welcome to Trybe'}
              </Text>
              <Text className="text-center text-base text-gray-600">
                {pendingVerification
                  ? 'Enter the verification code sent to your email'
                  : 'Sign up to join challenges, track your progress, and connect with the community'}
              </Text>
            </View>

            <View className="w-full max-w-sm">
              {!pendingVerification ? (
                <>
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
                      placeholder="Password (min 8 characters)"
                      secureTextEntry
                      onChangeText={(text) => {
                        setPassword(text);
                        setPasswordError('');
                      }}
                      className="mb-3 h-12 rounded-lg border border-gray-300 px-4"
                      autoComplete="password-new"
                    />
                    <TextInput
                      value={confirmPassword}
                      placeholder="Confirm Password"
                      secureTextEntry
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        setPasswordError('');
                      }}
                      className="mb-2 h-12 rounded-lg border border-gray-300 px-4"
                      autoComplete="password-new"
                    />
                    {passwordError ? (
                      <Text className="mb-3 text-sm text-red-600">{passwordError}</Text>
                    ) : null}
                    <TouchableOpacity
                      onPress={onSignUpPress}
                      className="mb-0 h-12 items-center justify-center rounded-lg"
                      style={{ backgroundColor: '#EC5F5C' }}>
                      <Text className="font-semibold text-white">Sign Up with Email</Text>
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

                  {/* Sign-In Link */}
                  <TouchableOpacity onPress={() => router.push('/sign-in')} className="mb-4">
                    <Text className="text-center text-base text-gray-700">
                      Already have an account?{' '}
                      <Text className="text-red-600 font-semibold">Sign In</Text>
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                // Verification Code Form
                <View>
                  <TextInput
                    value={code}
                    placeholder="Verification Code"
                    onChangeText={setCode}
                    className="mb-4 h-12 rounded-lg border border-gray-300 px-4"
                    keyboardType="number-pad"
                  />
                  <TouchableOpacity
                    onPress={onPressVerify}
                    className="h-12 items-center justify-center rounded-lg"
                    style={{ backgroundColor: '#EC5F5C' }}>
                    <Text className="font-semibold text-white">Verify Email</Text>
                  </TouchableOpacity>
                </View>
              )}
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
