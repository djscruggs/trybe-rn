import axios from 'axios';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';

import { DatePicker } from '~/components/nativewindui/DatePicker/DatePicker';
import { Picker, PickerItem } from '~/components/nativewindui/Picker';
import { Text } from '~/components/nativewindui/Text';
import { useCurrentUser } from '~/contexts/currentuser-context';
import { API_HOST } from '~/lib/environment';
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

export default function NewChallengeScreen() {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errors, setErrors] = useState<ValidationErrors>({});

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

  // Load categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_HOST}/api/categories`);
        setCategories(response.data.categories || []);
      } catch (error) {
        console.error('Error loading categories:', error);
        Alert.alert('Error', 'Failed to load categories');
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

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
    console.log(newErrors);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
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

      // Submit to API
      const response = await axios.post(`${API_HOST}/api/challenges`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.errors) {
        setErrors(response.data.errors);
        Alert.alert('Error', 'Please fix the errors and try again');
      } else {
        Alert.alert('Success', 'Challenge created successfully!', [
          {
            text: 'OK',
            onPress: () => router.push('/'),
          },
        ]);
      }
    } catch (error: any) {
      console.error('Error creating challenge:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create challenge');
    } finally {
      setLoading(false);
    }
  };

  if (loadingCategories) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="red" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
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
              <TextInput
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
              <TextInput
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
                        className={`rounded-full px-4 py-2 ${
                          isSelected ? 'bg-red' : 'bg-gray-200'
                        }`}>
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
                <TextInput
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
                  {errors.endAt && (
                    <Text className="text-red-500 mt-1 text-sm">{errors.endAt}</Text>
                  )}
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
                onPress={() => router.back()}
                disabled={loading}
                className="flex-1 rounded-lg border-2 border-gray-300 p-2">
                <Text className="text-center font-semibold text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                className="flex-1 rounded-lg border bg-red p-2">
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-center font-semibold text-white">Create Challenge</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
