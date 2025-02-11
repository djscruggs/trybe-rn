import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useLocalSearchParams } from 'expo-router';
import { Text, View, ActivityIndicator } from 'react-native';

import { API_HOST } from '~/lib/environment';

export default function ChallengeDetail() {
  const { id } = useLocalSearchParams();
  // Fetch challenge data using TanStack Query
  const { data, error, isLoading } = useQuery({
    queryKey: ['challenge', id],
    queryFn: async () => {
      const url = `${API_HOST}/api/challenges/v/${id}`;
      console.log(url);
      const response = await axios.get(url);
      return response.data;
    },
    staleTime: process.env.NODE_ENV === 'development' ? 0 : 1000 * 60,
  });

  if (isLoading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (error) {
    return <Text className="text-red-500">Error loading challenge details</Text>;
  }

  return (
    <View className="mt-20 p-4">
      <Text className="text-lg">{data?.name}</Text>
      <Text className="text-base">{data?.description}</Text>
      {/* Add more details about the challenge here */}
    </View>
  );
}
