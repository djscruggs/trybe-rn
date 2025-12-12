#!/bin/bash
# Android Log Viewer for Trybe App
# This script shows real-time Android logs filtered for your app

echo "📱 Starting Android log viewer..."
echo "Press Ctrl+C to stop"
echo "----------------------------------------"

# Use adb from Android SDK
ADB="$ANDROID_HOME/platform-tools/adb"

# Clear old logs
$ADB logcat -c

# Stream logs with relevant filters
$ADB logcat -v time | grep -E "(ReactNative|Expo|trybe|FATAL|AndroidRuntime|expo-updates|ExpoModulesCore|ERROR)" --color=always
