import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { forwardRef, useMemo, useState, memo, useRef } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import Toast from 'react-native-toast-message';

import { Text } from '~/components/nativewindui/Text';
import { useCurrentUser } from '~/contexts/currentuser-context';
import { queryKeys } from '~/lib/api/queryKeys';
import { API_HOST } from '~/lib/environment';
import type { CheckIn } from '~/lib/types';

interface CheckInModalProps {
  onCheckInComplete?: (checkIn: CheckIn) => void;
  challengeId: string | number;
  cohortId?: number | null;
  userId?: number | string; // Optional: pass userId directly to avoid context timing issues
}

const CheckInModalComponent = forwardRef<BottomSheetModal, CheckInModalProps>(
  ({ onCheckInComplete, challengeId, cohortId, userId: propUserId }, ref) => {
    const { currentUser } = useCurrentUser();
    const queryClient = useQueryClient();
    const bodyRef = useRef('');
    const [image, setImage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inputKey, setInputKey] = useState(0);

    const snapPoints = useMemo(() => ['75%'], []);

    const renderBackdrop = (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    );

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
      // Use propUserId if available, otherwise fall back to currentUser.id
      const userId = propUserId || currentUser?.id;

      // Debug logging
      console.log('CheckInModal - handleSubmit called');
      console.log('currentUser:', currentUser);
      console.log('currentUser.id:', currentUser?.id);
      console.log('propUserId:', propUserId);
      console.log('resolved userId:', userId);
      console.log('challengeId:', challengeId);

      if (!userId || !challengeId) {
        const missingFields = [];
        if (!userId) missingFields.push('userId');
        if (!challengeId) missingFields.push('challengeId');

        console.error('Missing required fields:', missingFields.join(', '));
        Alert.alert(
          'Error',
          `Unable to check in. Missing: ${missingFields.join(', ')}. Please try again.`
        );
        return;
      }

      if (!API_HOST) {
        Alert.alert('Error', 'API host not configured. Please check your environment variables.');
        return;
      }

      setIsSubmitting(true);

      try {
        const formData = new FormData();
        formData.append('body', bodyRef.current);
        formData.append('userId', String(userId));
        formData.append('challengeId', String(challengeId));

        if (cohortId) {
          formData.append('cohortId', String(cohortId));
        }

        if (image) {
          const imageUri = image;
          const filename = imageUri.split('/').pop() || 'image.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';

          formData.append('image', {
            uri: imageUri,
            name: filename,
            type,
          } as any);
        }

        const headers = {
          Authorization: `Bearer ${userId}`,
        };

        const url = `${API_HOST}/api/challenges/${challengeId}/checkins`;

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const responseData = await response.json();

        // Invalidate queries to refetch updated data
        if (challengeId && currentUser?.id) {
          // Invalidate membership query
          queryClient.invalidateQueries({
            queryKey: queryKeys.challenges.membership(challengeId.toString()),
          });

          // Invalidate check-ins query to refresh progress chart
          queryClient.invalidateQueries({
            queryKey: queryKeys.challenges.checkIns(
              challengeId.toString(),
              currentUser.id.toString()
            ),
          });
        }

        Toast.show({
          type: 'success',
          text1: '🎉 Great job!',
          text2: 'Check-in completed successfully',
        });

        bodyRef.current = '';
        setImage(null);
        setInputKey(prev => prev + 1); // Reset input

        // Call callback to notify parent component
        if (onCheckInComplete && responseData.checkIn) {
          onCheckInComplete(responseData.checkIn);
        }

        // Close the modal
        if (ref && 'current' in ref && ref.current) {
          ref.current.dismiss();
        }
      } catch (error: any) {
        let errorMessage = 'Failed to check in. Please try again.';
        if (error.message) {
          errorMessage = error.message;
        }

        Alert.alert('Error', errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleDismiss = () => {
      bodyRef.current = '';
      setImage(null);
      setInputKey(prev => prev + 1); // Force re-mount of input
    };

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        onDismiss={handleDismiss}>
        <BottomSheetScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <View className="p-6">
            <Text className="mb-4 text-2xl font-bold">Check In</Text>

            <View className="mb-4">
              <Text className="mb-2 text-base font-semibold">How did it go?</Text>
              <BottomSheetTextInput
                key={`body-input-${inputKey}`}
                defaultValue={bodyRef.current}
                onChangeText={(text) => {
                  bodyRef.current = text;
                }}
                placeholder="Share your progress, thoughts, or achievements..."
                multiline
                numberOfLines={4}
                style={{
                  minHeight: 96,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  backgroundColor: 'white',
                  padding: 12,
                  fontSize: 16,
                  textAlignVertical: 'top',
                }}
              />
            </View>

            <View className="mb-4">
              {image ? (
                <View className="relative">
                  <Image
                    source={{ uri: image }}
                    className="h-48 w-full rounded-lg"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={removeImage}
                    className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-red">
                    <Text className="text-xl font-bold text-white">×</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={pickImage}
                  className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4">
                  <Text className="text-center text-gray-600">+ Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              className="rounded-lg bg-red p-4"
              style={{ opacity: isSubmitting ? 0.6 : 1 }}>
              {isSubmitting ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="ml-2 text-white">Submitting...</Text>
                </View>
              ) : (
                <Text className="text-center font-semibold text-white">Check In</Text>
              )}
            </TouchableOpacity>
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

CheckInModalComponent.displayName = 'CheckInModal';

export const CheckInModal = memo(CheckInModalComponent);
