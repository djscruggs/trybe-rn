import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { View, ScrollView, ActivityIndicator } from 'react-native';

import { ProgressChart } from '~/components/ProgressChart';
import { Text } from '~/components/nativewindui/Text';
import { useCurrentUser } from '~/contexts/currentuser-context';
import { useMemberContext } from '~/contexts/member-context';
import { challengesApi } from '~/lib/api/challengesApi';
import { queryKeys } from '~/lib/api/queryKeys';
import type { CheckIn } from '~/lib/types';

export default function ChallengeProgress() {
  const { challenge, membership } = useMemberContext();
  const { currentUser, getToken } = useCurrentUser();

  console.log('Progress: challenge', challenge?.id);
  console.log('Progress: membership', membership?.id);
  console.log('Progress: currentUser', currentUser?.id);

  const userId = membership?.userId ?? currentUser?.id;
  const challengeId = challenge?.id?.toString();
  const cohortId = membership?.cohortId;

  const {
    data: checkIns = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.challenges.checkIns(challengeId || '', userId?.toString() || ''),
    queryFn: async () => {
      if (!challengeId || !userId) return [];
      const token = await getToken();
      return challengesApi.getCheckIns(
        challengeId,
        userId.toString(),
        token,
        cohortId ?? undefined
      );
    },
    enabled: !!challengeId && !!userId,
  });

  console.log('Progress: checkIns', checkIns.length, 'isLoading', isLoading, 'error', error);

  if (!challenge) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text>Loading challenge...</Text>
        <ActivityIndicator size="large" color="#EF4444" />
      </View>
    );
  }

  const formatCheckInDate = (date: Date | string): string => {
    try {
      return format(new Date(date), 'MMM d, yyyy h:mm a');
    } catch {
      return '';
    }
  };

  const sortedCheckIns = [...checkIns].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });

  return (
    <ScrollView className="mb-5 rounded-md bg-white p-2">
      <View className="items-center py-8">
        <Text className="mb-4 text-lg font-bold text-gray-900">Progress</Text>
        <ProgressChart challenge={challenge} checkIns={checkIns} />
      </View>

      <View className="px-4 pb-8">
        <Text className="mb-4 text-xl font-bold text-gray-900">Check-ins</Text>
        {isLoading ? (
          <View className="py-8">
            <ActivityIndicator size="small" color="#EF4444" />
          </View>
        ) : sortedCheckIns.length === 0 ? (
          <View className="py-8">
            <Text className="text-center text-gray-500">No check-ins yet</Text>
          </View>
        ) : (
          <View className="rounded-lg border border-gray-200 bg-white">
            <View className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <View className="flex-row">
                <View className="flex-1">
                  <Text className="text-xs font-semibold uppercase text-gray-600">Date</Text>
                </View>
                <View className="flex-2">
                  <Text className="text-xs font-semibold uppercase text-gray-600">Note</Text>
                </View>
              </View>
            </View>
            {sortedCheckIns.map((checkIn: CheckIn, index: number) => (
              <View
                key={checkIn.id}
                className={`border-b border-gray-100 px-4 py-3 ${index === sortedCheckIns.length - 1 ? 'border-b-0' : ''}`}>
                <View className="flex-row">
                  <View className="flex-1">
                    <Text className="text-sm text-gray-900">
                      {formatCheckInDate(checkIn.createdAt)}
                    </Text>
                  </View>
                  <View className="flex-2">
                    <Text className="text-sm text-gray-700" numberOfLines={2}>
                      {checkIn.body || '—'}
                    </Text>
                    {(checkIn.imageMeta || checkIn.videoMeta) && (
                      <Text className="mt-1 text-xs text-gray-500">📷 Media</Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
