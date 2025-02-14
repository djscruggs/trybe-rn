import Feather from '@expo/vector-icons/Feather';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import * as Localization from 'expo-localization';
import { useLocalSearchParams } from 'expo-router';
import { DateTimeFormatOptions } from 'intl';
import React from 'react';
import {
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Image,
  Clipboard,
  ScrollView,
} from 'react-native';
import Share from 'react-native-share';

import { MemberContextProvider, useMemberContext } from '~/contexts/member-context';
import { API_HOST } from '~/lib/environment';
import { iconMap, calculateDuration, textToJSX } from '~/lib/helpers';
import { getShortUrl } from '~/lib/helpers/challenge';
import { Challenge } from '~/lib/types';

export default function ChallengeDetail() {
  const { membership, setMembership } = useMemberContext();
  const { id } = useLocalSearchParams();
  const [activeView, setActiveView] = React.useState('About'); // State to track active view
  // Reset activeView to 'About' whenever the challenge id changes
  React.useEffect(() => {
    setActiveView('About');
  }, [id]);
  // Fetch challenge data using TanStack Query
  const {
    data: challenge,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['challenge', id],
    queryFn: async () => {
      const url = `${API_HOST}/api/challenges/v/${id}`;
      const response = await axios.get(url);
      return response.data;
    },
    staleTime: process.env.NODE_ENV === 'development' ? 0 : 1000 * 60,
  });

  if (isLoading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (error) {
    return <Text className="text-red-500">Error loading challenge details</Text>;
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'About':
        return <ChallengeDetailView challenge={challenge} />;
      case 'Program':
        return <ProgramView challenge={challenge} />;
      case 'Progress':
        return <ProgressView challenge={challenge} />;
      case 'Chat':
        return <ChatView challenge={challenge} />;
      default:
        return <ChallengeDetailView challenge={challenge} />;
    }
  };

  return (
    <MemberContextProvider membership={membership ?? null} setMembership={setMembership}>
      <ScrollView className="p-2">
        <View className="mt-20 p-2">
          {/* Header Section */}
          <View className="mb-5 rounded-md bg-white p-2">
            <View className="mb-4 flex-row items-center">
              <View className="mr-2 break-words">
                <Image
                  source={iconMap[challenge.icon as keyof typeof iconMap]}
                  className={`h-10 w-10 rounded-full border border-solid ${
                    challenge.color ? `border-${challenge.color}` : ''
                  }`}
                />
              </View>
              <Text className="break-words text-lg font-bold">{challenge.name}</Text>
            </View>
            <ChallengeDetailNavigation setActiveView={setActiveView} />
            {renderActiveView()}
          </View>
        </View>
      </ScrollView>
    </MemberContextProvider>
  );
}

const ChallengeDetailView = ({ challenge }: { challenge: Challenge }) => {
  const { membership } = useMemberContext();
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
        {textToJSX(challenge.description ?? '')}
      </Text>

      {/* Program Details */}
      <View className="mb-6">
        <View className="mb-4 flex-row justify-between">
          <View className="flex-1">
            <Text className="mb-1 text-sm text-gray-500">Frequency</Text>
            <Text className="text-base text-black">
              {challenge.frequency.charAt(0).toUpperCase() +
                challenge.frequency.slice(1).toLowerCase()}
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
                {challenge.startAt
                  ? new Date(challenge.startAt).toLocaleDateString(locale, dateOptions)
                  : ''}
              </Text>
              <TouchableOpacity>
                <Text className="ml-2 text-sm text-red-400">edit</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-sm text-gray-500">Reminder Time</Text>
            <View className="flex-row items-center">
              <Text className="text-base text-black">{challenge.reminderTime}</Text>
              <TouchableOpacity>
                <Text className="ml-2 text-sm text-red-400">edit</Text>
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
      <TouchableOpacity className="items-center rounded bg-red-400 p-3">
        <Text className="text-base text-white">Leave Challenge</Text>
      </TouchableOpacity>
    </View>
  );
};

const ChallengeDetailNavigation = ({
  setActiveView,
}: {
  setActiveView: (view: string) => void;
}) => {
  return (
    <View className="mb-4 flex-row items-center justify-between">
      <Text onPress={() => setActiveView('About')} className="border-b-2 border-black text-black">
        About
      </Text>
      <Text onPress={() => setActiveView('Program')} className="text-gray-500">
        Program
      </Text>
      <Text onPress={() => setActiveView('Progress')} className="text-gray-500">
        Progress
      </Text>
      <Text onPress={() => setActiveView('Chat')} className="text-gray-500">
        Chat
      </Text>
      <TouchableOpacity className="bg-red rounded-full p-1">
        <Text className="text-xs text-white">Check In</Text>
      </TouchableOpacity>
    </View>
  );
};

const ProgramView = ({ challenge }: { challenge: Challenge }) => {
  const { id } = useLocalSearchParams();

  // Fetch program data for the challenge
  const {
    data: program,
    error: programError,
    isLoading: isProgramLoading,
  } = useQuery({
    queryKey: ['challengeProgram', id],
    queryFn: async () => {
      const url = `${API_HOST}/api/challenges/v/${id}/program`;
      const response = await axios.get(url);
      return response.data;
    },
    staleTime: process.env.NODE_ENV === 'development' ? 0 : 1000 * 60,
  });

  if (isProgramLoading) {
    return <ActivityIndicator size="small" color="#C4C4C4" />;
  }

  if (programError) {
    return <Text className="text-red-500">Error loading program details</Text>;
  }

  return (
    <View>
      <Text>Program View</Text>
      {/* Render program details here */}
      <Text>{JSON.stringify(program)}</Text>
    </View>
  );
};

const ProgressView = ({ challenge }: { challenge: Challenge }) => {
  const { membership } = useMemberContext();
  if (!membership) {
    return <Text>You need to create an account to view your progress.</Text>;
  }
  return <Text>Progress View</Text>;
};

const ChatView = ({ challenge }: { challenge: Challenge }) => {
  const { membership } = useMemberContext();
  if (!membership) {
    return <Text>You need to create an account to participate in the chat.</Text>;
  }
  return <Text>Chat View</Text>;
};
