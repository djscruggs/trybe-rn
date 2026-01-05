import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { View, ViewStyle, ScrollView, Image, TouchableOpacity, Linking } from 'react-native';

import { ChallengeListItem } from '~/components/ChallengeListItem';
import { Text } from '~/components/nativewindui/Text';
import { useAuthSheet } from '~/contexts/auth-sheet-context';
import { useCurrentUser } from '~/contexts/currentuser-context';
import { challengesApi } from '~/lib/api/challengesApi';
import { queryKeys } from '~/lib/api/queryKeys';
import { logger } from '~/lib/logger';
import { ChallengeSummary } from '~/lib/types';
const ROOT_STYLE: ViewStyle = { flex: 1 };

export default function Home() {
  const { getToken } = useCurrentUser();
  const { isSignedIn } = useAuth();
  const { openSignUp } = useAuthSheet();
  const router = useRouter();

  const { data, error, isLoading } = useQuery({
    queryKey: queryKeys.challenges.active(),
    queryFn: async () => {
      try {
        const token = await getToken();
        const result = await challengesApi.getActive(token);
        logger.debug('🎯 Home: API response:', result?.length || 0);
        return result;
      } catch (err: any) {
        logger.error('🎯 Home: Error fetching challenges:', err);
        logger.error('🎯 Home: Error details:', {
          message: err?.message,
          code: err?.code,
          status: err?.response?.status,
        });
        throw err;
      }
    },
    retry: false,
    staleTime: 0,
  });

  // Ensure data is an array before mapping
  const challenges = Array.isArray(data) ? data : [];
  const featuredChallenge = challenges[0]; // Get first challenge as featured

  if (error) {
    logger.error('🎯 Home: Query error:', error);
  }

  const handleAboutPress = () => {
    router.push('/about' as any);
  };

  const handleFeedbackPress = () => {
    Linking.openURL('mailto:feedback@trybe.app?subject=Feedback%20from%20Beta%20User');
  };

  return (
    <View style={ROOT_STYLE} className="bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="bg-white" contentContainerClassName="pb-20">
        {/* Header Section - Matching Splash */}
        <View className="items-center bg-white px-6 pb-8 pt-20">
          <Text className="font-source text-sm uppercase tracking-widest text-red">WELCOME TO</Text>
          <Text className="font-reklame text-7xl text-red" style={{ marginTop: 8 }}>
            Trybe
          </Text>
          <Text className="font-source text-lg text-gray-500" style={{ marginTop: 4 }}>
            (BETA)
          </Text>

          {/* Circular Logo */}
          <Image
            source={require('~/assets/icon.png')}
            className="mt-6 h-24 w-24"
            resizeMode="contain"
          />

          {/* About Us Button */}
          <TouchableOpacity
            onPress={handleAboutPress}
            className="mt-8 rounded-full bg-blue px-10 py-3.5 shadow-md">
            <Text className="font-source text-base font-semibold text-white">About Us</Text>
          </TouchableOpacity>
        </View>

        {/* What's New Section */}
        <View className="mt-8 px-6">
          <Text className="font-source text-xl font-bold text-red">What's New</Text>

          {/* Featured Challenge Card */}
          {featuredChallenge && (
            <View className="mt-5">
              <ChallengeListItem
                challenge={featuredChallenge}
                onPress={() =>
                  isSignedIn
                    ? router.push(`challenges/${featuredChallenge.id}/about` as any)
                    : openSignUp()
                }
              />
            </View>
          )}
        </View>

        {/* How's Your Experience Section */}
        <View className="mt-10 px-6">
          <Text className="font-source text-xl font-bold text-gray-800">
            How's Your Experience?
          </Text>
          <Text className="mt-3 font-source text-sm leading-6 text-gray-700">
            Trybe is in BETA mode so there's plenty of room for improvement. We want to know what to
            fix, what to add, what to delete, what fonts are giving you the ick, what spelling
            mistakes you've noticed and everything in between.
          </Text>
          <TouchableOpacity onPress={handleFeedbackPress} className="mt-4">
            <Text className="font-source text-base font-semibold text-blue underline">
              Leave Us Your Feedback!
            </Text>
          </TouchableOpacity>
        </View>

        {/* Explore Challenges Section */}
        <View className="mt-10 px-6">
          <Text className="font-source text-xl font-bold text-gray-800">Explore Challenges</Text>

          {isLoading && (
            <Text className="mt-5 text-center font-source text-gray-500">Loading...</Text>
          )}

          {!isSignedIn && !isLoading && (
            <View className="mt-6 items-center">
              <TouchableOpacity
                onPress={openSignUp}
                className="rounded-full bg-blue px-10 py-3.5 shadow-md">
                <Text className="font-source text-base font-semibold text-white">
                  Sign Up to Join Challenges
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {isSignedIn && !isLoading && (
            <View className="mt-5 gap-4">
              {challenges?.map((challenge: ChallengeSummary) => (
                <ChallengeListItem
                  key={`${challenge.id}-${challenge.name}`}
                  challenge={challenge}
                  onPress={() => router.push(`challenges/${challenge.id}/about` as any)}
                />
              ))}
            </View>
          )}

          {error && (
            <View className="mt-4 p-4">
              <Text className="text-center font-source text-red">Error loading challenges</Text>
              <Text className="mt-2 text-center font-source text-xs text-gray-500">
                {String(error)}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
