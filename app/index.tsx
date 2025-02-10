import { Icon } from '@roninoss/icons';
import { useQuery } from '@tanstack/react-query';
import { Link, Stack } from 'expo-router';
import { Platform, View, SafeAreaView, ViewStyle, ScrollView } from 'react-native';

import { Container } from '~/components/Container';
import { ScreenContent } from '~/components/ScreenContent';
import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';
import { useColorScheme } from '~/lib/useColorScheme';

const ROOT_STYLE: ViewStyle = { flex: 1 };
async function fetchChallenges() {
  console.log('fetching challenges');
  const result = await fetch('http://localhost:3000/api/challenges/active');
  const data = await result.json();
  return data;
}

export default function Home() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: fetchChallenges,
  });
  const { colors } = useColorScheme();
  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error loading challenges</Text>;

  // Ensure data is an array before mapping
  const challenges = Array.isArray(data.challenges) ? data.challenges : [];
  console.log('challenges', challenges);
  return (
    <SafeAreaView style={ROOT_STYLE}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="mx-auto w-full flex-1 justify-between gap-4 border border-red-500 px-2 py-4">
          <View className="ios:pt-8 pt-12">
            <Text
              variant="largeTitle"
              className="ios:text-left ios:font-black text-center font-bold">
              Welcome to
            </Text>
            <Text
              variant="largeTitle"
              className="ios:text-left ios:font-black text-center font-bold text-primary">
              Trybe
            </Text>
          </View>
          <View className="gap-8">
            {challenges.map((challenge: any) => (
              <View key={challenge.id} className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="font-bold">{challenge.name}</Text>
                  <Text variant="footnote">{challenge.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
