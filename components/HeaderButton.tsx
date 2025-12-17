import FontAwesome from '@expo/vector-icons/FontAwesome';
import { forwardRef } from 'react';
import { Pressable, View } from 'react-native';

export const HeaderButton = forwardRef<typeof Pressable, { onPress?: () => void }>(
  ({ onPress }, ref) => {
    return (
      <Pressable onPress={onPress}>
        {({ pressed }) => (
          <View className="mr-[15px]" style={{ opacity: pressed ? 0.5 : 1 }}>
            <FontAwesome name="info-circle" size={25} color="gray" />
          </View>
        )}
      </Pressable>
    );
  }
);
