import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Image, TextInput, TouchableOpacity, View } from 'react-native';

import { Text } from '~/components/nativewindui/Text';
import { useChatContext } from '~/contexts/chat-context';
import { useCurrentUser } from '~/contexts/currentuser-context';
import { commentsApi } from '~/lib/api/commentsApi';
import type { Comment } from '~/lib/types';

interface ChatInputProps {
  challengeId: number;
  cohortId: number | null;
  onMessageSent: (comment: Comment) => void;
}

export function ChatInput({ challengeId, cohortId, onMessageSent }: ChatInputProps) {
  const { currentUser, getToken } = useCurrentUser();
  const { addComment } = useChatContext();
  const [body, setBody] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera roll permissions to upload images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setImage(null);
  };

  const handleSubmit = async () => {
    if (!body.trim() && !image) return;

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'You must be logged in to send messages');
        return;
      }

      // Optimistic update
      const optimisticComment: Comment = {
        id: Date.now(), // Temporary ID
        body: body.trim() || ' ',
        userId: currentUser?.id || 0,
        challengeId,
        cohortId: cohortId || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        likeCount: 0,
        replyCount: 0,
        user: currentUser || undefined,
        imageMeta: image ? ({ secure_url: image } as any) : undefined,
      };
      addComment(optimisticComment);

      const formData = new FormData();
      formData.append('body', body.trim() || ' ');
      formData.append('challengeId', String(challengeId));
      if (cohortId) {
        formData.append('cohortId', String(cohortId));
      }
      if (image) {
        const imageUriParts = image.split('.');
        const fileType = imageUriParts[imageUriParts.length - 1];
        formData.append('image', {
          uri: image,
          type: `image/${fileType}`,
          name: `photo.${fileType}`,
        } as any);
      }

      const comment = await commentsApi.create(formData, token);
      addComment(comment);
      onMessageSent(comment);
      setBody('');
      setImage(null);
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="border-t border-gray-200 bg-white p-3">
      {image && (
        <View className="mb-2">
          <Image source={{ uri: image }} className="h-24 w-24 rounded-lg" resizeMode="cover" />
          <TouchableOpacity
            onPress={removeImage}
            className="absolute right-1 top-1 rounded-full bg-red p-1">
            <Text className="text-xs text-white">×</Text>
          </TouchableOpacity>
        </View>
      )}
      <View className="flex-row items-end">
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Type a message..."
          multiline
          className="mr-2 max-h-24 flex-1 rounded-lg border border-gray-300 px-3 py-2"
          style={{ textAlignVertical: 'top' }}
        />
        <TouchableOpacity
          onPress={pickImage}
          className="mr-2 h-10 w-10 items-center justify-center rounded-lg border border-gray-300">
          <Text className="text-lg">📷</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting || (!body.trim() && !image)}
          className={`h-10 w-10 items-center justify-center rounded-lg ${
            isSubmitting || (!body.trim() && !image) ? 'bg-gray-300' : 'bg-red'
          }`}>
          <Text className="text-lg text-white">→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
