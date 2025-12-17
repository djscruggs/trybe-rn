import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link, useLocalSearchParams, router } from 'expo-router';
import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import UserAvatar from 'react-native-user-avatar';

import LinkRenderer from '~/components/LinkRenderer';
import { useMemberContext } from '~/contexts/member-context';
import { API_HOST } from '~/lib/environment';
import { textToJSX } from '~/lib/helpers';

export default function PostDetail() {
  const { postId } = useLocalSearchParams();
  const { challenge } = useMemberContext();
  const {
    data: post,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['challenge', postId],
    queryFn: async () => {
      const url = `${API_HOST}/api/posts/v/${postId}`;
      const response = await axios.get(url);
      return response.data;
    },
    staleTime: process.env.NODE_ENV === 'development' ? 0 : 1000 * 60,
  });

  return (
    <>
      {isLoading || error ? (
        <View className="flex-1 items-center justify-center">
          {isLoading && <ActivityIndicator size="small" color="#C4C4C4" />}
          {error && <Text className="text-red-500">Error loading challenge details</Text>}
        </View>
      ) : (
        <View className="p-2">
          <View className="flex-row items-center justify-start">
            <View className="h-10 w-10">
              <UserAvatar
                size={40}
                name={post.user.profile.fullName}
                src={post.user.profile.profileImage ?? undefined}
              />
            </View>
            <Text className="text-md ml-2 font-bold">Post Title: {post.title}</Text>
          </View>
          <Text className="text-md my-4">{textToJSX(post.body)}</Text>
          <LinkRenderer text={post.body} />
          {/* Add more details or components related to the post here */}
          {challenge?.id && (
            <View className="mt-10 flex items-center justify-center">
              <Link href={`/challenges/${challenge.id.toString()}/program` as any}>
                <TouchableOpacity
                  className="mt-10 rounded-full bg-red p-1 px-2"
                  onPress={() => router.push(`/challenges/${challenge.id?.toString()}/program`)}>
                  <Text className="text-xs text-white">Back</Text>
                </TouchableOpacity>
              </Link>
            </View>
          )}
        </View>
      )}
    </>
  );
}
