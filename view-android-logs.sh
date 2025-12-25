#!/bin/bash
# View React Native/JavaScript logs from Android emulator
adb logcat -c  # Clear previous logs
adb logcat | grep -E "(ReactNativeJS|ReactNative|JS|Error|Exception|FATAL)"
