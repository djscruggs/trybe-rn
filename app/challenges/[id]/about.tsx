import { Feather } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import axios from 'axios';
import * as Localization from 'expo-localization';
import { DateTimeFormatOptions } from 'intl';
import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
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
  const { getToken } = useCurrentUser();
  const { membership, challenge, setMembership } = useMemberContext();
  const handleCopy = () => {
    const url = getShortUrl(challenge, membership);
    Share.open({
      url,
    });
  };
  const [joining, setJoining] = useState(false);
  const [isMember, setIsMember] = useState(Boolean(membership));
  const [error, setError] = useState('');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const today = new Date();
  today.setDate(today.getDate() + 1);
  const [startDate, setStartDate] = useState(today);
  const [showTimePicker, setShowTimePicker] = useState(Platform.OS === 'ios');
  const [pickerMode, setPickerMode] = useState<'time' | 'date'>('time');

  const handleJoinOrLeaveChallenge = () => {
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
        setIsMember(false);
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
    console.log('subsmitted startDate', startDate.toISOString());
    const token = await getToken();
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const notificationHour = notificationTime.getHours();
    const notificationMinute = notificationTime.getMinutes();

    // Show notification permission message
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Notifications Required',
        'This challenge requires notifications. Please enable them in your device settings.',
        [{ text: 'OK' }]
      );
    }

    const form = new FormData();
    form.append('notificationHour', notificationHour.toString());
    form.append('notificationMinute', notificationMinute.toString());

    // Add start date for SELF_LED challenges
    if (challenge?.type === 'SELF_LED') {
      form.append('startAt', startDate.toISOString());
    }

    axios
      .post(`${API_HOST}/api/challenges/join-unjoin/${challenge?.id}`, form, { headers })
      .then((result) => {
        console.log(result.data.data);
        setIsMember(!isMember);
        setMembership(result.data.data);
        setJoining(false);
        setError('');
      })
      .catch((error) => {
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
      <View className="mb-6">
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
                  {challenge?.type === 'SELF_LED'
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
