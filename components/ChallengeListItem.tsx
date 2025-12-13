import React from 'react';
import { Image, TouchableOpacity, GestureResponderEvent, View, Share } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Text } from '~/components/nativewindui/Text';
import { iconMap, calculateDuration } from '~/lib/helpers';
import { Challenge } from '~/lib/types';

interface ChallengeListItemProps {
  challenge: Challenge;
  onPress: (event: GestureResponderEvent) => void;
}

export function ChallengeListItem({ challenge, onPress }: ChallengeListItemProps) {
  const duration = calculateDuration(challenge);
  const displayDuration = typeof duration === 'number' ? `${duration} days` : duration;
  const category = challenge.categories?.[0]?.name;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this challenge: ${challenge.name}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
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
          <Text variant="caption1" color="secondary">
            {displayDuration}
          </Text>
          {category && (
            <>
              <Text variant="caption1" color="secondary">
                •
              </Text>
              <Text variant="caption1" color="secondary">
                {category}
              </Text>
            </>
          )}
        </View>
      </View>
      <TouchableOpacity onPress={handleShare} hitSlop={10}>
        <Feather name="share" size={20} color="gray" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
