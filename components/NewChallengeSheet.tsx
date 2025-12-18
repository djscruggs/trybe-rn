import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState, useMemo, forwardRef } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import Toast from 'react-native-toast-message';

import { DatePicker } from '~/components/nativewindui/DatePicker/DatePicker';
import { Picker, PickerItem } from '~/components/nativewindui/Picker';
import { Text } from '~/components/nativewindui/Text';
import { useNewChallengeSheet } from '~/contexts/new-challenge-sheet-context';
import { useCurrentUser } from '~/contexts/currentuser-context';
import { categoriesApi } from '~/lib/api/categoriesApi';
import { challengesApi } from '~/lib/api/challengesApi';
import { queryKeys } from '~/lib/api/queryKeys';
import { iconMap } from '~/lib/helpers';
import type { Category, ChallengeInputs, ChallengeType, ChallengeStatus } from '~/lib/types';

// Validation errors type
interface ValidationErrors {
  name?: string;
  description?: string;
  icon?: string;
  categories?: string;
  startAt?: string;
  endAt?: string;
  numDays?: string;
}

// Available frequencies (subset as per docs)
const FREQUENCIES = ['DAILY', 'WEEKDAYS', 'WEEKLY'] as const;

// Available colors
const COLORS = ['red', 'orange', 'salmon', 'yellow', 'green', 'blue', 'purple'] as const;

// Get available icon keys from iconMap
const AVAILABLE_ICONS = Object.keys(iconMap) as (keyof typeof iconMap)[];

export const NewChallengeSheet = forwardRef<BottomSheetModal>((props, ref) => {
  const { closeSheet } = useNewChallengeSheet();
  const queryClient = useQueryClient();
  const { getToken } = useCurrentUser();
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Fetch categories using TanStack Query
  const {
    data: categories = [],
    isLoading: loadingCategories,
    error: categoriesError,
  } = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: categoriesApi.getAll,
  });

  // Show error alert for categories loading failure
  if (categoriesError) {
    Alert.alert('Error', 'Failed to load categories');
  }

  // Form state
  const [formData, setFormData] = useState<Partial<ChallengeInputs>>({
    name: '',
    description: '',
    icon: undefined,
    color: 'red',
    categories: [],
    type: 'SCHEDULED',
    frequency: 'DAILY',
    public: true,
    status: 'DRAFT',
    numDays: 30,
    startAt: undefined,
    endAt: undefined,
    deleteImage: false,
  });

  // Create challenge mutation
  const createChallengeMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return challengesApi.create(data, token);
    },
    onSuccess: () => {
      // Invalidate challenges cache to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.challenges.all });
      Toast.show({
        type: 'success',
        text1: 'Success!',
        text2: 'Challenge created successfully',
      });
      closeSheet();
      handleDismiss();
    },
    onError: (error: any) => {
      console.error('Error creating challenge:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create challenge');
    },
  });

  // Snap points
  const snapPoints = useMemo(() => ['90%'], []);

  // Backdrop component
  const renderBackdrop = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
  );

  // Reset form when sheet is dismissed
  const handleDismiss = () => {
    setFormData({
      name: '',
      description: '',
      icon: undefined,
      color: 'red',
      categories: [],
      type: 'SCHEDULED',
      frequency: 'DAILY',
      public: true,
      status: 'DRAFT',
      numDays: 30,
      startAt: undefined,
      endAt: undefined,
      deleteImage: false,
    });
    setErrors({});
  };

  // Update form field
  const updateField = (field: keyof ChallengeInputs, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Toggle category selection
  const toggleCategory = (category: Category) => {
    const currentCategories = formData.categories || [];
    const isSelected = currentCategories.some((c) => c.id === category.id);

    if (isSelected) {
      updateField(
        'categories',
        currentCategories.filter((c) => c.id !== category.id)
      );
    } else {
      updateField('categories', [...currentCategories, category]);
    }
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.icon) {
      newErrors.icon = 'Icon is required';
    }

    if (!formData.categories || formData.categories.length === 0) {
      newErrors.categories = 'Category is required';
    }

    if (formData.type === 'SCHEDULED') {
      if (!formData.startAt) {
        newErrors.startAt = 'Start date is required';
      }
      if (!formData.endAt) {
        newErrors.endAt = 'End date is required';
      }
    } else {
      // SELF_LED
      if (!formData.numDays) {
        newErrors.numDays = 'Number of Days is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    // Prepare form data for submission
    const submitData = new FormData();

    // Add all text fields
    if (formData.name) submitData.append('name', formData.name);
    if (formData.description) submitData.append('description', formData.description);
    if (formData.icon) submitData.append('icon', formData.icon);
    if (formData.color) submitData.append('color', formData.color);
    if (formData.type) submitData.append('type', formData.type);
    if (formData.frequency) submitData.append('frequency', formData.frequency);
    if (formData.status) submitData.append('status', formData.status);

    submitData.append('public', String(formData.public));

    // Add categories as JSON
    if (formData.categories) {
      submitData.append('categories', JSON.stringify(formData.categories.map((c) => c.id)));
    }

    // Add type-specific fields
    if (formData.type === 'SCHEDULED') {
      if (formData.startAt) {
        submitData.append('startAt', formData.startAt.toISOString());
      }
      if (formData.endAt) {
        submitData.append('endAt', formData.endAt.toISOString());
      }
    } else {
      if (formData.numDays) {
        submitData.append('numDays', String(formData.numDays));
      }
    }

    // Submit using mutation
    createChallengeMutation.mutate(submitData);
  };

  if (loadingCategories) {
    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        onDismiss={handleDismiss}
        enablePanDownToClose={!createChallengeMutation.isPending}
        enableContentPanningGesture={!createChallengeMutation.isPending}>
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator size="large" color="red" />
        </View>
      </BottomSheetModal>
    );
  }

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      onDismiss={handleDismiss}
      enablePanDownToClose={!createChallengeMutation.isPending}
      enableContentPanningGesture={!createChallengeMutation.isPending}>
      <BottomSheetScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        <View className="p-6">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-3xl font-bold text-gray-900">Create Challenge</Text>
            <Text className="mt-2 text-base text-gray-600">
              Set up a new challenge for your community
            </Text>
          </View>

          {/* Challenge Name */}
          <View className="mb-4">
            <Text className="mb-2 text-base font-medium text-gray-700">Name of Challenge *</Text>
            <BottomSheetTextInput
              value={formData.name || ''}
              onChangeText={(text) => updateField('name', text)}
              placeholder="Give your challenge a catchy name"
              className="h-12 rounded-lg border border-gray-300 px-4"
            />
            {errors.name && <Text className="text-red-500 mt-1 text-sm">{errors.name}</Text>}
          </View>

          {/* Description */}
          <View className="mb-4">
            <Text className="mb-2 text-base font-medium text-gray-700">Description *</Text>
            <BottomSheetTextInput
              value={formData.description || ''}
              onChangeText={(text) => updateField('description', text)}
              placeholder="Share a short description of what this challenge is all about"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="rounded-lg border border-gray-300 p-4"
            />
            {errors.description && (
              <Text className="text-red-500 mt-1 text-sm">{errors.description}</Text>
            )}
          </View>

          {/* Categories */}
          <View className="mb-4">
            <Text className="mb-2 text-base font-medium text-gray-700">Categories *</Text>
            {categories && categories.length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {categories.map((category) => {
                  const isSelected = formData.categories?.some((c) => c.id === category.id);
                  return (
                    <TouchableOpacity
                      key={category.id}
                      onPress={() => toggleCategory(category)}
                      className={`rounded-full px-4 py-2 ${isSelected ? 'bg-red' : 'bg-gray-200'}`}>
                      <Text className={isSelected ? 'text-white' : 'text-gray-700'}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View className="rounded-lg border border-gray-300 p-4">
                <Text className="text-center text-gray-500">No categories available</Text>
              </View>
            )}
            {errors.categories && (
              <Text className="text-red-500 mt-1 text-sm">{errors.categories}</Text>
            )}
          </View>

          {/* Frequency */}
          <View className="mb-4">
            <Text className="mb-2 text-base font-medium text-gray-700">Select Frequency</Text>
            <Picker
              selectedValue={formData.frequency}
              onValueChange={(value) => updateField('frequency', value)}>
              {FREQUENCIES.map((freq) => (
                <PickerItem key={freq} label={freq} value={freq} />
              ))}
            </Picker>
          </View>

          {/* Challenge Type */}
          <View className="mb-4">
            <Text className="mb-2 text-base font-medium text-gray-700">Challenge Type</Text>
            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => updateField('type', 'SCHEDULED')}
                className={`flex-1 rounded-lg border-2 p-4 ${
                  formData.type === 'SCHEDULED' ? 'border-red-500' : 'border-gray-300'
                }`}>
                <Text
                  className={`font-semibold ${
                    formData.type === 'SCHEDULED' ? 'text-red-500' : 'text-gray-700'
                  }`}>
                  Scheduled
                </Text>
                <Text className="mt-1 text-sm text-gray-600">Happen on specific dates</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => updateField('type', 'SELF_LED')}
                className={`flex-1 rounded-lg border-2 p-4 ${
                  formData.type === 'SELF_LED' ? 'border-red-500' : 'border-gray-300'
                }`}>
                <Text
                  className={`font-semibold ${
                    formData.type === 'SELF_LED' ? 'text-red-500' : 'text-gray-700'
                  }`}>
                  Self-Directed
                </Text>
                <Text className="mt-1 text-sm text-gray-600">Can be started at any time</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Conditional Fields based on Type */}
          {formData.type === 'SELF_LED' ? (
            <View className="mb-4">
              <Text className="mb-2 text-base font-medium text-gray-700">
                Number of Days * (5-60)
              </Text>
              <BottomSheetTextInput
                value={formData.numDays ? String(formData.numDays) : ''}
                onChangeText={(text) => {
                  const num = parseInt(text, 10);
                  if (!isNaN(num)) {
                    updateField('numDays', Math.max(5, Math.min(60, num)));
                  }
                }}
                placeholder="30"
                keyboardType="number-pad"
                className="h-12 rounded-lg border border-gray-300 px-4"
              />
              {errors.numDays && (
                <Text className="text-red-500 mt-1 text-sm">{errors.numDays}</Text>
              )}
            </View>
          ) : (
            <>
              {/* Start Date */}
              <View className="mb-4">
                <Text className="mb-2 text-base font-medium text-gray-700">Start Date *</Text>
                <DatePicker
                  value={formData.startAt instanceof Date ? formData.startAt : new Date()}
                  onChange={(date) => {
                    updateField('startAt', date);
                    // Auto-calculate end date (30 days later)
                    if (!formData.endAt && date instanceof Date) {
                      const endDate = new Date(date);
                      endDate.setDate(endDate.getDate() + 30);
                      updateField('endAt', endDate);
                    }
                  }}
                  minimumDate={new Date()}
                />
                {errors.startAt && (
                  <Text className="text-red-500 mt-1 text-sm">{errors.startAt}</Text>
                )}
              </View>

              {/* End Date */}
              <View className="mb-4">
                <Text className="mb-2 text-base font-medium text-gray-700">End Date *</Text>
                <DatePicker
                  value={formData.endAt instanceof Date ? formData.endAt : new Date()}
                  onChange={(date) => updateField('endAt', date)}
                  minimumDate={
                    formData.startAt instanceof Date
                      ? new Date(formData.startAt.getTime() + 7 * 24 * 60 * 60 * 1000)
                      : new Date()
                  }
                />
                {errors.endAt && <Text className="text-red-500 mt-1 text-sm">{errors.endAt}</Text>}
              </View>
            </>
          )}

          {/* Public/Private */}
          <View className="mb-4">
            <Text className="mb-2 text-base font-medium text-gray-700">Who can join?</Text>
            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => updateField('public', true)}
                className={`flex-1 rounded-lg border-2 p-4 ${
                  formData.public ? 'border-red-500' : 'border-gray-300'
                }`}>
                <Text
                  className={`text-center font-semibold ${
                    formData.public ? 'text-red-500' : 'text-gray-700'
                  }`}>
                  Anyone
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => updateField('public', false)}
                className={`flex-1 rounded-lg border-2 p-4 ${
                  !formData.public ? 'border-red-500' : 'border-gray-300'
                }`}>
                <Text
                  className={`text-center font-semibold ${
                    !formData.public ? 'text-red-500' : 'text-gray-700'
                  }`}>
                  Invite only
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Publication Status */}
          <View className="mb-4">
            <Text className="mb-2 text-base font-medium text-gray-700">Publication Status</Text>
            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => updateField('status', 'PUBLISHED')}
                className={`flex-1 rounded-lg border-2 p-4 ${
                  formData.status === 'PUBLISHED' ? 'border-red-500' : 'border-gray-300'
                }`}>
                <Text
                  className={`text-center font-semibold ${
                    formData.status === 'PUBLISHED' ? 'text-red-500' : 'text-gray-700'
                  }`}>
                  Published
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => updateField('status', 'DRAFT')}
                className={`flex-1 rounded-lg border-2 p-4 ${
                  formData.status === 'DRAFT' ? 'border-red-500' : 'border-gray-300'
                }`}>
                <Text
                  className={`text-center font-semibold ${
                    formData.status === 'DRAFT' ? 'text-red-500' : 'text-gray-700'
                  }`}>
                  Draft
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Color Picker */}
          <View className="mb-4">
            <Text className="mb-2 text-base font-medium text-gray-700">Color</Text>
            <View className="flex-row flex-wrap gap-3">
              {COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => updateField('color', color)}
                  className={`h-9 w-9 rounded-full ${
                    formData.color === color ? 'border border-gray-800' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </View>
          </View>

          {/* Icon Selector */}
          <View className="mb-4">
            <Text className="mb-2 text-base font-medium text-gray-700">Select Icon *</Text>
            <View className="flex-row flex-wrap gap-3">
              {AVAILABLE_ICONS.map((iconKey) => (
                <TouchableOpacity
                  key={iconKey}
                  onPress={() => updateField('icon', iconKey)}
                  className={`rounded-lg border p-1 ${
                    formData.icon === iconKey ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}>
                  <Image
                    source={iconMap[iconKey]}
                    style={{
                      width: 50,
                      height: 50,
                    }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              ))}
            </View>
            {errors.icon && <Text className="text-red-500 mt-1 text-sm">{errors.icon}</Text>}
          </View>

          {/* Submit Buttons */}
          <View className="mb-8 flex-row gap-4">
            <TouchableOpacity
              onPress={closeSheet}
              disabled={createChallengeMutation.isPending}
              className="flex-1 rounded-lg border-2 border-gray-300 p-2">
              <Text className="text-center font-semibold text-gray-700">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={createChallengeMutation.isPending}
              className="flex-1 rounded-lg border bg-red p-2">
              {createChallengeMutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-center font-semibold text-white">Create Challenge</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

NewChallengeSheet.displayName = 'NewChallengeSheet';
