import { Text, View } from 'react-native';

export default function EditScreenInfo({ path }: { path: string }) {
  const title = 'Open up the code for this screen:';
  const description =
    'Change any of the text, save the file, and your app will automatically update.';

  return (
    <View className="items-center mx-12">
      <Text className="text-[17px] leading-6 text-center">{title}</Text>
      <View className="rounded-sm px-1 my-2">
        <Text>{path}</Text>
      </View>
      <Text className="text-[17px] leading-6 text-center">{description}</Text>
    </View>
  );
}
