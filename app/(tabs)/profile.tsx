import { useAuth } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { View, SafeAreaView, ViewStyle, ScrollView, ActivityIndicator } from 'react-native';
import UserAvatar from 'react-native-user-avatar';

import { SignOutButton } from '~/components/SignOutButton';
import { Text } from '~/components/nativewindui/Text';
import { useCurrentUser } from '~/contexts/currentuser-context';

const ROOT_STYLE: ViewStyle = { flex: 1 };

export default function Profile() {
  const { currentUser, setCurrentUser } = useCurrentUser();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    // Redirect to sign-up if user is not authenticated
    if (isLoaded && !isSignedIn) {
      router.push('/(tabs)/sign-up');
    }
  }, [isLoaded, isSignedIn]);

  const afterSignOut = () => {
    console.log('afterSignOut');
    setCurrentUser(null);
    router.push('/');
  };

  // Show loading while checking auth state
  if (!isLoaded) {
    return (
      <SafeAreaView style={ROOT_STYLE}>
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator size="large" color="red" />
        </View>
      </SafeAreaView>
    );
  }

  // If not signed in, don't show spinner (redirect will handle it)
  if (!isSignedIn || !currentUser) {
    return null;
  }

  return (
    <SafeAreaView style={ROOT_STYLE}>
      <ScrollView className="bg-white">
        <View className="mx-auto w-full flex-1 justify-between px-2 py-4">
          <View className="h-10 w-10">
            <UserAvatar
              size={60}
              name={currentUser?.profile.fullName}
              src={currentUser?.profile.profileImage ?? undefined}
            />
          </View>
          <Text className="ios:text-left ios:font-black text-center font-bold">
            Profile - {currentUser?.profile.fullName}
          </Text>
          <View />
          <View className="flex-row justify-center">
            <SignOutButton afterSignOut={afterSignOut} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
