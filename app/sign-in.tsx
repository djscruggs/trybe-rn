import { useAuth, useSignIn } from '@clerk/clerk-expo';
import { SocialIcon } from '@rneui/themed';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { View, Button, TextInput, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';

import { Text } from '~/components/nativewindui/Text';
import { useCurrentUser } from '~/contexts/currentuser-context';
import { useSocialAuth } from '~/lib/useSocialAuth';
import { useWarmUpBrowser } from '~/lib/useWarmUpBrowser';

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession();

export default function SignInPage() {
  useWarmUpBrowser();
  const { currentUser } = useCurrentUser();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { onSocialSignIn } = useSocialAuth();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');

  // Redirect if already signed in
  useEffect(() => {
    if (authLoaded && isSignedIn && currentUser) {
      router.replace('/');
    }
  }, [authLoaded, isSignedIn, currentUser]);

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
        router.push('/');
      } else {
        console.error(JSON.stringify(completeSignIn, null, 2));
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  // Show loading while checking auth state or if already signed in
  if (!authLoaded || isSignedIn) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator size="large" color="red" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-white px-5">
      <View className="mb-8 items-center">
        <Text className="mb-4 text-3xl font-bold text-gray-900">
          Welcome Back
        </Text>
        <Text className="text-center text-base text-gray-600">
          Sign in to continue your journey with Trybe
        </Text>
      </View>

      <View className="mb-8 w-full">
        <TextInput
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Email..."
          onChangeText={(email) => setEmailAddress(email)}
          className="mb-4 h-12 rounded-lg border border-gray-300 px-4"
        />
        <TextInput
          value={password}
          placeholder="Password..."
          placeholderTextColor="#000"
          secureTextEntry={true}
          onChangeText={(password) => setPassword(password)}
          className="mb-4 h-12 rounded-lg border border-gray-300 px-4"
        />
        <Button title="Sign In" onPress={onSignInPress} />
      </View>

      <View className="w-full gap-4">
        <SocialIcon
          type="google"
          iconType="font-awesome"
          button
          title="Sign in with Google"
          onPress={() => onSocialSignIn('oauth_google')}
        />
        <SocialIcon
          type="linkedin"
          iconType="font-awesome"
          button
          title="Sign in with LinkedIn"
          onPress={() => onSocialSignIn('oauth_linkedin_oidc')}
        />
        <SocialIcon
          type="slack"
          iconType="font-awesome"
          style={{ backgroundColor: '#4A154B' }}
          button
          title="Sign in with Slack"
          onPress={() => onSocialSignIn('oauth_slack')}
        />
      </View>

      <TouchableOpacity
        onPress={() => router.push('/sign-up')}
        className="mt-6"
      >
        <Text className="text-center text-base text-gray-700">
          Don't have an account?{' '}
          <Text className="font-semibold text-red-600">Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
