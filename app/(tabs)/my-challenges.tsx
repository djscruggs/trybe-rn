import { Icon } from '@roninoss/icons';
import { useQuery } from '@tanstack/react-query';
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
import { ChallengeListItem } from '~/components/ChallengeListItem';
import { ScreenContent } from '~/components/ScreenContent';
import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';
import { challengesApi } from '~/lib/api/challengesApi';
import { queryKeys } from '~/lib/api/queryKeys';
import { iconMap } from '~/lib/helpers';
import { useColorScheme } from '~/lib/useColorScheme';
const ROOT_STYLE: ViewStyle = { flex: 1 };

export default function MyChallenges() {
  console.log('🏆 MyChallenges: Component rendering');

  const { data, error, isLoading } = useQuery({
    queryKey: queryKeys.challenges.active(),
    queryFn: challengesApi.getActive,
  });

  const { colors } = useColorScheme();
  const router = useRouter();

  // Ensure data is an array before mapping
  const challenges = Array.isArray(data) ? data : [];
  
  return (
    <SafeAreaView style={ROOT_STYLE}>
      <Stack.Screen options={{ title: 'My Challenges' }} />
      <ScrollView className="bg-white">
        <View className="mx-auto w-full flex-1 justify-between px-2 py-4">
          <View className="ios:pt-8 mb-4 pt-12">
            <Text
              variant="largeTitle"
              className="ios:text-left ios:font-black text-center font-bold">
              My Challenges
            </Text>
          </View>
          <View>
            {isLoading && <Text>Loading...</Text>}
            {error && <Text>Error loading challenges</Text>}
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
    </SafeAreaView>
  );
}
