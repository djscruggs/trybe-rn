import { useSignUp, useSSO } from '@clerk/clerk-expo';
import { SocialIcon, SocialIconProps } from '@rneui/themed';
import * as AuthSession from 'expo-auth-session';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect } from 'react';
import { View, Button, TextInput } from 'react-native';

import { useCurrentUser } from '~/contexts/currentuser-context';
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
  const { isLoaded, signUp, setActive } = useSignUp();
  const { startSSOFlow } = useSSO();
  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState('');

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

  // Handle OAuth Sign Up
  const onSocialSignIn = useCallback(
    async (strategy: 'oauth_google' | 'oauth_linkedin' | 'oauth_slack') => {
      try {
        const { createdSessionId, setActive: setSSOActive } = await startSSOFlow({
          strategy,
          redirectUrl: AuthSession.makeRedirectUri(),
        });

        if (createdSessionId) {
          setSSOActive!({ session: createdSessionId });
          router.push('/');
        }
      } catch (err) {
        console.error(JSON.stringify(err, null, 2));
      }
    },
    [startSSOFlow]
  );

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
              onPress={() => onSocialSignIn('oauth_linkedin')}
            />
            <SocialIcon
              type="slack"
              iconType="font-awesome"
              button
              title="Sign up with Slack"
              onPress={() => onSocialSignIn('oauth_slack')}
            />
          </View>
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
