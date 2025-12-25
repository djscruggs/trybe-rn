import { formatDistanceToNow } from 'date-fns';
import React from 'react';
import { Image, TouchableOpacity, View } from 'react-native';

import UserAvatar from '~/components/UserAvatar';
import { Text } from '~/components/nativewindui/Text';
import type { Comment } from '~/lib/types';

interface ChatMessageItemProps {
  comment: Comment;
  isOwnMessage?: boolean;
}

export function ChatMessageItem({ comment, isOwnMessage = false }: ChatMessageItemProps) {
  const formattedDate = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });
  const userName = comment.user?.profile?.fullName || 'Anonymous';
  const avatarUrl = comment.user?.profile?.profileImage || undefined;

  return (
    <View className={`mb-4 flex-row ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
      <View className="mr-2">
        <UserAvatar size={40} name={userName} src={avatarUrl} borderRadius={20} />
      </View>
      <View className={`flex-1 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        <View className={`mb-1 flex-row ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
          <Text className={`text-sm font-semibold ${isOwnMessage ? 'mr-2' : 'mr-2'}`}>
            {userName}
          </Text>
          <Text className="text-xs text-gray-500">{formattedDate}</Text>
        </View>
        <View className={`rounded-lg px-3 py-2 ${isOwnMessage ? 'bg-red' : 'bg-gray-200'}`}>
          <Text className={`text-sm ${isOwnMessage ? 'text-white' : 'text-gray-900'}`}>
            {comment.body}
          </Text>
        </View>
        {comment.imageMeta?.secure_url && (
          <TouchableOpacity className="mt-2 overflow-hidden rounded-lg">
            <Image
              source={{ uri: comment.imageMeta.secure_url }}
              className="h-48 w-48 rounded-lg"
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
        {comment.videoMeta?.secure_url && (
          <View className="mt-2">
            <Text className="text-xs italic text-gray-500">Video attachment</Text>
          </View>
        )}
      </View>
    </View>
  );
}
