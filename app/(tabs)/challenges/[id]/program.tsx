import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Text, View, ScrollView } from 'react-native';

import ChallengeSchedule from '~/components/challenge-schedule';
import { useMemberContext } from '~/contexts/member-context';
import { API_HOST } from '~/lib/environment';
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
    queryKey: ['challengeProgram', id],
    queryFn: async () => {
      const url = `${API_HOST}/api/challenges/v/${id}/program`;
      const response = await axios.get(url);
      return response.data;
    },
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
