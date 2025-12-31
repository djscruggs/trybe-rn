# Remote Testing Setup Guide

This guide explains how to build and distribute the Trybe mobile app to remote testers.

## Prerequisites

- [ ] EAS CLI installed: `npm install -g eas-cli`
- [ ] Logged into Expo: `eas login`
- [ ] (Optional) Sentry account set up for crash reporting

## Step 1: Configure Sentry (Optional but Recommended)

Sentry provides crash reporting and error tracking, making it much easier for testers to report bugs.

1. **Create a Sentry account** at https://sentry.io
2. **Create a new project** named "trybe-mobile"
3. **Get your DSN** from Project Settings → Client Keys (DSN)
4. **Add DSN to environment**:
   ```bash
   # Edit .env.preview
   EXPO_PUBLIC_SENTRY_DSN=https://your-actual-dsn@sentry.io/your-project-id
   ```

## Step 2: Build the App

### For iOS (TestFlight)

```bash
# Build for iOS
eas build --platform ios --profile preview

# This will:
# - Build the app using the 'preview' profile
# - Use production API (https://app.jointhetrybe.com)
# - Create an IPA file you can upload to TestFlight
# - Build takes ~15-20 minutes
```

**After build completes:**

1. Download the IPA from the EAS dashboard or use the link provided
2. Upload to App Store Connect for TestFlight distribution:
   - Go to https://appstoreconnect.apple.com
   - Select your app
   - Go to TestFlight tab
   - Upload the build
   - Add tester's email address
3. Tester will receive email invitation to test via TestFlight

### For Android (APK)

```bash
# Build for Android
eas build --platform android --profile preview

# This will:
# - Build an APK (not AAB, easier for testing)
# - Use production API
# - Build takes ~10-15 minutes
```

**After build completes:**

1. Download the APK from the EAS dashboard
2. Send the APK file directly to your tester via email/Dropbox/Google Drive
3. Tester needs to:
   - Enable "Install from Unknown Sources" on their Android device
   - Download and install the APK

### Build Both Platforms

```bash
# Build for both iOS and Android simultaneously
eas build --platform all --profile preview
```

## Step 3: Send Testing Instructions to Tester

Share the `TESTER_GUIDE.md` file with your tester. It contains:

- Installation instructions for their platform
- What to test
- How to report bugs
- Known issues

## Step 4: Monitor Crashes and Errors

If you set up Sentry:

1. Go to https://sentry.io/organizations/trybe/projects/trybe-mobile/
2. You'll see crashes and errors in real-time
3. Each error includes:
   - User information (if logged in)
   - Device information
   - Stack trace
   - Breadcrumb trail of actions before crash

## Common Issues & Solutions

### Build Fails

- Check EAS build logs in the dashboard
- Common issues:
  - Missing credentials: Run `eas credentials`
  - Invalid bundle identifier: Check `app.json`
  - TypeScript errors: Run `npx tsc --noEmit` locally first

### App Crashes on Startup

- Check Sentry for crash reports
- Verify environment variables in `.env.preview`
- Test production API is accessible: `curl https://app.jointhetrybe.com/api/challenges/active`

### Tester Can't Install (iOS)

- Ensure tester's email is added in TestFlight
- Check tester has iOS 13 or later
- Tester must accept TestFlight invitation email

### Tester Can't Install (Android)

- Ensure "Install from Unknown Sources" is enabled
- Check Android version is 5.0 or later
- Try installing via ADB: `adb install app.apk`

## Update Process

When you fix bugs and want to send a new build:

```bash
# Make your code changes
# Then rebuild:
eas build --platform all --profile preview

# Version is auto-incremented
# Send new build to tester
```

## Environment Configuration Summary

The app uses different configurations based on build profile:

| Profile     | API Host             | Clerk Keys | Sentry   | Distribution     |
| ----------- | -------------------- | ---------- | -------- | ---------------- |
| development | localhost:3000       | Test       | Optional | Local only       |
| preview     | app.jointhetrybe.com | Production | Yes      | Internal testing |
| production  | app.jointhetrybe.com | Production | Yes      | App stores       |

## Next Steps

1. [ ] Set up Sentry project
2. [ ] Add Sentry DSN to `.env.preview`
3. [ ] Run build: `eas build --platform all --profile preview`
4. [ ] Download build artifacts
5. [ ] Distribute to tester
6. [ ] Share `TESTER_GUIDE.md` with tester
7. [ ] Monitor Sentry for crashes

## Cost Considerations

- **EAS Build**: Free tier includes limited builds per month. Check https://expo.dev/pricing
- **TestFlight**: Free (requires Apple Developer account - $99/year)
- **Sentry**: Free tier covers ~5,000 events/month
- **Android APK distribution**: Free (just share the file)
