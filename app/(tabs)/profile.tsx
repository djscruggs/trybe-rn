import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View,
  SafeAreaView,
  ViewStyle,
  ScrollView,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import UserAvatar from '~/components/UserAvatar';

import { SignOutButton } from '~/components/SignOutButton';
import { Text } from '~/components/nativewindui/Text';
import { useCurrentUser } from '~/contexts/currentuser-context';

const ROOT_STYLE: ViewStyle = { flex: 1 };

export default function Profile() {
  const { currentUser, setCurrentUser } = useCurrentUser();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/sign-in');
    }
  }, [isLoaded, isSignedIn]);

  // Initialize form fields when user data loads
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
    }
  }, [user]);

  const afterSignOut = () => {
    console.log('afterSignOut');
    setCurrentUser(null);
    router.push('/');
  };

  const handleSaveProfile = async () => {
    try {
      await user?.update({
        firstName,
        lastName,
      });
      setIsEditingProfile(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleCancelEdit = () => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setIsEditingProfile(false);
  };

  const handleAvatarUpload = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access photo library is required!');
        return;
      }

      // Launch image picker with base64 encoding
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8, // Optimize quality for faster upload
        base64: true, // Get base64 representation
      });

      if (!result.canceled && result.assets[0].base64 && user) {
        const base64 = result.assets[0].base64;
        const mimeType = result.assets[0].mimeType || 'image/jpeg';

        // Format for Clerk: data:mimeType;base64,base64String
        const image = `data:${mimeType};base64,${base64}`;

        await user.setProfileImage({ file: image });
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      const errorMessage =
        error?.errors?.[0]?.message || error?.message || 'Failed to upload profile image';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleAvatarRemove = async () => {
    try {
      if (user) {
        await user.setProfileImage({ file: null });
        Alert.alert('Success', 'Profile image removed successfully');
      }
    } catch (error) {
      console.error('Error removing avatar:', error);
      Alert.alert('Error', 'Failed to remove profile image');
    }
  };

  // Show loading while checking auth state or waiting for user to load
  if (!isLoaded || (isSignedIn && !user)) {
    return (
      <SafeAreaView style={ROOT_STYLE}>
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator size="large" color="red" />
        </View>
      </SafeAreaView>
    );
  }

  // If not signed in, the useEffect will redirect to sign-in, show loading meanwhile
  if (!isSignedIn) {
    return (
      <SafeAreaView style={ROOT_STYLE}>
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator size="large" color="red" />
        </View>
      </SafeAreaView>
    );
  }

  const primaryEmail = user?.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId
  );
  // const externalAccounts = user?.externalAccounts || [];

  return (
    <SafeAreaView style={ROOT_STYLE}>
      <ScrollView className="bg-gray-50">
        <View className="w-full px-4 py-20">
          {/* Page Header */}

          {/* Profile Section */}
          <View className="mb-6">
            <View className="rounded-lg bg-white p-4 shadow-sm">
              {!isEditingProfile ? (
                <>
                  {/* View Mode */}
                  <View className="flex-row items-center gap-4">
                    <UserAvatar size={60} name={user?.fullName || ''} src={user?.imageUrl} />
                    <View className="flex-1">
                      <Text className="text-base font-medium text-gray-900">
                        {user?.fullName || 'No name set'}
                        <View className="flex-row items-center gap-2">
                          <Text className="text-base text-gray-900">
                            {primaryEmail?.emailAddress}
                          </Text>
                        </View>
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => setIsEditingProfile(true)}
                      className="rounded px-3 py-1.5">
                      <Text className="text-red-600 text-sm font-medium">Edit</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  {/* Edit Mode */}
                  <Text className="mb-4 text-lg font-semibold text-gray-900">Update profile</Text>

                  {/* Avatar Section */}
                  <View className="mb-4 flex-row items-center gap-4">
                    <UserAvatar size={60} name={user?.fullName || ''} src={user?.imageUrl} />
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={handleAvatarUpload}
                        className="border-red-500 rounded border px-3 py-1.5">
                        <Text className="text-red-600 text-sm font-medium">Upload</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text className="mb-4 text-xs text-gray-500">
                    Recommended size 1:1, up to 10MB.
                  </Text>

                  {/* Name Fields */}
                  <View className="mb-4 flex-row gap-3">
                    <View className="flex-1">
                      <Text className="mb-2 text-sm font-medium text-gray-700">First name</Text>
                      <TextInput
                        value={firstName}
                        onChangeText={setFirstName}
                        className="h-10 rounded border border-gray-300 bg-white px-3 text-base"
                        placeholder="First name"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="mb-2 text-sm font-medium text-gray-700">Last name</Text>
                      <TextInput
                        value={lastName}
                        onChangeText={setLastName}
                        className="h-10 rounded border border-gray-300 bg-white px-3 text-base"
                        placeholder="Last name"
                      />
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row justify-end gap-2">
                    <TouchableOpacity onPress={handleCancelEdit} className="rounded px-4 py-2">
                      <Text className="text-red-600 text-sm font-medium">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSaveProfile}
                      className="rounded bg-red px-4 py-2">
                      <Text className="text-sm font-medium text-white">Save</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Email Addresses Section */}
          {/* <View className="mb-6">
            <Text className="mb-3 text-sm font-medium text-gray-700">Email address</Text>

            <View className="rounded-lg bg-white p-4 shadow-sm">
              <View className="mb-3 flex-row items-center justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-base text-gray-900">{primaryEmail?.emailAddress}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View> */}

          {/* Connected Accounts Section - Hidden for now */}
          {/* <View className="mb-6">
            <Text className="mb-3 text-sm font-medium text-gray-700">Connected accounts</Text>

            <View className="rounded-lg bg-white shadow-sm">
              {externalAccounts.map((account, index) => {
                const providerName = String(account.provider);
                const isGoogle = providerName.includes('google');
                const isLinkedIn = providerName.includes('linkedin');
                const isSlack = providerName.includes('slack');

                return (
                  <View
                    key={account.id}
                    className={`flex-row items-center justify-between p-4 ${
                      index < externalAccounts.length - 1 ? 'border-b border-gray-200' : ''
                    }`}>
                    <View className="flex-row items-center gap-3">
                      <View className="h-5 w-5 items-center justify-center">
                        {isGoogle && <Ionicons name="logo-google" size={20} color="#DB4437" />}
                        {isLinkedIn && <Ionicons name="logo-linkedin" size={20} color="#0077B5" />}
                        {isSlack && <Ionicons name="logo-slack" size={20} color="#4A154B" />}
                      </View>
                      <View>
                        <Text className="text-base font-medium text-gray-900">
                          {isGoogle && 'Google'}
                          {isLinkedIn && 'LinkedIn'}
                          {isSlack && 'Slack'}
                        </Text>
                        <Text className="text-sm text-gray-500">
                          {account.emailAddress || account.username}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity>
                      <Ionicons name="ellipsis-horizontal" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View> */}

          {/* Sign Out Button */}
          <View className="mt-8 items-center">
            <SignOutButton afterSignOut={afterSignOut} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
