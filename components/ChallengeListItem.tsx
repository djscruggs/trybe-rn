import React from 'react';
import { Image, TouchableOpacity, GestureResponderEvent, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Text } from '~/components/nativewindui/Text';
import { iconMap, calculateDuration } from '~/lib/helpers';
import { ChallengeSummary } from '~/lib/types';

interface ChallengeListItemProps {
  challenge: ChallengeSummary;
  onPress: (event: GestureResponderEvent) => void;
}

export function ChallengeListItem({ challenge, onPress }: ChallengeListItemProps) {
  const router = useRouter();
  const duration = calculateDuration(challenge);
  const displayDuration = typeof duration === 'number' ? `${duration} days` : duration;
  const category = challenge.categories?.[0]?.name;

  const handleCheckIn = (event: GestureResponderEvent) => {
    event.stopPropagation();
    router.push(`/challenges/${challenge.id}/progress` as any);
  };

  return (
    <TouchableOpacity className="mb-4 flex-row items-center gap-4" onPress={onPress}>
      <Image
        source={iconMap[challenge.icon as keyof typeof iconMap]}
        style={{
          width: 60,
          height: 60,
          borderWidth: 1,
          borderColor: challenge.color || 'transparent',
          borderRadius: 10,
        }}
      />
      <View className="flex-1 gap-1">
        <Text variant="heading" numberOfLines={1}>
          {challenge.name}
        </Text>
        <View className="flex-row items-center gap-1">
          <Text variant="caption1" className="text-gray-700">
            {displayDuration}
          </Text>
          {category && (
            <>
              <Text variant="caption1" className="text-gray-700">
                •
              </Text>
              <Text variant="caption1" className="text-gray-700">
                {category}
              </Text>
            </>
          )}
        </View>
      </View>
      {challenge.isMember && (
        <TouchableOpacity
          onPress={handleCheckIn}
          className="rounded-full bg-red px-3 py-1.5"
          hitSlop={10}>
          <Text className="text-xs font-semibold text-white">Check In</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}
