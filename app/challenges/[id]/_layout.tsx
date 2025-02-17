import Feather from '@expo/vector-icons/Feather';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import * as Localization from 'expo-localization';
import { useLocalSearchParams, Slot, Link, router } from 'expo-router';
import { DateTimeFormatOptions } from 'intl';
import React from 'react';
import {
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ScrollView,
  Button,
} from 'react-native';
import Share from 'react-native-share';

import ChallengeSchedule from '~/components/challenge-schedule';
import { MemberContextProvider, useMemberContext } from '~/contexts/member-context';
import { API_HOST } from '~/lib/environment';
import { iconMap, calculateDuration, textToJSX } from '~/lib/helpers';
import { getShortUrl } from '~/lib/helpers/challenge';
import { Challenge, MemberChallenge } from '~/lib/types';

export default function ChallengeLayout() {
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

  if (isLoading) return <ActivityIndicator size="small" color="#C4C4C4" />;
  if (error) return <Text className="text-red-500">Error loading challenge details</Text>;

  return (
    <MemberContextProvider
      membership={membership ?? null}
      setMembership={setMembership}
      challenge={challenge}>
      {isLoading || error ? (
        <View className="flex-1 items-center justify-center">
          {isLoading && <ActivityIndicator size="small" color="#C4C4C4" />}
          {error && <Text className="text-red-500">Error loading challenge details</Text>}
        </View>
      ) : (
        <View className="mt-20 p-2">
          <View className="mr-2 flex-row items-center ">
            <Image
              source={iconMap[challenge.icon as keyof typeof iconMap]}
              className={`h-10 w-10 rounded-full border border-solid ${
                challenge.color ? `border-${challenge.color}` : ''
              }`}
            />
            <Text className="ml-2 break-words text-lg font-bold">{challenge.name}</Text>
          </View>
          <View className="mt-4">
            <View className="mb-4 flex-row items-center justify-between">
              <Link
                href={`/challenges/${challenge.id}/about`}
                className="border-b-2 border-black text-black">
                About
              </Link>
              <Link href={`/challenges/${challenge.id}/program`} className="text-gray-500">
                Program
              </Link>
              <Link href={`/challenges/${challenge.id}/progress`} className="text-gray-500">
                Progress
              </Link>
              <Link href={`/challenges/${challenge.id}/chat`} className="text-gray-500">
                Chat
              </Link>
              <TouchableOpacity className="rounded-full bg-red p-1">
                <Text className="text-xs text-white">Check In</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Slot />
        </View>
      )}
    </MemberContextProvider>
  );
}

const ChallengeDetailNavigation = ({ challenge }: { challenge: Challenge }) => {
  return (
    <View className="mb-4 flex-row items-center justify-between">
      <Link
        href={`/challenges/${challenge.id}/about`}
        className="border-b-2 border-black text-black">
        About
      </Link>
      <Link href={`/challenges/${challenge.id}/program`} className="text-gray-500">
        Program
      </Link>
      <Link href={`/challenges/${challenge.id}/progress`} className="text-gray-500">
        Progress
      </Link>
      <Link href={`/challenges/${challenge.id}/chat`} className="text-gray-500">
        Chat
      </Link>
      <TouchableOpacity className="rounded-full bg-red p-1">
        <Text className="text-xs text-white">Check In</Text>
      </TouchableOpacity>
    </View>
  );
};
