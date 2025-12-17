import { Text, View } from 'react-native';

type ScreenContentProps = {
  title: string;
  path: string;
  children?: React.ReactNode;
};

export const ScreenContent = ({ title, children }: ScreenContentProps) => {
  return (
    <View className="items-center flex-1 justify-center">
      <Text className="text-xl font-bold">{title}</Text>
      <View className="bg-gray-300 h-px my-8 w-4/5" />
      {children}
    </View>
  );
};
