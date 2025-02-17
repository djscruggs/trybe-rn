import { Feather } from '@expo/vector-icons';
import * as Localization from 'expo-localization';
import { DateTimeFormatOptions } from 'intl';
import { View, Text, TouchableOpacity } from 'react-native';
import Share from 'react-native-share';

import { useMemberContext } from '~/contexts/member-context';
import { textToJSX, calculateDuration } from '~/lib/helpers';
import { getShortUrl } from '~/lib/helpers/challenge';
export default function ChallengeAbout() {
  const { membership, challenge } = useMemberContext();
  const handleCopy = () => {
    const url = getShortUrl(challenge, membership);
    Share.open({
      url,
    });
  };
  const dateOptions: DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };
  const locale = Localization.getLocales()[0]?.languageTag;
  return (
    <View className="bg-white p-2">
      {/* Description Section */}
      <Text className="mb-6 text-base leading-6 text-gray-700">
        {textToJSX(challenge?.description ?? '')}
      </Text>

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
            <Text className="text-base text-black">{calculateDuration(challenge)} days</Text>
          </View>
        </View>

        <View className="flex-row justify-between">
          <View className="flex-1">
            <Text className="mb-1 text-sm text-gray-500">Started</Text>
            <View className="flex-row items-center">
              <Text className="text-base text-black">
                {challenge?.startAt
                  ? new Date(challenge.startAt).toLocaleDateString(locale, dateOptions)
                  : ''}
              </Text>
              <TouchableOpacity>
                <Text className="text-red-400 ml-2 text-sm">edit</Text>
              </TouchableOpacity>
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
              <TouchableOpacity>
                <Text className="text-red-400 ml-2 text-sm">edit</Text>
              </TouchableOpacity>
            </View>
          </View>
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

      {/* Leave Challenge Button */}
      <TouchableOpacity className="bg-red-400 items-center rounded p-3">
        <Text className="text-base text-white">Leave Challenge</Text>
      </TouchableOpacity>
    </View>
  );
}
