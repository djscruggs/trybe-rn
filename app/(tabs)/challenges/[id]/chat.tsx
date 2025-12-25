import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router, useFocusEffect, useNavigation, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableOpacity,
  View,
} from 'react-native';

import { ChatInput } from '~/components/ChatInput';
import { ChatMessageItem } from '~/components/ChatMessageItem';
import { Text } from '~/components/nativewindui/Text';
import { ChatContextProvider, useChatContext } from '~/contexts/chat-context';
import { useCurrentUser } from '~/contexts/currentuser-context';
import { useMemberContext } from '~/contexts/member-context';
import { commentsApi } from '~/lib/api/commentsApi';
import { queryKeys } from '~/lib/api/queryKeys';
import { PUSHER_CLUSTER, PUSHER_KEY } from '~/lib/environment';
import { iconMap } from '~/lib/helpers';
import type { Comment } from '~/lib/types';

function groupCommentsByDate(comments: Comment[]): Record<string, Comment[]> {
  const grouped: Record<string, Comment[]> = {};
  comments.forEach((comment) => {
    const date = new Date(comment.createdAt).toLocaleDateString('en-CA');
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(comment);
  });
  return grouped;
}

function ChatMessagesList() {
  const { getCommentsByDate } = useChatContext();
  const { currentUser } = useCurrentUser();
  const commentsByDate = getCommentsByDate();
  const dates = Object.keys(commentsByDate).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  const flatListData = useMemo(() => {
    if (dates.length === 0) return [];
    return dates.flatMap((date) => {
      const comments = commentsByDate[date] || [];
      const sorted = [...comments].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      return sorted.map((comment) => ({ ...comment, dateKey: date }));
    });
  }, [dates, commentsByDate]);

  const renderItem = ({ item, index }: { item: Comment & { dateKey: string }; index: number }) => {
    const isOwnMessage = item.userId === currentUser?.id;
    const prevItem = index > 0 ? flatListData[index - 1] : null;
    const isFirstInDate = !prevItem || prevItem.dateKey !== item.dateKey;

    return (
      <View>
        {isFirstInDate && (
          <Text className="my-2 text-center text-xs font-semibold text-gray-500">
            {new Date(item.dateKey).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        )}
        <ChatMessageItem comment={item} isOwnMessage={isOwnMessage} />
      </View>
    );
  };

  if (flatListData.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text className="text-center text-gray-500">No messages yet. Start the conversation!</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={flatListData}
      renderItem={renderItem}
      keyExtractor={(item) => `comment-${item.id}`}
      contentContainerStyle={{ padding: 16 }}
      style={{ flex: 1 }}
      showsVerticalScrollIndicator
      inverted={false}
    />
  );
}

export default function ChallengeChat() {
  const navigation = useNavigation();
  const { id } = useLocalSearchParams();
  const { getToken } = useCurrentUser();
  const { challenge, membership } = useMemberContext();
  const challengeId = challenge?.id ? Number(challenge.id) : null;
  const cohortId = membership?.cohortId ?? null;

  const [commentsByDate, setCommentsByDate] = useState<Record<string, Comment[]>>({});

  const {
    data: comments = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.comments.challenge(id as string, cohortId || undefined),
    queryFn: async () => {
      if (!id) return [];
      const token = await getToken();
      return commentsApi.getForChallenge(id as string, token);
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (comments.length > 0) {
      const grouped = groupCommentsByDate(comments);
      setCommentsByDate(grouped);
    } else if (comments.length === 0 && !isLoading) {
      setCommentsByDate({});
    }
  }, [comments, isLoading]);

  const handleMessageSent = (comment: Comment) => {
    const date = new Date(comment.createdAt).toLocaleDateString('en-CA');
    setCommentsByDate((prev) => {
      const updated = { ...prev };
      if (!updated[date]) {
        updated[date] = [];
      }
      updated[date] = [...updated[date], comment];
      return updated;
    });
    refetch();
  };

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      parent?.setOptions({ tabBarStyle: { display: 'none' } });

      return () => {
        parent?.setOptions({ tabBarStyle: undefined });
      };
    }, [navigation])
  );

  if (!challenge) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#EF4444" />
          <Text className="mt-4 text-gray-500">Loading challenge...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!challengeId || !cohortId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <View className="flex-1 items-center justify-center">
          <Text>Loading challenge...</Text>
          <ActivityIndicator size="large" color="#EF4444" />
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#EF4444" />
          <Text className="mt-4 text-gray-500">Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-red-500">Error loading messages</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <ChatContextProvider
        challengeId={challengeId}
        cohortId={cohortId}
        commentsByDate={commentsByDate}
        pusherKey={PUSHER_KEY}
        pusherCluster={PUSHER_CLUSTER}
        onChange={setCommentsByDate}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>
          {/* Header */}
          <View className="flex-row items-center border-b border-gray-200 bg-white px-4 py-3">
            <TouchableOpacity onPress={handleBack} className="mr-3">
              <Feather name="arrow-left" size={24} color="#000" />
            </TouchableOpacity>
            <Image
              source={iconMap[challenge.icon as keyof typeof iconMap]}
              className={`h-10 w-10 rounded-full border border-solid ${
                challenge.color ? `border-${challenge.color}` : ''
              }`}
            />
            <Text className="ml-3 flex-1 text-lg font-bold" numberOfLines={1}>
              {challenge.name}
            </Text>
          </View>

          {/* Messages List */}
          <View style={{ flex: 1 }}>
            <ChatMessagesList />
          </View>

          {/* Chat Input */}
          <ChatInput
            challengeId={challengeId}
            cohortId={cohortId}
            onMessageSent={handleMessageSent}
          />
        </KeyboardAvoidingView>
      </ChatContextProvider>
    </SafeAreaView>
  );
}
