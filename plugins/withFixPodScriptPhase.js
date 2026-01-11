const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to fix CocoaPods script phase warnings in React Native.
 *
 * This plugin adds output file dependencies to the '[CP-User] [RN]Check rncore'
 * script phase to prevent Xcode from showing warnings during build.
 *
 * Warning being fixed:
 * "Run script phase '[CP-User] [RN]Check rncore' will be run during every build
 * because it does not specify any outputs."
 */
const withFixPodScriptPhase = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podsProjectPath = path.join(
        config.modRequest.platformProjectRoot,
        'Pods',
        'Pods.xcodeproj',
        'project.pbxproj'
      );

      // Check if Pods project exists
      if (!fs.existsSync(podsProjectPath)) {
        console.log('Pods project not found, skipping script phase fix');
        return config;
      }

      let projectContent = fs.readFileSync(podsProjectPath, 'utf8');

      // Find the script phase for '[CP-User] [RN]Check rncore'
      // This regex looks for the script phase block
      const scriptPhaseRegex = /("?\[CP-User\] \[RN\]Check rncore"?\s*;\s*shellScript\s*=\s*"[^"]*";\s*)(showEnvVarsInLog\s*=\s*0;)/g;

      // Add outputPaths right after shellScript and before showEnvVarsInLog
      const fixedContent = projectContent.replace(
        scriptPhaseRegex,
        (match, before, after) => {
          // Check if outputPaths already exists
          if (before.includes('outputPaths')) {
            return match; // Already fixed
          }

          // Add outputPaths array with a dummy output file
          return `${before}outputPaths = (\n\t\t\t\t"$(DERIVED_FILE_DIR)/rncore-check.txt",\n\t\t\t);\n\t\t\t${after}`;
        }
      );

      // Only write if changes were made
      if (fixedContent !== projectContent) {
        fs.writeFileSync(podsProjectPath, fixedContent, 'utf8');
        console.log('✅ Fixed CocoaPods script phase warnings');
      } else {
        console.log('ℹ️  Script phase already fixed or pattern not found');
      }

      return config;
    },
  ]);
};

module.exports = withFixPodScriptPhase;
