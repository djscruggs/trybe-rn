export const API_HOST =
  process.env.NODE_ENV === 'production' ? 'https://app.jointhetrybe.com' : 'http://localhost:3000';

export const CLERK_PUBLISHABLE_KEY =
  process.env.NODE_ENV === 'production'
    ? 'pk_live_Y2xlcmsuam9pbnRoZXRyeWJlLmNvbSQ'
    : 'pk_test_b3B0aW11bS1yYXktODcuY2xlcmsuYWNjb3VudHMuZGV2JA';
