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

import ChallengeNotificationModal from '~/components/ChallengeNotificationModal';
import ErrorText from '~/components/ErrorText';
import LinkRenderer from '~/components/LinkRenderer';
import { useCurrentUser } from '~/contexts/currentuser-context';
import { useMemberContext } from '~/contexts/member-context';
import { API_HOST } from '~/lib/environment';
import { textToJSX, calculateDuration } from '~/lib/helpers';
import { getShortUrl } from '~/lib/helpers/challenge';

export default function ChallengeAbout() {
  const { getToken, currentUser } = useCurrentUser();
  const { userId } = useAuth();
  const { membership, challenge, setMembership } = useMemberContext();
  
  // Log membership changes for debugging
  useEffect(() => {
    console.log('DEBUG: Membership changed:', membership ? { id: membership.id, challengeId: membership.challengeId } : null);
  }, [membership]);
  
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

    if (!currentUser?.id) {
      setError('User not authenticated. Please sign in again.');
      setJoining(false);
      return;
    }

    const headers = {
      Authorization: `Bearer ${currentUser.id}`,
    };

    axios
      .post(`${API_HOST}/api/challenges/join-unjoin/${challenge?.id}`, {}, { headers })
      .then((result) => {
        console.log('DEBUG: Unjoin response:', JSON.stringify(result.data, null, 2));
        // API returns { result: 'unjoined', data: ... }
        setMembership(null);
        setError('');
      })
      .catch((error) => {
        console.error('DEBUG: Unjoin error:', error);
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

    if (!userId) {
      console.error('DEBUG: No Clerk userId available');
      setError('User not authenticated. Please sign in again.');
      setJoining(false);
      return;
    }

    // Try to use currentUser.id if available
    // If not available, we'll send the Clerk token instead
    let authValue: string;
    if (currentUser?.id) {
      authValue = `Bearer ${currentUser.id}`;
      console.log('DEBUG: Using database user ID for auth:', currentUser.id);
    } else {
      // Fallback: use Clerk token if user not found in database
      const token = await getToken();
      if (!token) {
        console.error('DEBUG: No currentUser.id and no Clerk token available');
        setError('User not authenticated. Please sign in again.');
        setJoining(false);
        return;
      }
      authValue = `Bearer ${token}`;
      console.log('DEBUG: Using Clerk token for auth (user not in database yet)');
    }

    const headers = {
      Authorization: authValue,
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

    const requestHeaders = {
      ...headers,
      'Content-Type': 'application/json',
    };

    console.log('DEBUG: API_HOST:', API_HOST);
    console.log('DEBUG: Challenge ID:', challenge?.id);
    console.log('DEBUG: Request URL:', `${API_HOST}/api/challenges/join-unjoin/${challenge?.id}`);
    console.log('DEBUG: currentUser:', currentUser ? { id: currentUser.id, email: currentUser.email } : null);
    console.log('DEBUG: currentUser.id type:', typeof currentUser?.id);
    console.log('DEBUG: currentUser.id value:', currentUser?.id);
    console.log('DEBUG: Authorization header value:', `Bearer ${currentUser.id}`);
    console.log('DEBUG: Request headers:', requestHeaders);
    console.log('DEBUG: Request data:', requestData);

    axios
      .post(`${API_HOST}/api/challenges/join-unjoin/${challenge?.id}`, requestData, { headers: requestHeaders })
      .then((result) => {
        console.log('DEBUG: API Success Response:', JSON.stringify(result.data, null, 2));
        // API returns { result: 'joined', data: memberChallenge }
        if (result.data.result === 'joined' && result.data.data) {
          const newMembership = result.data.data;
          console.log('DEBUG: Setting membership to:', newMembership);
          console.log('DEBUG: Current membership before update:', membership);
          console.log('DEBUG: isMember before update:', isMember);
          
          // Update membership state
          setMembership(newMembership);
          
          // Verify the update after a brief delay
          setTimeout(() => {
            console.log('DEBUG: Membership after update should be:', newMembership);
            console.log('DEBUG: isMember after update should be:', true);
          }, 100);
        } else if (result.data.result === 'unjoined') {
          console.log('DEBUG: Unjoined, setting membership to null');
          console.log('DEBUG: Current membership before update:', membership);
          console.log('DEBUG: isMember before update:', isMember);
          
          setMembership(null);
          
          setTimeout(() => {
            console.log('DEBUG: Membership after update should be: null');
            console.log('DEBUG: isMember after update should be:', false);
          }, 100);
        }
        setJoining(false);
        setError('');
      })
      .catch((error) => {
        console.error('DEBUG: API Error:', error);
        console.error('DEBUG: Error Response:', error.response?.data);
        console.error('DEBUG: Error Status:', error.response?.status);
        console.error('DEBUG: Error Headers:', error.response?.headers);
        console.error('DEBUG: Error Message:', error.message);
        console.error('DEBUG: Error Code:', error.code);
        console.error('DEBUG: Error Config:', {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          headers: error.config?.headers,
        });
        
        // Check if response is HTML (redirect/error page)
        const responseData = error.response?.data;
        const isHtml = typeof responseData === 'string' && responseData.trim().startsWith('<!');
        if (isHtml) {
          console.error('DEBUG: Server returned HTML instead of JSON. This usually means:');
          console.error('1. Authentication failed - token not validated');
          console.error('2. Server redirected to login page');
          console.error('3. User might not exist in database (webhook not synced)');
          console.error('HTML Response preview:', responseData.substring(0, 500));
        }
        
        let errorMessage = 'Failed to join challenge';
        if (isHtml) {
          errorMessage = 'Authentication failed. The server may not recognize your session. For localhost development, you may need to forward Clerk webhooks using: npx @clerk/clerk-sdk-node localhost';
        } else if (error.message === 'Network Error') {
          errorMessage = `Network Error: Unable to reach server at ${API_HOST}. Please check your connection and ensure the server is running.`;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.status === 401 || error.response?.status === 403) {
          errorMessage = 'Authentication failed. Please sign in again.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        Alert.alert('Error', errorMessage);
        setError(errorMessage);
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
