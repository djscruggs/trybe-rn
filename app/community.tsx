import { View, Text, SafeAreaView } from 'react-native';
import { useColorScheme } from '~/lib/useColorScheme';

export default function CommunityScreen() {
  const { colors } = useColorScheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text, fontSize: 24 }}>Community</Text>
        <Text style={{ color: colors.text, marginTop: 8 }}>
          Placeholder screen for community features.
        </Text>
      </View>
    </SafeAreaView>
  );
}
