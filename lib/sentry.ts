import * as Sentry from '@sentry/react-native';

// Initialize Sentry
// You'll need to set EXPO_PUBLIC_SENTRY_DSN in your environment variables
// Get your DSN from https://sentry.io/settings/trybe/projects/trybe-mobile/keys/
export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  // Only initialize if DSN is provided
  if (!dsn) {
    console.log('⚠️ Sentry DSN not configured - skipping initialization');
    return;
  }

  Sentry.init({
    dsn,
    // Set environment based on build type
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    // Enable automatic session tracking
    enableAutoSessionTracking: true,
    // For testing, we'll capture 100% of errors. Adjust in production.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    // Capture replays for session debugging
    _experiments: {
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    },
    // Automatically capture navigation breadcrumbs
    integrations: [
      new Sentry.ReactNativeTracing({
        routingInstrumentation: Sentry.reactNavigationIntegration(),
      }),
    ],
  });

  console.log('✅ Sentry initialized');
}

// Helper to manually capture errors with context
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

// Helper to capture messages/logs
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, level);
}

// Helper to set user context
export function setUser(user: { id: string; email?: string; username?: string } | null) {
  Sentry.setUser(user);
}
