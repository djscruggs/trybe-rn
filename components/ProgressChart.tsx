import { differenceInDays, format } from 'date-fns';
import { useMemo } from 'react';
import { View } from 'react-native';

import CircularProgress from '~/components/CircularProgress';
import { Text } from '~/components/nativewindui/Text';
import type { Challenge, CheckIn } from '~/lib/types';

export function ProgressChart({
  challenge,
  checkIns,
}: {
  challenge: Challenge;
  checkIns: CheckIn[];
}): JSX.Element {
  const numDays = useMemo(
    () =>
      challenge.type === 'SELF_LED'
        ? (challenge.numDays ?? 0)
        : challenge?.endAt && challenge.startAt
          ? differenceInDays(new Date(challenge.endAt), new Date(challenge.startAt)) + 1
          : (challenge.numDays ?? 0),
    [challenge.type, challenge.numDays, challenge.endAt, challenge.startAt]
  );

  const uniqueDays = useMemo(() => {
    const typedCheckIns = (checkIns || []) as { createdAt: string | Date }[];
    if (typedCheckIns.length === 0) return 0;

    return new Set(
      typedCheckIns
        .filter((checkIn) => checkIn?.createdAt)
        .map((checkIn) => {
          try {
            return format(new Date(checkIn.createdAt), 'yyyy-MM-dd');
          } catch {
            return '';
          }
        })
        .filter((date) => date !== '')
    ).size;
  }, [checkIns]);

  const progress = useMemo(
    () => (numDays > 0 ? Math.min((uniqueDays / numDays) * 100, 100) : 0),
    [numDays, uniqueDays]
  );

  const totalCheckIns = checkIns.length;

  return (
    <View className="items-center justify-center" key={`chart-${totalCheckIns}-${uniqueDays}`}>
      <CircularProgress
        progress={progress}
        size={200}
        strokeWidth={12}
        showLabel={false}
        outerCircleColor="#E5E7EB"
        progressCircleColor="#EF4444">
        <View className="items-center justify-center">
          <Text className="text-4xl font-bold text-gray-900">{totalCheckIns}</Text>
          <Text className="mt-1 text-base text-gray-600">check-ins</Text>
          <Text className="mt-2 text-sm text-gray-500">{numDays} days</Text>
        </View>
      </CircularProgress>
    </View>
  );
}
