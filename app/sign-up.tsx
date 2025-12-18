import { useSignUp } from '@clerk/clerk-expo';
import { SocialIcon, SocialIconProps } from '@rneui/themed';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { View, Button, TextInput, TouchableOpacity } from 'react-native';

import { Text } from '~/components/nativewindui/Text';
import { useCurrentUser } from '~/contexts/currentuser-context';
import { useSocialAuth } from '~/lib/useSocialAuth';
import { useWarmUpBrowser } from '~/lib/useWarmUpBrowser';

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession();

export default function SignUpPage() {
  useWarmUpBrowser();
  const { currentUser } = useCurrentUser();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { onSocialSignIn } = useSocialAuth();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  if (currentUser) {
    router.push('/');
  }

  // Handle Email/Password Sign Up
  const onSignUpPress = async () => {
    if (!isLoaded) return;

    try {
      await signUp.create({
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      setPendingVerification(true);
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  // Handle Email Verification
  const onPressVerify = async () => {
    if (!isLoaded) return;

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        router.push('/');
      } else {
        console.error(JSON.stringify(completeSignUp, null, 2));
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-white px-5">
      {!pendingVerification ? (
        <>
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
            <Button title="Sign Up" onPress={onSignUpPress} />
          </View>

          <View className="w-full gap-4">
            <SocialIcon
              type="google"
              iconType="font-awesome"
              button
              title="Sign up with Google"
              onPress={() => onSocialSignIn('oauth_google')}
            />
            <SocialIcon
              type="linkedin"
              iconType="font-awesome"
              button
              title="Sign up with LinkedIn"
              onPress={() => onSocialSignIn('oauth_linkedin_oidc')}
            />
            <SocialIcon
              type="slack"
              iconType="font-awesome"
              style={{ backgroundColor: '#4A154B' }}
              button
              title="Sign up with Slack"
              onPress={() => onSocialSignIn('oauth_slack')}
            />
          </View>

          <TouchableOpacity
            onPress={() => router.push('/sign-in')}
            className="mt-6"
          >
            <Text className="text-center text-base text-gray-700">
              Already have an account?{' '}
              <Text className="font-semibold text-red-600">Sign In</Text>
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <View className="w-full">
          <TextInput
            value={code}
            placeholder="Verification Code..."
            onChangeText={(code) => setCode(code)}
            className="mb-4 h-12 rounded-lg border border-gray-300 px-4"
          />
          <Button title="Verify Email" onPress={onPressVerify} />
        </View>
      )}
    </View>
  );
}
