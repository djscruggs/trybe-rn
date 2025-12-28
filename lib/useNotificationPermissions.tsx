import { useEffect, useState } from 'react';
import { Platform, Alert, Linking, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';

import { logger } from './logger';

export function useNotificationPermissions() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Check notification permissions
  useEffect(() => {
    const checkNotifications = async () => {
      logger.debug('[useNotificationPermissions] Checking notification permissions...');

      if (Platform.OS === 'web') {
        logger.debug('[useNotificationPermissions] Platform is web, setting enabled to true');
        setNotificationsEnabled(true);
        return;
      }

      try {
        const { status } = await Notifications.getPermissionsAsync();
        logger.debug('[useNotificationPermissions] Current permission status:', status);
        setNotificationsEnabled(status === 'granted');
      } catch (error) {
        logger.error('[useNotificationPermissions] Error checking notification permissions:', error);
        setNotificationsEnabled(false);
      }
    };

    checkNotifications();

    // Re-check when app comes to foreground (e.g., after returning from Settings)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        logger.debug('[useNotificationPermissions] App became active, re-checking permissions');
        checkNotifications();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  /**
   * Request notification permissions and show appropriate alerts
   * Returns true if permissions are granted, false otherwise
   */
  const requestNotificationPermissions = async (): Promise<boolean> => {
    logger.debug('[useNotificationPermissions] requestNotificationPermissions called');
    logger.debug('[useNotificationPermissions] Platform:', Platform.OS);

    if (Platform.OS === 'web') {
      logger.debug('[useNotificationPermissions] Web platform, returning true');
      return true;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      logger.debug('[useNotificationPermissions] Existing permission status:', existingStatus);

      // If permissions are undetermined (never asked), request them
      if (existingStatus === 'undetermined') {
        logger.debug('[useNotificationPermissions] Status is undetermined, requesting permissions...');
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        logger.debug('[useNotificationPermissions] Permission request result:', newStatus);
        setNotificationsEnabled(newStatus === 'granted');

        if (newStatus !== 'granted') {
          logger.debug('[useNotificationPermissions] Permission denied, showing settings alert');
          showNotificationSettingsAlert();
          return false;
        }
        logger.debug('[useNotificationPermissions] Permission granted!');
        return true;
      } else if (existingStatus === 'denied') {
        logger.debug('[useNotificationPermissions] Permission previously denied, showing settings alert');
        // Permissions were previously denied, direct to settings
        showNotificationSettingsAlert();
        return false;
      } else if (existingStatus === 'granted') {
        logger.debug('[useNotificationPermissions] Permission already granted');
        setNotificationsEnabled(true);
        return true;
      }

      logger.debug('[useNotificationPermissions] Returning status:', existingStatus === 'granted');
      return existingStatus === 'granted';
    } catch (error) {
      logger.error('[useNotificationPermissions] Error requesting notification permissions:', error);
      return false;
    }
  };

  /**
   * Show alert prompting user to enable notifications in settings
   */
  const showNotificationSettingsAlert = () => {
    logger.debug('[useNotificationPermissions] Showing notification settings alert');
    Alert.alert(
      'Notifications Required',
      'This challenge requires notifications. Please enable them in your device settings.',
      [
        { text: 'OK', onPress: () => logger.debug('[useNotificationPermissions] User tapped OK') },
        {
          text: 'Open Settings',
          onPress: () => {
            logger.debug('[useNotificationPermissions] User tapped Open Settings');
            Linking.openSettings().catch((err) => {
              logger.error('[useNotificationPermissions] Failed to open settings:', err);
              Alert.alert(
                'Unable to Open Settings',
                'Please open your device Settings app manually and enable notifications for this app.'
              );
            });
          },
        },
      ]
    );
  };

  return {
    notificationsEnabled,
    requestNotificationPermissions,
    showNotificationSettingsAlert,
  };
}
