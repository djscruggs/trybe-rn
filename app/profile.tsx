import { SignOutButton } from '~/components/SignOutButton';
import { useEffect, useState } from 'react';
import { View, SafeAreaView, ViewStyle, ScrollView, Button   } from 'react-native';
import UserAvatar from 'react-native-user-avatar';
import { Text } from '~/components/nativewindui/Text';
import { useCurrentUser } from '~/contexts/currentuser-context';
import { router } from 'expo-router';
const ROOT_STYLE: ViewStyle = { flex: 1 };

export default function Profile() {
  const { currentUser, setCurrentUser } = useCurrentUser();
  const afterSignOut = () => {
    console.log('afterSignOut');
    setCurrentUser(null);
    router.push('/');
    
  }
  console.log('currentUser in profile', currentUser);
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
            <Text
              className="ios:text-left ios:font-black text-center font-bold">
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
