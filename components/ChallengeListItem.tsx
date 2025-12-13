import React from 'react';
import { Image, TouchableOpacity, GestureResponderEvent } from 'react-native';

import { Text } from '~/components/nativewindui/Text';
import { iconMap } from '~/lib/helpers';

interface Challenge {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface ChallengeListItemProps {
  challenge: Challenge;
  onPress: (event: GestureResponderEvent) => void;
}

export function ChallengeListItem({ challenge, onPress }: ChallengeListItemProps) {
  return (
    <TouchableOpacity className="mb-4 flex-row items-center gap-4" onPress={onPress}>
      <Image
        source={iconMap[challenge.icon as keyof typeof iconMap]}
        style={{
          width: 60,
          height: 60,
          borderWidth: 1,
          borderColor: challenge.color,
          borderRadius: 10,
        }}
      />
      <Text className="flex-1 font-bold">{challenge.name}</Text>
    </TouchableOpacity>
  );
}
