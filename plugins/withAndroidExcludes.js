// plugins/withAndroidCustomizations.js
const { withAppBuildGradle } = require("@expo/config-plugins");

function withAndroidCustomizations(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === "groovy") {
      let buildGradleContent = config.modResults.contents;

      // Define ALL packagingOptions content to be injected/merged
      // Keep this consistent. If new errors appear, add to this list.
      const consolidatedPackagingOptionsContent = `
    packagingOptions {
        jniLibs {
            useLegacyPackaging (findProperty('expo.useLegacyPackaging')?.toBoolean() ?: false)
        }
        pickFirst 'META-INF/androidx.localbroadcastmanager_localbroadcastmanager.version'
        pickFirst 'META-INF/androidx.customview_customview.version'
        pickFirst 'META-INF/androidx.legacy_legacy-support-core-ui.version'
        pickFirst 'META-INF/androidx.activity_activity.version' // Common new conflict after fixing legacy-support-core-ui
        pickFirst 'META-INF/androidx.fragment_fragment.version' // Another common one
        // Add more 'pickFirst' lines here as new META-INF conflicts appear.
        // Example: pickFirst 'META-INF/another_conflicting_file.version'
    }
      `;

      // 1. Remove ALL existing packagingOptions blocks, regardless of their location
      // This regex tries to match any packagingOptions { ... } block
      // The 's' flag allows '.' to match newlines. The '*' is non-greedy.
      const packagingOptionsBlockRegex = /packagingOptions\s*\{[^}]*?\}/gs;
      let initialContent = buildGradleContent;
      buildGradleContent = buildGradleContent.replace(
        packagingOptionsBlockRegex,
        (match) => {
          console.log(
            "Expo Config Plugin: Removing an existing packagingOptions block."
          );
          return ""; // Replace the matched block with an empty string
        }
      );

      if (initialContent !== buildGradleContent) {
        console.log(
          "Expo Config Plugin: Successfully removed one or more packagingOptions blocks."
        );
      } else {
        console.log(
          "Expo Config Plugin: No packagingOptions blocks found to remove initially."
        );
      }

      // 2. Find the top-level 'android {' block and insert the consolidated packagingOptions
      const androidBlockInsertionRegex = /(android\s*\{[^}]*?\})/s; // Matches the entire android { ... } block

      if (buildGradleContent.match(androidBlockInsertionRegex)) {
        buildGradleContent = buildGradleContent.replace(
          androidBlockInsertionRegex,
          (androidBlockMatch) => {
            console.log(
              "Expo Config Plugin: Injecting consolidated packagingOptions into 'android' block."
            );
            // Insert the new block just before the closing brace of the android block
            const lastBraceIndex = androidBlockMatch.lastIndexOf("}");
            return (
              androidBlockMatch.substring(0, lastBraceIndex) +
              `\n${consolidatedPackagingOptionsContent}\n` + // Add newlines for formatting
              androidBlockMatch.substring(lastBraceIndex)
            );
          }
        );
      } else {
        console.warn(
          "Expo Config Plugin: Could not find 'android { }' block in build.gradle. Cannot inject packagingOptions."
        );
      }

      // 3. Ensure configurations.all { exclude ... } block is present (at the end of the file)
      // This block is less prone to conflicts, so its simple append logic is usually fine.
      const excludeClassBlock = `
configurations.all {
    exclude group: 'com.android.support', module: 'support-compat'
    exclude group: 'com.android.support', module: 'versionedparcelable'
    // Potentially add more exclusions here if issues persist related to 'com.android.support'
    // exclude group: 'com.android.support', module: 'support-core-ui' // Consider this if still getting core-ui issues
}
`;
      if (
        !buildGradleContent.includes(
          "exclude group: 'com.android.support', module: 'support-compat'"
        )
      ) {
        console.log(
          "Expo Config Plugin: Adding configurations.all exclude block."
        );
        buildGradleContent += excludeClassBlock;
      } else {
        console.log(
          "Expo Config Plugin: configurations.all exclude block already present."
        );
      }

      config.modResults.contents = buildGradleContent;
    } else {
      throw new Error(
        "Cannot add Android customizations to non-groovy build.gradle"
      );
    }
    return config;
  });
}

module.exports = withAndroidCustomizations;
