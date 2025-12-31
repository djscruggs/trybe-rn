# Trybe Mobile App - Testing Guide

Thank you for helping test the Trybe mobile app! This guide will help you install the app and provide valuable feedback.

## Installation

### iOS (via TestFlight)

1. **Install TestFlight** from the App Store if you don't have it
2. **Check your email** for the TestFlight invitation
3. **Tap the invitation link** - it will open TestFlight
4. **Tap "Install"** to download the Trybe app
5. **Open the app** from your home screen

Requirements: iOS 13 or later

### Android (via APK)

1. **Enable installation from unknown sources**:

   - Go to Settings → Security (or Apps & notifications)
   - Enable "Install unknown apps" or "Unknown sources"
   - Allow your browser or file manager to install apps

2. **Download the APK** from the link provided

3. **Open the downloaded file** and tap "Install"

4. **Open the app** from your home screen

Requirements: Android 5.0 or later

## What to Test

Please test the following features and flows:

### 1. Account Creation & Login

- [ ] Sign up for a new account
- [ ] Verify email works
- [ ] Log out and log back in
- [ ] Test "Forgot Password" flow

### 2. Browse Challenges

- [ ] View list of active challenges
- [ ] Tap on a challenge to view details
- [ ] Navigate between About/Program/Progress tabs
- [ ] Check if images load properly
- [ ] Test scrolling through challenge descriptions

### 3. Join a Challenge

- [ ] Join a challenge
- [ ] Verify you see the challenge in "My Challenges"
- [ ] Set notification preferences
- [ ] Test the onboarding flow

### 4. Check-ins

- [ ] Tap "Check In" button on a challenge you've joined
- [ ] Write a check-in message
- [ ] Add a photo to your check-in
- [ ] Submit the check-in
- [ ] Verify the check-in appears in your progress
- [ ] Test removing a photo before submitting

### 5. Progress Tracking

- [ ] View your progress chart
- [ ] Check if check-ins are displayed correctly
- [ ] Verify dates and streaks are accurate

### 6. Profile & Settings

- [ ] View your profile
- [ ] Edit profile information
- [ ] Upload/change profile picture
- [ ] Test notification settings

### 7. General App Experience

- [ ] Test app navigation (back buttons, tab switching)
- [ ] Try rotating the device
- [ ] Test on slow/spotty internet connection
- [ ] Check if app works offline (gracefully handles no connection)
- [ ] Lock/unlock device while app is open
- [ ] Minimize app and return to it

## How to Report Issues

When you find a bug or something doesn't work as expected, please provide:

### Required Information

1. **What happened**: Describe what went wrong
2. **What you expected**: What you thought should happen
3. **Steps to reproduce**: Exact steps to make it happen again
4. **Screenshot**: If possible, take a screenshot

### Example Bug Report

```
ISSUE: Check-in button doesn't work on Challenge Details page

EXPECTED: Tapping "Check In" should open the check-in modal

STEPS TO REPRODUCE:
1. Open app and log in
2. Go to "Active Challenges"
3. Tap on "30-Day Meditation Challenge"
4. Tap "Check In" button
5. Nothing happens

DEVICE: iPhone 12, iOS 17.2
SCREENSHOT: [attached]
```

### How to Submit Bug Reports

**Option 1: Email**
Send bug reports to: [your-email@example.com]

**Option 2: Take a Screenshot**

- iOS: Press Side Button + Volume Up
- Android: Press Power + Volume Down

Then email the screenshot with your description.

**Option 3: Use the App (if shake-to-report is enabled)**

- Shake your device
- Fill out the feedback form
- Crashes are automatically reported

## Known Issues

Current known issues (you don't need to report these):

- None yet! You're the first tester!

## Testing Tips

- **Test Edge Cases**: Try unusual inputs, long text, special characters
- **Test Error Scenarios**: Try without internet, with invalid inputs, etc.
- **Be Thorough**: Click on everything, try to break things!
- **Take Notes**: Keep track of what you're testing
- **Fresh Eyes**: Pretend you've never seen the app before

## Questions or Need Help?

If you have questions or need help:

- **Email**: [your-email@example.com]
- **Response time**: Usually within 24 hours

## Privacy & Data

- This is a test build using real production data
- Your test account and data are real
- Don't share sensitive information during testing
- Test builds expire after 90 days (you'll be notified)

## Thank You!

Your feedback is invaluable in making Trybe better for everyone. We appreciate you taking the time to test and report issues!

---

**Version**: Preview Build
**Last Updated**: 2025-12-30
