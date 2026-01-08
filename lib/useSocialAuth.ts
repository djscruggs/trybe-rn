import { useSSO } from '@clerk/clerk-expo';
import * as AuthSession from 'expo-auth-session';
import { router } from 'expo-router';
import { useCallback } from 'react';

type SocialAuthStrategy = 'oauth_google' | 'oauth_linkedin_oidc' | 'oauth_slack';

export const useSocialAuth = () => {
  const { startSSOFlow } = useSSO();

  const onSocialSignIn = useCallback(
    async (strategy: SocialAuthStrategy) => {
      try {
        const { createdSessionId, setActive: setSSOActive } = await startSSOFlow({
          strategy,
          redirectUrl: AuthSession.makeRedirectUri(),
        });

        if (createdSessionId) {
          setSSOActive!({ session: createdSessionId });
          router.replace('/');
        }
      } catch (err: any) {
        // Handle session already exists error
        if (err?.errors?.[0]?.code === 'session_exists') {
          router.replace('/');
          return;
        }
        console.error('OAuth error:', JSON.stringify(err, null, 2));
      }
    },
    [startSSOFlow]
  );

  return { onSocialSignIn };
};
