import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';

import { apiClient } from './api/client';
import { API_HOST } from './environment';
import { logger } from './logger';

// Configure how notifications behave when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications() {
  const { userId } = useAuth();
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    if (!userId) {
      logger.debug('[usePushNotifications] No userId, skipping registration');
      return;
    }

    registerForPushNotificationsAsync()
      .then((token) => {
        if (token) {
          logger.debug('[usePushNotifications] Got push token:', token);
          sendPushTokenToServer(token);
        }
      })
      .catch((error) => {
        logger.error('[usePushNotifications] Error registering for push notifications:', error);
      });

    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        logger.debug('[usePushNotifications] Notification received:', notification);
      }
    );

    // Listen for user tapping notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      logger.debug('[usePushNotifications] Notification tapped:', response);
      // TODO: Handle navigation based on notification data
      // For example, navigate to challenge detail if notification contains challengeId
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [userId]);
}

async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token: string | undefined;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      logger.warn('[usePushNotifications] Failed to get push token - permission denied');
      return;
    }

    try {
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: '5ab78094-cdc6-4004-b56c-ad603729ba6a',
        })
      ).data;
      logger.debug('[usePushNotifications] Push token obtained:', token);
    } catch (error) {
      logger.error('[usePushNotifications] Error getting push token:', error);
    }
  } else {
    logger.warn('[usePushNotifications] Must use physical device for Push Notifications');
  }

  return token;
}

async function sendPushTokenToServer(token: string) {
  try {
    logger.debug('[usePushNotifications] Sending push token to server...');
    await apiClient.post(`${API_HOST}/api/users/push-token`, { token });
    logger.debug('[usePushNotifications] Push token sent successfully');
  } catch (error) {
    logger.error('[usePushNotifications] Failed to send push token to server:', error);
    // Don't throw - this is not critical for app functionality
  }
}
