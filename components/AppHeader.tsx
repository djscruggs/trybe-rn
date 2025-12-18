import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UserAvatar from '~/components/UserAvatar';

export function AppHeader() {
  const { user } = useUser();
  const insets = useSafeAreaInsets();

  const handleProfilePress = () => {
    router.push('/profile');
  };

  const handleNotificationsPress = () => {
    // TODO: Navigate to notifications screen or show notifications modal
    console.log('Notifications pressed');
  };

  return (
    <View className="flex-row items-center justify-end px-4 pb-2 bg-white border-b border-gray-200" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row items-center gap-3">
        <TouchableOpacity onPress={handleNotificationsPress} className="p-1">
          <Ionicons name="notifications-outline" size={24} color="#000" />
        </TouchableOpacity>
        {user && (
          <TouchableOpacity onPress={handleProfilePress} className="p-0">
            <UserAvatar
              size={32}
              name={user?.fullName || user?.firstName || 'U'}
              src={user?.imageUrl}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
