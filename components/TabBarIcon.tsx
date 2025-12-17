import FontAwesome from '@expo/vector-icons/FontAwesome';
import AntDesign from '@expo/vector-icons/AntDesign';
import { View } from 'react-native';

/**
 * TabBarIcon component renders an icon for the bottom tab navigation.
 * It supports FontAwesome icons by default and can render AntDesign icons when the `type` prop is set.
 * The `size` prop allows customizing the icon size; defaults to 32.
 */
export const TabBarIcon = (props: {
  name: string; // icon name
  color: string;
  type?: 'fontawesome' | 'antdesign'; // optional icon library, defaults to FontAwesome
  size?: number; // optional size, defaults to 32
}) => {
  const { name, color, type = 'fontawesome', size = 32 } = props;
  const IconComponent = type === 'antdesign' ? AntDesign : FontAwesome;
  return (
    <View className="-mb-[3px]">
      <IconComponent name={name as any} color={color} size={size} />
    </View>
  );
};
