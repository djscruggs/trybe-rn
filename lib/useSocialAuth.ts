import { useOAuth, useAuth } from '@clerk/clerk-expo';
import * as AuthSession from 'expo-auth-session';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';

type SocialAuthStrategy = 'oauth_google' | 'oauth_linkedin_oidc' | 'oauth_slack';

export const useSocialAuth = () => {
  const { signOut } = useAuth();
  const googleOAuth = useOAuth({ strategy: 'oauth_google' });
  const linkedinOAuth = useOAuth({ strategy: 'oauth_linkedin_oidc' });
  const slackOAuth = useOAuth({ strategy: 'oauth_slack' });

  const onSocialSignIn = useCallback(
    async (strategy: SocialAuthStrategy) => {
      console.log('useSocialAuth - onSocialSignIn called with strategy:', strategy);

      try {
        // Select the appropriate OAuth instance
        let oauth;
        switch (strategy) {
          case 'oauth_google':
            oauth = googleOAuth;
            break;
          case 'oauth_linkedin_oidc':
            oauth = linkedinOAuth;
            break;
          case 'oauth_slack':
            oauth = slackOAuth;
            break;
          default:
            throw new Error(`Unsupported strategy: ${strategy}`);
        }

        console.log('Starting OAuth flow for:', strategy);

        const { createdSessionId, setActive } = await oauth.startOAuthFlow({
          redirectUrl: AuthSession.makeRedirectUri(),
        });

        console.log('OAuth flow completed. createdSessionId:', createdSessionId);

        if (createdSessionId) {
          await setActive!({ session: createdSessionId });
          console.log('Session activated, redirecting to home');
          router.replace('/');
        } else {
          console.log('No session created - user may have cancelled');
        }
      } catch (err: any) {
        console.error('OAuth error:', JSON.stringify(err, null, 2));
        console.error('Error details:', {
          code: err?.errors?.[0]?.code,
          message: err?.errors?.[0]?.message,
          longMessage: err?.errors?.[0]?.longMessage,
        });

        // Handle stale session
        if (err?.errors?.[0]?.code === 'session_exists') {
          console.log('Stale session detected - offering to sign out and retry');
          Alert.alert(
            'Session Issue',
            'There is a stale session preventing sign-in. Would you like to sign out and try again?',
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Sign Out & Retry',
                onPress: async () => {
                  try {
                    console.log('Signing out stale session...');
                    await signOut();
                    console.log('Stale session cleared, please try signing in again');
                    Alert.alert('Success', 'Session cleared. Please try signing in again.');
                  } catch (signOutErr) {
                    console.error('Failed to sign out:', signOutErr);
                    Alert.alert('Error', 'Failed to clear session. Please restart the app.');
                  }
                },
              },
            ]
          );
          return;
        }

        // Show user-friendly error for other cases
        Alert.alert(
          'Sign In Failed',
          err?.errors?.[0]?.message || 'Unable to sign in. Please try again.'
        );
      }
    },
    [googleOAuth, linkedinOAuth, slackOAuth, signOut]
  );

  return { onSocialSignIn };
};
