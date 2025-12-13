import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { TouchableOpacity } from 'react-native';

export default function ChallengesLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
