import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Platform } from 'react-native';

import type { MemberChallenge } from '~/lib/types';
interface ChallengeNotificationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (notificationTime: Date, startDate: Date) => void;
  isSelfLed: boolean;
  membership?: MemberChallenge;
}

export default function ChallengeNotificationModal({
  visible,
  onClose,
  onConfirm,
  isSelfLed,
  membership,
}: ChallengeNotificationModalProps) {
  // Initialize with membership values if available, otherwise default values
  const initNotificationTime = () => {
    if (
      membership?.notificationHour !== undefined &&
      membership?.notificationMinute !== undefined
    ) {
      const date = new Date();
      date.setHours(membership.notificationHour ?? 0);
      date.setMinutes(membership.notificationMinute ?? 0);
      return date;
    }
    return new Date();
  };

  const initStartDate = () => {
    if (membership?.startAt) {
      return new Date(membership.startAt);
    }
    // Default to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  };

  const [notificationTime, setNotificationTime] = useState(initNotificationTime());
  const [startDate, setStartDate] = useState(initStartDate());
  const [showTimePicker, setShowTimePicker] = useState(Platform.OS === 'ios');
  const [pickerMode, setPickerMode] = useState<'time' | 'date'>('time');

  // Reset values when membership changes
  useEffect(() => {
    setNotificationTime(initNotificationTime());
    setStartDate(initStartDate());
  }, [membership]);

  const handleTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setNotificationTime(selectedTime);
    }
  };
  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const showTimeDatePicker = (mode: 'time' | 'date') => {
    setPickerMode(mode);
    if (Platform.OS === 'android') {
      setShowTimePicker(true);
    }
  };

  const handleConfirm = () => {
    onConfirm(notificationTime, startDate);
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/50">
        <View className="w-4/5 rounded-lg bg-white p-4">
          {/* Start Date Picker for SELF_LED challenges */}
          {isSelfLed && (
            <View className="mb-6">
              <Text className="mb-2 text-center text-base">
                When would you like to start this challenge?
              </Text>

              {Platform.OS === 'android' && (
                <TouchableOpacity
                  className="mb-4 rounded bg-gray-200 px-4 py-3"
                  onPress={() => showTimeDatePicker('date')}>
                  <Text className="text-center">{startDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
              )}

              {(Platform.OS === 'ios' || (showTimePicker && pickerMode === 'date')) && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  format="MM-DD"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>
          )}

          <Text className="mb-2 text-center text-base">
            Select a time for your daily check in notices
          </Text>

          {Platform.OS === 'android' && (
            <TouchableOpacity
              className="mb-4 rounded bg-gray-200 px-4 py-3"
              onPress={() => showTimeDatePicker('time')}>
              <Text className="text-center">
                {notificationTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          )}

          {(Platform.OS === 'ios' || (showTimePicker && pickerMode === 'time')) && (
            <DateTimePicker
              value={notificationTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          )}

          <View className="mt-4 flex-row justify-around">
            <TouchableOpacity className="rounded bg-gray-300 px-4 py-2" onPress={onClose}>
              <Text>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity className="rounded bg-red px-4 py-2" onPress={handleConfirm}>
              <Text className="text-white">Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
