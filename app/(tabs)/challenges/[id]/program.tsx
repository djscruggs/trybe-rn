import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Text, View, ScrollView } from 'react-native';

import ChallengeSchedule from '~/components/ChallengeSchedule';
import { useMemberContext } from '~/contexts/member-context';
import { challengesApi } from '~/lib/api/challengesApi';
import { queryKeys } from '~/lib/api/queryKeys';
import { Challenge } from '~/lib/types';

export default function ChallengeProgram(): JSX.Element {
  const { id } = useLocalSearchParams();
  const { challenge } = useMemberContext();
  // Fetch program data for the challenge
  const {
    data,
    error: programError,
    isLoading: isProgramLoading,
  } = useQuery({
    queryKey: queryKeys.challenges.program(id as string),
    queryFn: () => challengesApi.getProgram(id as string),
    staleTime: process.env.NODE_ENV === 'development' ? 0 : 1000 * 60,
  });

  if (isProgramLoading) {
    return <ActivityIndicator size="small" color="#C4C4C4" />;
  }

  if (programError) {
    return <Text className="text-red-500">Error loading program details</Text>;
  }
  return (
    <ScrollView className="mb-5 rounded-md bg-white p-2">
      <View className="mb-4 flex-row">
        <ChallengeSchedule
          challenge={challenge as Challenge}
          posts={data.posts ?? []}
          membership={null}
        />
      </View>
      {/* Render program details here */}
      {/* <Text>{JSON.stringify(program)}</Text> */}
    </ScrollView>
  );
}
