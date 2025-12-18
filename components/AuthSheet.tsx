import { useAuth, useSignUp, useSignIn, useSSO } from '@clerk/clerk-expo';
import * as AuthSession from 'expo-auth-session';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useState, useMemo, forwardRef } from 'react';
import { View, ActivityIndicator, TouchableOpacity } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

import { SocialAuthButtons } from '~/components/SocialAuthButtons';
import { Text } from '~/components/nativewindui/Text';
import { useCurrentUser } from '~/contexts/currentuser-context';
import { useAuthSheet } from '~/contexts/auth-sheet-context';

export const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession();

export const AuthSheet = forwardRef<BottomSheetModal>((props, ref) => {
  useWarmUpBrowser();
  const { currentUser } = useCurrentUser();
  const { isSignedIn, isLoaded } = useAuth();
  const { signUp, setActive: setActiveSignUp } = useSignUp();
  const { signIn, setActive: setActiveSignIn } = useSignIn();
  const { startSSOFlow } = useSSO();
  const { mode, switchToSignUp, switchToSignIn, closeSheet } = useAuthSheet();

  // Sign-up state
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Sign-in state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Snap points - adjust based on mode
  const snapPoints = useMemo(() => {
    if (mode === 'sign-up' && !pendingVerification) {
      return ['75%'];
    }
    return ['65%'];
  }, [mode, pendingVerification]);

  // Backdrop component
  const renderBackdrop = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
  );

  // Close sheet and redirect if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn && currentUser) {
      closeSheet();
      setTimeout(() => {
        router.replace('/');
      }, 300);
    }
  }, [isLoaded, isSignedIn, currentUser, closeSheet]);

  // Reset form when sheet is dismissed or mode changes
  const handleDismiss = () => {
    // Reset sign-up state
    setSignUpEmail('');
    setSignUpPassword('');
    setConfirmPassword('');
    setPendingVerification(false);
    setVerificationCode('');
    setPasswordError('');
    // Reset sign-in state
    setSignInEmail('');
    setSignInPassword('');
  };

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

    setPasswordError('');

    const passwordValidationError = validatePassword(signUpPassword);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }

    if (signUpPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      await signUp!.create({
        emailAddress: signUpEmail,
        password: signUpPassword,
      });

      await signUp!.prepareEmailAddressVerification({ strategy: 'email_code' });

      setPendingVerification(true);
    } catch (err: any) {
      console.error('Sign up error:', JSON.stringify(err, null, 2));
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
        code: verificationCode,
      });

      if (completeSignUp.status === 'complete') {
        await setActiveSignUp!({ session: completeSignUp.createdSessionId });
        closeSheet();
        setTimeout(() => {
          router.replace('/');
        }, 300);
      } else {
        console.error('Verification incomplete:', JSON.stringify(completeSignUp, null, 2));
      }
    } catch (err: any) {
      console.error('Verification error:', JSON.stringify(err, null, 2));
    }
  };

  // Handle Email/Password Sign In
  const onSignInPress = async () => {
    if (!isLoaded) return;

    try {
      const completeSignIn = await signIn!.create({
        identifier: signInEmail,
        password: signInPassword,
      });

      if (completeSignIn.status === 'complete') {
        await setActiveSignIn!({ session: completeSignIn.createdSessionId });
        closeSheet();
        setTimeout(() => {
          router.replace('/');
        }, 300);
      } else {
        console.error('Sign in incomplete:', JSON.stringify(completeSignIn, null, 2));
      }
    } catch (err: any) {
      // Handle session already exists - user is already signed in, just redirect
      if (err?.errors?.[0]?.code === 'session_exists') {
        console.log('Session already exists, redirecting to home');
        closeSheet();
        setTimeout(() => {
          router.replace('/');
        }, 300);
        return;
      }
      // Log other errors for debugging
      console.error('Sign in error:', JSON.stringify(err, null, 2));
    }
  };

  // Handle OAuth Sign In/Up
  const onSocialSignIn = useCallback(
    async (strategy: 'oauth_google' | 'oauth_linkedin_oidc' | 'oauth_slack') => {
      try {
        const { createdSessionId, setActive: setSSOActive } = await startSSOFlow({
          strategy,
          redirectUrl: AuthSession.makeRedirectUri(),
        });

        if (createdSessionId) {
          setSSOActive!({ session: createdSessionId });
          closeSheet();
          setTimeout(() => {
            router.replace('/');
          }, 300);
        } else {
          console.log('Additional steps required for authentication');
        }
      } catch (err: any) {
        if (err?.errors?.[0]?.code === 'session_exists') {
          console.log('Session already exists, redirecting to home');
          closeSheet();
          setTimeout(() => {
            router.replace('/');
          }, 300);
          return;
        }
        console.error('OAuth error:', JSON.stringify(err, null, 2));
      }
    },
    [startSSOFlow, closeSheet]
  );

  // Show loading if not loaded yet
  if (!isLoaded) {
    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        onDismiss={handleDismiss}>
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator size="large" color="red" />
        </View>
      </BottomSheetModal>
    );
  }

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      onDismiss={handleDismiss}>
      <BottomSheetScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        <View className="flex-1 items-center justify-center bg-white px-6 py-8">
          {/* Header */}
          <View className="mb-8 items-center">
            <Text className="mb-4 text-3xl font-bold text-gray-900">
              {mode === 'sign-up'
                ? pendingVerification
                  ? 'Verify Your Email'
                  : 'Welcome to Trybe'
                : 'Welcome Back'}
            </Text>
            <Text className="text-center text-base text-gray-600">
              {mode === 'sign-up'
                ? pendingVerification
                  ? 'Enter the verification code sent to your email'
                  : 'Sign up to join challenges, track your progress, and connect with the community'
                : 'Sign in to continue your journey with Trybe'}
            </Text>
          </View>

          <View className="w-full max-w-sm">
            {mode === 'sign-up' ? (
              !pendingVerification ? (
                <>
                  {/* Sign-Up Form */}
                  <View className="mb-6">
                    <BottomSheetTextInput
                      autoCapitalize="none"
                      value={signUpEmail}
                      placeholder="Email"
                      onChangeText={setSignUpEmail}
                      className="mb-3 h-12 rounded-lg border border-gray-300 px-4"
                      keyboardType="email-address"
                      autoComplete="email"
                    />
                    <BottomSheetTextInput
                      value={signUpPassword}
                      placeholder="Password (min 8 characters)"
                      secureTextEntry
                      onChangeText={(text) => {
                        setSignUpPassword(text);
                        setPasswordError('');
                      }}
                      className="mb-3 h-12 rounded-lg border border-gray-300 px-4"
                      autoComplete="password-new"
                    />
                    <BottomSheetTextInput
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

                  {/* Switch to Sign-In Link */}
                  <TouchableOpacity onPress={switchToSignIn} className="mb-4">
                    <Text className="text-center text-base text-gray-700">
                      Already have an account?{' '}
                      <Text className="font-semibold text-red-600">Sign In</Text>
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                // Verification Code Form
                <View>
                  <BottomSheetTextInput
                    value={verificationCode}
                    placeholder="Verification Code"
                    onChangeText={setVerificationCode}
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
              )
            ) : (
              <>
                {/* Sign-In Form */}
                <View className="mb-6">
                  <BottomSheetTextInput
                    autoCapitalize="none"
                    value={signInEmail}
                    placeholder="Email"
                    onChangeText={setSignInEmail}
                    className="mb-3 h-12 rounded-lg border border-gray-300 px-4"
                    keyboardType="email-address"
                    autoComplete="email"
                  />
                  <BottomSheetTextInput
                    value={signInPassword}
                    placeholder="Password"
                    secureTextEntry
                    onChangeText={setSignInPassword}
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

                {/* Switch to Sign-Up Link */}
                <TouchableOpacity onPress={switchToSignUp} className="mb-4">
                  <Text className="text-center text-base text-gray-700">
                    Don't have an account?{' '}
                    <Text className="font-semibold text-red-600">Sign Up</Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View className="mt-8">
            <Text className="text-center text-sm text-gray-500">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

AuthSheet.displayName = 'AuthSheet';
