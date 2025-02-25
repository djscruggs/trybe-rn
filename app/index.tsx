import { Icon } from '@roninoss/icons';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link, Stack, useRouter } from 'expo-router';
import {
  Platform,
  View,
  SafeAreaView,
  ViewStyle,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';

import { Container } from '~/components/Container';
import { ScreenContent } from '~/components/ScreenContent';
import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';
import { API_HOST } from '~/lib/environment';
import { iconMap } from '~/lib/helpers';
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
  const { colors } = useColorScheme();
  const router = useRouter();

  // Ensure data is an array before mapping
  const challenges = Array.isArray(data?.challenges) ? data.challenges : [];
  return (
    <SafeAreaView style={ROOT_STYLE}>
      <ScrollView className="bg-white">
        <View className="mx-auto w-full flex-1 justify-between px-2 py-4">
          <View className="ios:pt-8 mb-4 pt-12">
            <Text
              variant="largeTitle"
              className="ios:text-left ios:font-black text-center font-bold">
              Welcome to Trybe
            </Text>
          </View>
          <View>
            {isLoading && <Text>Loading...</Text>}
            {error && <Text>Error loading challenges</Text>}
            {challenges?.map((challenge: any) => (
              <TouchableOpacity
                key={challenge.id}
                className="mb-4 flex-row items-center gap-4"
                onPress={() => router.push(`challenges/${challenge.id}/about` as any)}>
                <Image
                  source={iconMap[challenge.icon as keyof typeof iconMap]}
                  style={{
                    width: 60,
                    height: 60,
                    borderWidth: 1,
                    borderColor: challenge.color,
                    borderRadius: 10,
                  }}
                />
                <Text className="flex-1 font-bold">{challenge.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
