import { View, Text } from 'react-native';

export default function About() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-lg font-semibold">About</Text>
      <Text className="mt-2 text-gray-600">App information</Text>
    </View>
  );
}
