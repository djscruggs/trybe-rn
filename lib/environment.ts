// Using ADB reverse port forwarding for Android emulator
// Run: adb reverse tcp:3000 tcp:3000
// This allows both iOS and Android to use localhost
// For development, set EXPO_PUBLIC_API_HOST in .env.development
export const API_HOST =
  process.env.NODE_ENV === 'production'
    ? 'https://app.jointhetrybe.com'
    : process.env.EXPO_PUBLIC_API_HOST || 'http://localhost:3000';

// Log API_HOST for debugging (only in development)
if (process.env.NODE_ENV !== 'production' && typeof console !== 'undefined') {
  console.log('🔗 API_HOST:', API_HOST);
}

export const CLERK_PUBLISHABLE_KEY =
  process.env.NODE_ENV === 'production'
    ? 'pk_live_Y2xlcmsuam9pbnRoZXRyeWJlLmNvbSQ'
    : process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
      'pk_test_b3B0aW11bS1yYXktODcuY2xlcmsuYWNjb3VudHMuZGV2JA';

export const PUSHER_KEY = process.env.EXPO_PUBLIC_PUSHER_KEY;
export const PUSHER_CLUSTER = process.env.EXPO_PUBLIC_PUSHER_CLUSTER || 'us2';
