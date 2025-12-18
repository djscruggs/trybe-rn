// Using ADB reverse port forwarding for Android emulator
// Run: adb reverse tcp:3000 tcp:3000
// This allows both iOS and Android to use localhost
// For development, set EXPO_PUBLIC_API_HOST in .env.development
export const API_HOST =
  process.env.NODE_ENV === 'production'
    ? 'https://app.jointhetrybe.com'
    : process.env.EXPO_PUBLIC_API_HOST;

export const CLERK_PUBLISHABLE_KEY =
  process.env.NODE_ENV === 'production'
    ? 'pk_live_Y2xlcmsuam9pbnRoZXRyeWJlLmNvbSQ'
    : process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
      'pk_test_b3B0aW11bS1yYXktODcuY2xlcmsuYWNjb3VudHMuZGV2JA';
