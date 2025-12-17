import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Stack, useRouter } from 'expo-router';
import { View, SafeAreaView, ViewStyle, ScrollView, Image, TouchableOpacity } from 'react-native';

import { ChallengeListItem } from '~/components/ChallengeListItem';
import { Text } from '~/components/nativewindui/Text';
import { API_HOST } from '~/lib/environment';
import { useColorScheme } from '~/lib/useColorScheme';
const ROOT_STYLE: ViewStyle = { flex: 1 };
async function fetchChallenges() {
  const result = await axios.get(`${API_HOST}/api/challenges/active`);
  return result.data;
}

export default function Home() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: fetchChallenges,
  });

  const router = useRouter();

  // Ensure data is an array before mapping
  const challenges = Array.isArray(data?.challenges) ? data.challenges : [];
  console.log('🎯 Home: Challenges count:', challenges.length);

  return (
    <View style={ROOT_STYLE} className="bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="bg-background" contentContainerClassName="pb-12">
        {/* Splash-like Header Section */}
        <View className="items-center justify-center bg-red pb-12 pt-20">
          <View className="mb-6 h-32 w-32 items-center rounded-full shadow-lg">
            {/* Find a way to display a logo here if possible, for now just a placeholder or the icon */}
            <Image
              source={require('~/assets/icon.png')}
              className="h-32 w-32"
              resizeMode="contain"
            />
          </View>
          <Text className="font-reklame text-5xl text-white">Trybe</Text>
          <Text className="mt-2 font-source text-lg text-white opacity-90">
            Find your people. Join the challenge.
          </Text>
        </View>

        {/* Content Section */}
        <View className="-mt-6 flex-1 rounded-t-3xl bg-background px-6 pt-8">
          <Text className="mb-6 font-reklame text-3xl text-teal">Active Challenges</Text>
          {isLoading && <Text className="text-center font-source text-gray-500">Loading...</Text>}
          {error && (
            <Text className="text-red-500 text-center font-source">Error loading challenges</Text>
          )}

          <View className="gap-4">
            {challenges?.map((challenge: any) => (
              <ChallengeListItem
                key={`${challenge.id}-${challenge.name}`}
                challenge={challenge}
                onPress={() => router.push(`challenges/${challenge.id}/about` as any)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
