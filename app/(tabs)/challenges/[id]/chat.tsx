import { useFocusEffect, useNavigation } from 'expo-router';
import React, { useCallback } from 'react';
import { View, Text } from 'react-native';

export default function ChallengeChat() {
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      // Hide the tab bar when this screen is focused
      const parent = navigation.getParent();
      parent?.setOptions({ tabBarStyle: { display: 'none' } });

      return () => {
        // Restore the tab bar when leaving this screen
        parent?.setOptions({ tabBarStyle: undefined });
      };
    }, [navigation])
  );

  return (
    <View>
      <Text>Challenge Chat</Text>
    </View>
  );
}
