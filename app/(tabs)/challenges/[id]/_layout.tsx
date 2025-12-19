import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, Slot, Link, usePathname } from 'expo-router';
import React, { useRef } from 'react';
import { Text, View, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

import { CheckInModal } from '~/components/CheckInModal';
import { useCurrentUser } from '~/contexts/currentuser-context';
import { MemberContextProvider, useMemberContext } from '~/contexts/member-context';
import { challengesApi } from '~/lib/api/challengesApi';
import { queryKeys } from '~/lib/api/queryKeys';
import { iconMap } from '~/lib/helpers';
import { Challenge, MemberChallenge } from '~/lib/types';

export default function ChallengeLayout() {
  const { id } = useLocalSearchParams();
  const { currentUser } = useCurrentUser();

  // Fetch challenge data using TanStack Query
  const {
    data: challenge,
    error,
    isLoading,
  } = useQuery({
    queryKey: queryKeys.challenges.detail(id as string),
    queryFn: () => challengesApi.get(id as string),
    staleTime: process.env.NODE_ENV === 'development' ? 0 : 1000 * 60,
  });

  // Fetch membership data using TanStack Query
  const {
    data: membership,
    isLoading: isLoadingMembership,
  } = useQuery({
    queryKey: queryKeys.challenges.membership(id as string),
    queryFn: () => {
      if (!currentUser?.id) return null;
      return challengesApi.getMembership(id as string, currentUser.id);
    },
    enabled: !!challenge && !!currentUser?.id,
    staleTime: process.env.NODE_ENV === 'development' ? 0 : 1000 * 60,
  });
  if (error) return <Text className="text-red-500">Error loading challenge details</Text>;

  return (
    <MemberContextProvider
      membership={membership ?? null}
      setMembership={() => {}} // No-op, updates handled via query invalidation
      challenge={challenge}>
      {isLoading || error ? (
        <View className="flex-1 items-center justify-center">
          {isLoading && <ActivityIndicator size="large" color="black" />}
          {error && <Text className="text-red-500">Error loading challenge details</Text>}
        </View>
      ) : (
        <View className="pl-2 pr-2 pt-2">
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
            <ChallengeDetailNavigation challenge={challenge} />
          </View>
          <Slot />
        </View>
      )}
    </MemberContextProvider>
  );
}

const ChallengeDetailNavigation = ({ challenge }: { challenge: Challenge }) => {
  const path = usePathname();
  const isCurrentRoute = (part: string) => path.includes(part);
  return (
    <View className="mb-4 flex-row items-center justify-between px-2">
      <Link
        href={`/challenges/${challenge.id}/about`}
        className={`${isCurrentRoute(`/about`) ? 'font-bold text-red' : 'text-gray-500'}`}>
        About
      </Link>
      <Link
        href={`/challenges/${challenge.id}/program`}
        className={`${isCurrentRoute(`/program`) ? 'font-bold text-red' : 'text-gray-500'}`}>
        Program
      </Link>
      <Link
        href={`/challenges/${challenge.id}/progress`}
        className={`${isCurrentRoute(`/progress`) ? 'font-bold text-red' : 'text-gray-500'}`}>
        Progress
      </Link>
      <Link
        href={`/challenges/${challenge.id}/chat`}
        className={`mr-4 ${isCurrentRoute(`/chat`) ? 'font-bold text-red' : 'text-gray-500'}`}>
        Chat
      </Link>
      <CheckInButton />
    </View>
  );
};

const CheckInButton = () => {
  const { membership, challenge } = useMemberContext();
  const checkInModalRef = useRef<BottomSheetModal>(null);

  if (!membership || !challenge) return null;

  const handleCheckInComplete = () => {
    // Optionally refresh data or update state
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => checkInModalRef.current?.present()}
        className="rounded-full bg-red p-1 px-2">
        <Text className="text-xs font-bold text-white">Check In</Text>
      </TouchableOpacity>
      <CheckInModal ref={checkInModalRef} onCheckInComplete={handleCheckInComplete} />
    </>
  );
};
