# Expo Config Plugins

This directory contains custom Expo config plugins for the Trybe mobile app.

## withFixPodScriptPhase.js

### Problem

When building the iOS app, Xcode shows the following warning:

```
Run script phase '[CP-User] [RN]Check rncore' will be run during every build
because it does not specify any outputs. To address this issue, either add output
dependencies to the script phase, or configure it to run in every build by unchecking
"Based on dependency analysis" in the script phase. (in target 'React-Fabric' from project 'Pods')
```

This warning appears because React Native's CocoaPods setup includes script phases that don't declare their output files, causing Xcode to assume they need to run on every build regardless of whether inputs changed.

### Solution

This plugin automatically fixes the warning by:

1. Locating the `[CP-User] [RN]Check rncore` script phase in the Pods project
2. Adding an `outputPaths` array to the script phase configuration
3. Declaring a dummy output file path: `$(DERIVED_FILE_DIR)/rncore-check.txt`

By declaring an output path, Xcode can properly track whether the script needs to re-run based on dependency analysis, eliminating the warning.

### How It Works

The plugin runs during the `expo prebuild` process (or when EAS Build generates the native iOS project). It:

- Uses Expo's `withDangerousMod` API to access the iOS project after it's generated
- Reads the `Pods/Pods.xcodeproj/project.pbxproj` file
- Uses regex to find the script phase definition
- Inserts the `outputPaths` configuration
- Writes the modified project file back

### When It Runs

This plugin executes:
- During `npx expo prebuild`
- During EAS Build on Expo's cloud infrastructure
- Whenever the native iOS project is regenerated

### Configuration

The plugin is registered in `app.json`:

```json
{
  "expo": {
    "plugins": [
      ...
      "./plugins/withFixPodScriptPhase.js"
    ]
  }
}
```

### Requirements

- `@expo/config-plugins` (installed as a devDependency)
- Expo SDK 48+

### Testing

After adding this plugin:

1. Clean your build:
   ```bash
   rm -rf ios/Pods ios/build
   ```

2. Regenerate the iOS project:
   ```bash
   npx expo prebuild --clean
   ```

3. Build in Xcode or run:
   ```bash
   npx expo run:ios
   ```

The warning should no longer appear in the build output.

### References

- [React Native Issue #36762](https://github.com/facebook/react-native/issues/36762)
- [Expo Config Plugins Documentation](https://docs.expo.dev/config-plugins/introduction/)
