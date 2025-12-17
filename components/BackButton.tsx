import { Feather } from '@expo/vector-icons';
import { Text, View } from 'react-native';

export const BackButton = ({ onPress }: { onPress: () => void }) => {
  return (
    <View className="flex-row pl-5">
      <Feather name="chevron-left" size={16} color="#007AFF" />
      <Text className="ml-1 text-[#007AFF]" onPress={onPress}>
        Back
      </Text>
    </View>
  );
};
