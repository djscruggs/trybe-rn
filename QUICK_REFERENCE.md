# Quick Reference - Remote Testing

## Build Commands

```bash
# Build for both platforms (recommended)
eas build --platform all --profile preview

# Build iOS only
eas build --platform ios --profile preview

# Build Android only
eas build --platform android --profile preview

# Check build status
eas build:list

# View build logs
eas build:view [build-id]
```

## Before Building Checklist

- [ ] All code changes committed to git
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] App runs locally: `npx expo start`
- [ ] Sentry DSN configured in `.env.preview` (optional)
- [ ] Production API is accessible: `curl https://app.jointhetrybe.com/api/challenges/active`

## After Build Checklist

### iOS

- [ ] Download IPA from EAS dashboard
- [ ] Upload to App Store Connect → TestFlight
- [ ] Add tester email in TestFlight
- [ ] Wait for processing (~5-10 minutes)
- [ ] Tester receives invitation email
- [ ] Send `TESTER_GUIDE.md` to tester

### Android

- [ ] Download APK from EAS dashboard
- [ ] Share APK file with tester (email/Drive/Dropbox)
- [ ] Send installation instructions from `TESTER_GUIDE.md`

## Monitor & Debug

```bash
# View app logs (if using EAS Update)
eas update:view

# Check credentials
eas credentials

# View project info
eas project:info
```

## Sentry Setup

1. Create project: https://sentry.io/organizations/trybe/projects/new/
2. Get DSN: Project Settings → Client Keys (DSN)
3. Add to `.env.preview`:
   ```
   EXPO_PUBLIC_SENTRY_DSN=https://[key]@sentry.io/[project-id]
   ```
4. Commit `.env.preview` to private repo or use EAS Secrets:
   ```bash
   eas secret:create --name EXPO_PUBLIC_SENTRY_DSN --value "https://..."
   ```

## Common Issues

| Issue                          | Solution                                |
| ------------------------------ | --------------------------------------- |
| Build fails                    | Check logs: `eas build:view [build-id]` |
| TypeScript errors              | Run `npx tsc --noEmit`                  |
| Missing credentials            | Run `eas credentials`                   |
| API not accessible             | Check network, verify API URL           |
| Tester can't install (iOS)     | Check TestFlight invitation sent        |
| Tester can't install (Android) | Enable "Unknown Sources"                |

## File Structure

```
.env.development     → Local dev (localhost API)
.env.preview        → Testing builds (production API)
eas.json            → Build configurations
app.json            → App metadata & config
REMOTE_TESTING_SETUP.md → Full setup guide (this is for you)
TESTER_GUIDE.md     → Send this to testers
```

## Environment Variables

| Variable                          | Development    | Preview              | Production           |
| --------------------------------- | -------------- | -------------------- | -------------------- |
| EXPO_PUBLIC_API_HOST              | localhost:3000 | app.jointhetrybe.com | app.jointhetrybe.com |
| EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY | pk*test*...    | pk*live*...          | pk*live*...          |
| EXPO_PUBLIC_SENTRY_DSN            | (optional)     | (recommended)        | (required)           |
| NODE_ENV                          | development    | production           | production           |

## Emergency Commands

```bash
# Cancel a running build
eas build:cancel [build-id]

# Clear credentials and start over
eas credentials --clear

# Reset EAS project
eas init --force

# View all secrets
eas secret:list
```

## Cost Check

- View build usage: https://expo.dev/accounts/[your-account]/settings/billing
- Sentry usage: https://sentry.io/settings/trybe/billing/
- TestFlight: Free (requires Apple Developer account)

## Quick Links

- EAS Dashboard: https://expo.dev/accounts/[your-account]/projects/trybe-rn
- Sentry: https://sentry.io/organizations/trybe/projects/trybe-mobile/
- App Store Connect: https://appstoreconnect.apple.com
- Expo Documentation: https://docs.expo.dev/eas/

## Update Build

When you fix bugs and need to send a new build:

```bash
# 1. Make code changes
# 2. Test locally: npx expo start
# 3. Commit changes: git commit -am "fix: description"
# 4. Build: eas build --platform all --profile preview
# 5. Download and redistribute to tester
```

The version number auto-increments, so tester can see they have the latest build.
