import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useLocalSearchParams } from 'expo-router';
import { Text, View, ActivityIndicator } from 'react-native';

import { API_HOST } from '~/lib/environment';

export default function ChallengeDetail() {
  const { id } = useLocalSearchParams();

  // Fetch challenge data using TanStack Query
  const { data, error, isLoading } = useQuery(['challenge', id], async () => {
    const response = await axios.get(`${API_HOST}/api/challenges/v/${id}`);
    return response.data;
  });

  if (isLoading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (error) {
    return <Text className="text-red-500">Error loading challenge details</Text>;
  }

  return (
    <View className="mt-20 p-4">
      <Text className="text-xl font-bold">Challenge Details for ID: {id}</Text>
      <Text className="text-lg">{data?.name}</Text>
      <Text className="text-base">{data?.description}</Text>
      {/* Add more details about the challenge here */}
    </View>
  );
}
