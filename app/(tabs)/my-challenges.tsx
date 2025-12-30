import { useQuery } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { View, ViewStyle, ScrollView } from 'react-native';

import { ChallengeListItem } from '~/components/ChallengeListItem';
import { Text } from '~/components/nativewindui/Text';
import { challengesApi } from '~/lib/api/challengesApi';
import { queryKeys } from '~/lib/api/queryKeys';
import { useCurrentUser } from '~/contexts/currentuser-context';
const ROOT_STYLE: ViewStyle = { flex: 1 };

export default function MyChallenges() {
  console.log('🏆 MyChallenges: Component rendering');

  const { getToken, currentUser } = useCurrentUser();

  const { data, error, isLoading } = useQuery({
    queryKey: queryKeys.challenges.active(),
    queryFn: async () => {
      const token = await getToken();
      return challengesApi.getActive(token);
    },
  });

  const router = useRouter();

  // Ensure data is an array before mapping
  const challenges = Array.isArray(data) ? data : [];
  
  return (
    <View style={ROOT_STYLE} className="bg-white">
      <Stack.Screen options={{ title: 'My Challenges' }} />
      <ScrollView className="bg-white" contentContainerClassName="pb-20">
        <View className="mx-auto w-full flex-1 justify-between px-6 py-4">
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
    </View>
  );
}
