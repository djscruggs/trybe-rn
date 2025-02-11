import { View, Text, SafeAreaView, ScrollView, ViewStyle } from 'react-native';
const ROOT_STYLE: ViewStyle = { flex: 1 };

export default function NewChallenge() {
  return (
    <SafeAreaView style={ROOT_STYLE}>
      <ScrollView className="bg-white">
        <View className="mx-auto w-full flex-1 justify-between px-2 py-4">
          <View className="ios:pt-8 mb-4 pt-12">
            <Text className="ios:text-left ios:font-black text-center font-bold">
              New Challenge
            </Text>
          </View>
          <View />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
