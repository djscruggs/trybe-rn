import { useAuth } from '@clerk/clerk-expo';
import { Feather } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import * as Notifications from 'expo-notifications';
import { DateTimeFormatOptions } from 'intl';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  Linking,
  AppState,
} from 'react-native';
import Share from 'react-native-share';

import ChallengeNotificationModal from '~/components/challenge-notification-modal';
import ErrorText from '~/components/error-text';
import LinkRenderer from '~/components/link-renderer';
import { useCurrentUser } from '~/contexts/currentuser-context';
import { useMemberContext } from '~/contexts/member-context';
import { API_HOST } from '~/lib/environment';
import { textToJSX, calculateDuration } from '~/lib/helpers';
import { getShortUrl } from '~/lib/helpers/challenge';

export default function ChallengeAbout() {
  const { getToken, currentUser } = useCurrentUser();
  const { userId } = useAuth();
  const { membership, challenge, setMembership } = useMemberContext();
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
  const [hasPromptedForNotifications, setHasPromptedForNotifications] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Check notification permissions
  useEffect(() => {
    const checkNotifications = async () => {
      if (Platform.OS === 'web') {
        setNotificationsEnabled(true);
        return;
      }

      try {
        const { status } = await Notifications.getPermissionsAsync();
        setNotificationsEnabled(status === 'granted');
      } catch (error) {
        console.error('Error checking notification permissions:', error);
        setNotificationsEnabled(false);
      }
    };

    checkNotifications();

    // Re-check when app comes to foreground (e.g., after returning from Settings)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkNotifications();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Check if user has been prompted for notifications before
  useEffect(() => {
    const checkNotificationPrompt = async () => {
      const prompted = await AsyncStorage.getItem('hasPromptedForNotifications');
      setHasPromptedForNotifications(prompted === 'true');
    };
    checkNotificationPrompt();
  }, []);

  const handleJoinOrLeaveChallenge = () => {
    // Check if user is authenticated before allowing join
    if ((!userId || !currentUser) && !isMember) {
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
      // Show confirmation dialog for leaving the challenge
      Alert.alert(
        'Leave Challenge',
        'Are you sure you want to leave this challenge? All your check-ins will be lost.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Leave', style: 'destructive', onPress: handleLeaveChallenge },
        ]
      );
    } else {
      // Show time picker modal for joining the challenge
      setShowTimeModal(true);
    }
  };

  const handleLeaveChallenge = async () => {
    setJoining(true);

    const token = await getToken();
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    axios
      .post(`${API_HOST}/api/challenges/join-unjoin/${challenge?.id}`, {}, { headers })
      .then((result) => {
        setMembership(null);
      })
      .catch((error) => {
        setError(error.response?.data?.message || 'Failed to leave challenge');
      })
      .finally(() => {
        setJoining(false);
      });
  };

  const handleNotificationConfirm = async (notificationTime: Date, startDate: Date) => {
    setJoining(true);
    setShowTimeModal(false);
    console.log('DEBUG: handleNotificationConfirm called');
    console.log('DEBUG: submitted startDate', startDate.toISOString());
    console.log('DEBUG: notificationTime', notificationTime.toISOString());
    console.log('DEBUG: userId from Clerk', userId);

    if (!userId || !currentUser) {
      setError('User not authenticated. Please sign in again.');
      setJoining(false);
      return;
    }

    const token = await getToken();
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const notificationHour = notificationTime.getHours();
    const notificationMinute = notificationTime.getMinutes();

    // Show notification permission message only once
    if (Platform.OS !== 'web' && !hasPromptedForNotifications) {
      Alert.alert(
        'Notifications Required',
        'This challenge requires notifications. Please enable them in your device settings.',
        [
          { text: 'OK' },
          {
            text: 'Open Settings',
            onPress: () => {
              Linking.openSettings().catch(err => {
                console.error('Failed to open settings:', err);
                Alert.alert(
                  'Unable to Open Settings',
                  'Please open your device Settings app manually and enable notifications for this app.'
                );
              });
            }
          }
        ]
      );
      // Mark that we've prompted the user
      await AsyncStorage.setItem('hasPromptedForNotifications', 'true');
      setHasPromptedForNotifications(true);
    }

    const form = new FormData();
    form.append('userId', userId);
    form.append('notificationHour', notificationHour.toString());
    form.append('notificationMinute', notificationMinute.toString());

    // Add start date - use user-selected date for SELF_LED, challenge start date for GROUP_LED
    if (challenge?.type === 'SELF_LED') {
      form.append('startAt', startDate.toISOString());
    } else if (challenge?.startAt) {
      // For GROUP_LED challenges, use the challenge's start date
      form.append('startAt', new Date(challenge.startAt).toISOString());
    }

    axios
      .post(`${API_HOST}/api/challenges/join-unjoin/${challenge?.id}`, form, { headers })
      .then((result) => {
        console.log('DEBUG: API Success Response:', JSON.stringify(result.data, null, 2));
        console.log('DEBUG: Setting membership to:', result.data.membership);
        Alert.alert('Debug', `Full Response:\n${JSON.stringify(result.data, null, 2)}`);
        setMembership(result.data.membership);
        setJoining(false);
        setError('');
      })
      .catch((error) => {
        console.error('DEBUG: API Error:', error);
        console.error('DEBUG: Error Response:', error.response?.data);
        Alert.alert(
          'Debug Error',
          `Join Failed: ${error.message}\n${JSON.stringify(error.response?.data)}`
        );
        setError(error.response?.data?.message || 'Failed to join challenge');
      })
      .finally(() => {
        setJoining(false);
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
  const description = textToJSX(challenge?.description ?? '');
  return (
    <View className="bg-white p-2">
      {error && <ErrorText>{error}</ErrorText>}
      {description}
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
          (isMember || (challenge?.userId === currentUser?.id && challenge?.status !== 'DRAFT')) && (
            <View className="mb-4 rounded-lg bg-blue-50 p-4">
              <View className="mb-2 flex-row items-center">
                <Feather name="bell" size={20} color="#3b82f6" />
                <Text className="ml-2 font-semibold text-blue-900">Enable Notifications</Text>
              </View>
              <Text className="mb-3 text-sm text-blue-800">
                Get daily reminders for this challenge. Enable notifications in your device settings
                to stay on track.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  console.log('Open Settings button pressed');
                  Linking.openSettings().catch((err) => {
                    console.error('Failed to open settings:', err);
                    Alert.alert(
                      'Unable to Open Settings',
                      'Please open your device Settings app manually and enable notifications for this app.'
                    );
                  });
                }}
                className="rounded-md bg-blue-600 px-4 py-2">
                <Text className="text-center text-sm font-semibold text-white">
                  Open Settings
                </Text>
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
