import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UserAvatar from 'react-native-user-avatar';

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
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.rightSection}>
        <TouchableOpacity onPress={handleNotificationsPress} style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={24} color="#000" />
        </TouchableOpacity>
        {user && (
          <TouchableOpacity onPress={handleProfilePress} style={styles.avatarButton}>
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  avatarButton: {
    padding: 0,
  },
});
