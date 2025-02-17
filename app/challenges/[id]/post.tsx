import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View, Text, ActivityIndicator, Button } from 'react-native';
import { useSearchParams } from 'react-router-dom';

import { API_HOST } from '~/lib/environment';

export default function PostDetail() {
  const navigation = useNavigation();
  const { postId } = useLocalSearchParams();
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
          <Text className="text-xl font-bold">Post ID: {post.id}</Text>
          <Text className="text-xl font-bold">Post Title: {post.title}</Text>
          <Text className="text-xl font-bold">Post Content: {post.content}</Text>

          {/* Add more details or components related to the post here */}
          <Button
            title="Back"
            onPress={() => navigation.goBack()}
            className="bg-blue-500 mt-4 rounded p-2 text-white"
          />
        </View>
      )}
    </>
  );
}
