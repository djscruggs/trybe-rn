import { useAuth } from '@clerk/clerk-expo';
import { Feather } from '@expo/vector-icons';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Localization from 'expo-localization';
import { DateTimeFormatOptions } from 'intl';
import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import Share from 'react-native-share';

import ChallengeNotificationModal from '~/components/ChallengeNotificationModal';
import ErrorText from '~/components/ErrorText';
import LinkRenderer from '~/components/LinkRenderer';
import { useCurrentUser } from '~/contexts/currentuser-context';
import { useMemberContext } from '~/contexts/member-context';
import { challengesApi } from '~/lib/api/challengesApi';
import { queryKeys } from '~/lib/api/queryKeys';
import { API_HOST } from '~/lib/environment';
import { calculateDuration } from '~/lib/helpers';
import { getShortUrl } from '~/lib/helpers/challenge';
import { logger } from '~/lib/logger';
import { useNotificationPermissions } from '~/lib/useNotificationPermissions';

export default function ChallengeAbout() {
  const { getToken, currentUser } = useCurrentUser();
  const { userId } = useAuth();
  const { membership, challenge } = useMemberContext();
  const queryClient = useQueryClient();
  const { notificationsEnabled, requestNotificationPermissions, showNotificationSettingsAlert } =
    useNotificationPermissions();

  const handleCopy = () => {
    const url = getShortUrl(challenge, membership);
    Share.open({
      url,
    });
  };
  const [joining, setJoining] = useState(false);
  const isMember = Boolean(membership);
  const [error, setError] = useState('');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const today = new Date();
  today.setDate(today.getDate() + 1);
  const [startDate, setStartDate] = useState(today);
  const [showTimePicker, setShowTimePicker] = useState(Platform.OS === 'ios');
  const [pickerMode, setPickerMode] = useState<'time' | 'date'>('time');

  const handleJoinOrLeaveChallenge = () => {
    logger.debug('[ChallengeAbout] handleJoinOrLeaveChallenge called');
    logger.debug('[ChallengeAbout] isMember:', isMember);
    logger.debug('[ChallengeAbout] userId:', userId);
    logger.debug('[ChallengeAbout] currentUser:', currentUser?.id);

    // Check if user is authenticated before allowing join
    if ((!userId || !currentUser) && !isMember) {
      logger.debug('[ChallengeAbout] User not authenticated, showing sign-in alert');
      Alert.alert('Sign In Required', 'Please sign in to join this challenge', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign In',
          onPress: () => {
            // Navigate to sign-in page using expo-router
            const router = require('expo-router').router;
            router.push('/sign-in');
          },
        },
      ]);
      return;
    }

    if (isMember) {
      logger.debug('[ChallengeAbout] User is member, showing leave confirmation');
      // Show confirmation dialog for leaving the challenge
      Alert.alert(
        'Leave Challenge',
        'Are you sure you want to leave this challenge? All your check-ins will be lost.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Leave', style: 'destructive', onPress: handleJoinOrLeaveChallenge },
        ]
      );
    } else {
      logger.debug('[ChallengeAbout] User is not member, showing time picker modal');
      // Show time picker modal for joining the challenge
      setShowTimeModal(true);
    }
  };

  // Mutation for leaving a challenge
  const leaveChallengeMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.id || !challenge?.id) {
        throw new Error('User not authenticated');
      }
      const token = await getToken();
      if (!token) {
        throw new Error('Failed to get auth token');
      }
      return challengesApi.joinOrLeave(challenge.id.toString(), {}, token);
    },
    onSuccess: () => {
      // Invalidate membership query to refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.challenges.membership(challenge?.id?.toString() || ''),
      });
      setError('');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to leave challenge';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    },
  });

  // Mutation for joining a challenge
  const joinChallengeMutation = useMutation({
    mutationFn: async (data: {
      userId: string;
      notificationHour: number;
      notificationMinute: number;
      startAt?: string;
    }) => {
      if (!currentUser?.id || !challenge?.id) {
        throw new Error('User not authenticated');
      }
      const token = await getToken();
      if (!token) {
        throw new Error('Failed to get auth token');
      }
      return challengesApi.joinOrLeave(challenge.id.toString(), data, token);
    },
    onSuccess: () => {
      // Invalidate membership query to refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.challenges.membership(challenge?.id?.toString() || ''),
      });
      setError('');
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to join challenge';
      const responseData = error.response?.data;
      const isHtml = typeof responseData === 'string' && responseData.trim().startsWith('<!');
      if (isHtml) {
        errorMessage =
          'Authentication failed. The server may not recognize your session. For localhost development, you may need to forward Clerk webhooks using: npx @clerk/clerk-sdk-node localhost';
      } else if (error.message === 'Network Error') {
        errorMessage = `Network Error: Unable to reach server at ${API_HOST}. Please check your connection and ensure the server is running.`;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        errorMessage = 'Authentication failed. Please sign in again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    },
  });

  const handleNotificationConfirm = async (notificationTime: Date, startDate: Date) => {
    logger.debug('[ChallengeAbout] handleNotificationConfirm called');
    logger.debug('[ChallengeAbout] notificationsEnabled:', notificationsEnabled);
    setShowTimeModal(false);

    if (!userId || !currentUser?.id) {
      logger.debug('[ChallengeAbout] User not authenticated');
      setError('User not authenticated. Please sign in again.');
      return;
    }

    const notificationHour = notificationTime.getHours();
    const notificationMinute = notificationTime.getMinutes();

    // Handle notification permissions
    if (!notificationsEnabled) {
      logger.debug('[ChallengeAbout] Notifications not enabled, requesting permissions...');
      const granted = await requestNotificationPermissions();
      logger.debug('[ChallengeAbout] Permission request result:', granted);
    } else {
      logger.debug('[ChallengeAbout] Notifications already enabled, skipping permission request');
    }

    const requestData: {
      userId: string;
      notificationHour: number;
      notificationMinute: number;
      startAt?: string;
    } = {
      userId,
      notificationHour,
      notificationMinute,
    };

    // Add start date - use user-selected date for SELF_LED, challenge start date for GROUP_LED
    if (challenge?.type === 'SELF_LED') {
      requestData.startAt = startDate.toISOString();
    } else if (challenge?.startAt) {
      // For GROUP_LED challenges, use the challenge's start date
      requestData.startAt = new Date(challenge.startAt).toISOString();
    }

    setJoining(true);
    joinChallengeMutation.mutate(requestData, {
      onSettled: () => {
        setJoining(false);
      },
    });
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    if (selectedTime) {
      if (pickerMode === 'time') {
        setStartDate(selectedTime);
      } else {
        setStartDate(selectedTime);
      }
    }
  };

  const showTimeDatePicker = (mode: 'time' | 'date') => {
    setPickerMode(mode);
    if (Platform.OS === 'android') {
      setShowTimePicker(true);
    }
  };

  const dateOptions: DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };
  const locale = Localization.getLocales()[0]?.languageTag;
  return (
    <View className="bg-white p-2">
      {error && <ErrorText>{error}</ErrorText>}
      <LinkRenderer text={challenge?.description ?? ''} />
      {/* Program Details */}
      <View className="mb-6 mt-8">
        <View className="mb-4 flex-row justify-between">
          <View className="flex-1">
            <Text className="mb-1 text-sm text-gray-500">Frequency</Text>
            <Text className="text-base text-black">
              {challenge?.frequency
                ? challenge.frequency.charAt(0).toUpperCase() +
                  challenge.frequency.slice(1).toLowerCase()
                : ''}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-sm text-gray-500">Duration</Text>
            <Text className="text-base text-black">{calculateDuration(challenge)}</Text>
          </View>
        </View>
        {membership && (
          <View className="flex-row justify-between">
            <View className="flex-1">
              <Text className="mb-1 text-sm text-gray-500">Starts</Text>
              <View className="flex-row items-center">
                <Text className="text-base text-black">
                  {challenge?.type === 'SELF_LED' && membership.startAt
                    ? new Date(membership.startAt).toLocaleDateString(locale, dateOptions)
                    : challenge?.startAt
                      ? new Date(challenge.startAt).toLocaleDateString(locale, dateOptions)
                      : ''}
                </Text>
              </View>
            </View>
            <View className="flex-1">
              <Text className="mb-1 text-sm text-gray-500">Reminder Time</Text>
              <View className="flex-row items-center">
                <Text className="text-base text-black">
                  {new Intl.DateTimeFormat(locale, {
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true,
                  }).format(
                    new Date(
                      0,
                      0,
                      0,
                      membership?.notificationHour ?? 0,
                      membership?.notificationMinute ?? 0
                    )
                  )}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Notification Reminder - Show conditionally */}
        {Platform.OS !== 'web' &&
          !notificationsEnabled &&
          (isMember ||
            (challenge?.userId === currentUser?.id && challenge?.status !== 'DRAFT')) && (
            <View className="bg-blue-50 mb-4 rounded-lg p-4">
              <View className="mb-2 flex-row items-center">
                <Feather name="bell" size={20} color="#3b82f6" />
                <Text className="text-blue-900 ml-2 font-semibold">Enable Notifications</Text>
              </View>
              <Text className="text-blue-800 mb-3 text-sm">
                Get daily reminders for this challenge. Enable notifications in your device settings
                to stay on track.
              </Text>
              <TouchableOpacity
                onPress={showNotificationSettingsAlert}
                className="bg-blue-600 rounded-md px-4 py-2">
                <Text className="text-center text-sm font-semibold text-white">Open Settings</Text>
              </TouchableOpacity>
            </View>
          )}

        <View className="relative min-h-20  w-full flex-col items-center justify-center">
          <TouchableOpacity
            className="rounded-full bg-red p-2 font-bold"
            onPress={handleJoinOrLeaveChallenge}>
            <Text className="text-xs text-white">
              {isMember ? 'Leave Challenge' : 'Join this Challenge'}
            </Text>
          </TouchableOpacity>
          {joining && (
            <View className="absolute bottom-0 flex items-center justify-center">
              <ActivityIndicator size="small" color="gray" />
            </View>
          )}
        </View>
      </View>

      {/* Invite Link Section */}
      <View className="mb-6">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={handleCopy} className="p-2">
            <Feather name="share" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Using the reusable notification modal */}
      <ChallengeNotificationModal
        visible={showTimeModal}
        onClose={() => setShowTimeModal(false)}
        onConfirm={handleNotificationConfirm}
        isSelfLed={challenge?.type === 'SELF_LED'}
        membership={membership ?? undefined}
      />
    </View>
  );
}
