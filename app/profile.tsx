import { Icon } from '@roninoss/icons';
import { useQuery } from '@tanstack/react-query';
import { Link, Stack, useRouter } from 'expo-router';
import {
  Platform,
  View,
  SafeAreaView,
  ViewStyle,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';

import { Container } from '~/components/Container';
import { ScreenContent } from '~/components/ScreenContent';
import { Button } from '~/components/nativewindui/Button';
import { Text } from '~/components/nativewindui/Text';
import { iconMap } from '~/lib/helpers';
import { useColorScheme } from '~/lib/useColorScheme';
const ROOT_STYLE: ViewStyle = { flex: 1 };
async function fetchChallenges() {
  const result = await fetch('http://localhost:3000/api/challenges/active');
  const data = await result.json();
  return data;
}

export default function Profile() {
  return (
    <SafeAreaView style={ROOT_STYLE}>
      <ScrollView className="bg-white">
        <View className="mx-auto w-full flex-1 justify-between px-2 py-4">
          <View className="ios:pt-8 mb-4 pt-12">
            <Text
              variant="largeTitle"
              className="ios:text-left ios:font-black text-center font-bold">
              Profile
            </Text>
          </View>
          <View />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
