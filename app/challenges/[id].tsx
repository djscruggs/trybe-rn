import Feather from '@expo/vector-icons/Feather';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import {
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Image,
  Clipboard,
} from 'react-native';

import { MemberContextProvider, useMemberContext } from '~/contexts/member-context';
import { API_HOST } from '~/lib/environment';
import { iconMap, calculateDuration } from '~/lib/helpers';
import { getShortUrl } from '~/lib/helpers/challenge';
import { Challenge } from '~/lib/types';
export default function ChallengeDetail() {
  const { membership, setMembership } = useMemberContext();
  const { id } = useLocalSearchParams();
  // Fetch challenge data using TanStack Query
  const {
    data: challenge,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['challenge', id],
    queryFn: async () => {
      const url = `${API_HOST}/api/challenges/v/${id}`;
      const response = await axios.get(url);
      return response.data;
    },
    staleTime: process.env.NODE_ENV === 'development' ? 0 : 1000 * 60,
  });
  // fetch member challenge data using TanStack Query

  if (isLoading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (error) {
    return <Text className="text-red-500">Error loading challenge details</Text>;
  }

  return (
    <MemberContextProvider membership={membership ?? null} setMembership={setMembership}>
      <View className="mt-20 p-4">
        <ChallengeDetailView challenge={challenge} />
      </View>
    </MemberContextProvider>
  );
}

const ChallengeDetailView = ({ challenge }: { challenge: Challenge }) => {
  const { membership } = useMemberContext();
  const handleCopy = () => {
    alert(getShortUrl(challenge, membership));
  };
  return (
    <View className="bg-white p-4">
      {/* Header Section */}
      <View className="mb-5">
        <View className="mb-4 flex-row items-center">
          <View className="mr-2">
            {/* Replace with your actual icon component */}
            <Image
              source={iconMap[challenge.icon as keyof typeof iconMap]}
              style={{
                width: 40,
                height: 40,
                borderWidth: 1,
                borderColor: challenge.color,
                borderRadius: 20,
              }}
            />
          </View>
          <Text className="text-xl font-bold">{challenge.name}</Text>
        </View>
        <ChallengeDetailNavigation challenge={challenge} />
      </View>

      {/* Description Section */}
      <Text className="mb-6 text-base leading-6 text-gray-700">{challenge.description}</Text>

      {/* Program Details */}
      <View className="mb-6">
        <View className="mb-4 flex-row justify-between">
          <View className="flex-1">
            <Text className="mb-1 text-sm text-gray-500">Frequency</Text>
            <Text className="text-base text-black">
              {challenge.frequency.charAt(0).toUpperCase() +
                challenge.frequency.slice(1).toLowerCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-sm text-gray-500">Duration</Text>
            <Text className="text-base text-black">{calculateDuration(challenge)}</Text>
          </View>
        </View>

        <View className="flex-row justify-between">
          <View className="flex-1">
            <Text className="mb-1 text-sm text-gray-500">Started</Text>
            <View className="flex-row items-center">
              <Text className="text-base text-black">{challenge.startAt}</Text>
              <TouchableOpacity>
                <Text className="ml-2 text-sm text-red-400">edit</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-sm text-gray-500">Reminder Time</Text>
            <View className="flex-row items-center">
              <Text className="text-base text-black">{challenge.reminderTime}</Text>
              <TouchableOpacity>
                <Text className="ml-2 text-sm text-red-400">edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Invite Link Section */}
      <View className="mb-6">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={handleCopy} className="p-2">
            <Feather name="share" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Leave Challenge Button */}
      <TouchableOpacity className="items-center rounded bg-red-400 p-3">
        <Text className="text-base text-white">Leave Challenge</Text>
      </TouchableOpacity>
    </View>
  );
};

const ChallengeDetailNavigation = ({ challenge }) => {
  return (
    <View className="mb-4 flex-row items-center justify-between">
      <Text className="border-b-2 border-black text-black">About</Text>
      <Text className="text-gray-500">Program</Text>
      <Text className="text-gray-500">Progress</Text>
      <Text className="text-gray-500">Chat</Text>
      <TouchableOpacity className="bg-red rounded-full p-1">
        <Text className="text-xs text-white">Check In</Text>
      </TouchableOpacity>
    </View>
  );
};
