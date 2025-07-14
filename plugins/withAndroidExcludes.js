// plugins/withAndroidExcludes.js
const { withAppBuildGradle } = require("@expo/config-plugins");

function withAndroidExcludes(config) {
  // Renamed function to match file name
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      throw new Error(
        "Cannot add Android customizations to non-Groovy build.gradle"
      );
    }

    let buildGradleContent = config.modResults.contents;

    // Define ALL packagingOptions content to be injected/merged
    // Keep adding new 'pickFirst' rules here as new META-INF conflicts appear.
    const pickFirstRules = `
            pickFirst 'META-INF/androidx.localbroadcastmanager_localbroadcastmanager.version'
            pickFirst 'META-INF/androidx.customview_customview.version'
            pickFirst 'META-INF/androidx.legacy_legacy-support-core-ui.version'
            pickFirst 'META-INF/androidx.activity_activity.version'
            pickFirst 'META-INF/androidx.fragment_fragment.version'
            pickFirst 'META-INF/androidx.legacy_legacy-support-core-utils.version' // <--- ADDED THIS CRITICAL LINE!
            pickFirst 'META-INF/androidx.coordinatorlayout_coordinatorlayout.version' // Common additional one
            pickFirst 'META-INF/androidx.drawerlayout_drawerlayout.version' // Common additional one
            // Add more 'pickFirst' lines here as new META-INF conflicts appear.
            // Example: pickFirst 'META-INF/another_conflicting_file.version'
    `;

    // 1. Define the complete, desired packagingOptions block content
    // This will be inserted or used to replace existing packagingOptions.
    const newPackagingOptionsBlock = `
    // Expo Config Plugin - custom packagingOptions start
    packagingOptions {
        jniLibs {
            useLegacyPackaging (findProperty('expo.useLegacyPackaging')?.toBoolean() ?: false)
        }
        ${pickFirstRules}
    }
    // Expo Config Plugin - custom packagingOptions end
    `;

    // 2. Remove ALL existing packagingOptions blocks first to prevent duplicates.
    // This regex attempts to find any packagingOptions {...} block.
    // The 's' flag allows '.' to match newlines. The '*' is non-greedy.
    // We explicitly avoid matching the comment lines here to target just the Gradle block.
    const packagingOptionsBlockRegex = /(packagingOptions\s*\{[^}]*?\})/gs;

    let hasRemovedOldPackagingOptions = false;
    buildGradleContent = buildGradleContent.replace(
      packagingOptionsBlockRegex,
      (match) => {
        console.log(
          "Expo Config Plugin: Removing an existing packagingOptions block for clean re-insertion."
        );
        hasRemovedOldPackagingOptions = true;
        return ""; // Replace the matched block with an empty string
      }
    );
    if (hasRemovedOldPackagingOptions) {
      console.log(
        "Expo Config Plugin: Successfully removed one or more packagingOptions blocks."
      );
    } else {
      console.log(
        "Expo Config Plugin: No existing packagingOptions blocks found to remove initially."
      );
    }

    // 3. Find the 'android {' block and insert the consolidated packagingOptions
    // This regex is crucial for identifying the correct insertion point without malforming the file.
    // It tries to capture the entire 'android' block content, handling nested braces better.
    const androidBlockRegex = /(android\s*\{[\s\S]*?\})/s;

    if (buildGradleContent.match(androidBlockRegex)) {
      buildGradleContent = buildGradleContent.replace(
        androidBlockRegex,
        (androidBlockMatch) => {
          console.log(
            "Expo Config Plugin: Injecting/replacing consolidated packagingOptions into 'android' block."
          );
          // Insert the new block just before the last '}' of the android block
          const lastBraceIndex = androidBlockMatch.lastIndexOf("}");
          return (
            androidBlockMatch.substring(0, lastBraceIndex) +
            `\n${newPackagingOptionsBlock}\n` + // Add newlines for formatting
            androidBlockMatch.substring(lastBraceIndex)
          );
        }
      );
    } else {
      console.warn(
        "Expo Config Plugin: Could not find 'android { }' block in build.gradle. Cannot inject packagingOptions."
      );
    }

    // 4. Define the complete, desired configurations.all { exclude ... } content.
    // This will be used to replace any existing configurations.all block.
    const requiredExcludeRules = `
    exclude group: 'com.android.support', module: 'support-compat'
    exclude group: 'com.android.support', module: 'versionedparcelable'
    exclude group: 'com.android.support', module: 'support-core-ui'
    exclude group: 'com.android.support', module: 'support-fragment'
    exclude group: 'com.android.support', module: 'support-activity'
    exclude group: 'com.android.support', module: 'support-core-utils' // <--- ADDED THIS CRITICAL LINE!
    exclude group: 'com.android.support', module: 'coordinatorlayout' // Corresponding to new pickFirst
    exclude group: 'com.android.support', module: 'drawerlayout' // Corresponding to new pickFirst
    `;
    const fullConfigurationsAllBlock = `
configurations.all {
    ${requiredExcludeRules}
}
    `;
    // Remove any existing configurations.all block to replace it with our full version
    const configurationsAllRegex = /(configurations\.all\s*\{[^}]*?\})/gs;
    let hasRemovedConfigurationsAll = false;
    buildGradleContent = buildGradleContent.replace(
      configurationsAllRegex,
      (match) => {
        console.log(
          "Expo Config Plugin: Removing existing configurations.all block for clean re-insertion."
        );
        hasRemovedConfigurationsAll = true;
        return "";
      }
    );
    if (hasRemovedConfigurationsAll) {
      console.log(
        "Expo Config Plugin: Successfully removed existing configurations.all block."
      );
    } else {
      console.log(
        "Expo Config Plugin: No existing configurations.all block found to remove."
      );
    }

    // Append the complete, correct configurations.all block at the end of the file.
    console.log("Expo Config Plugin: Appending full configurations.all block.");
    buildGradleContent += `\n${fullConfigurationsAllBlock}\n`;

    config.modResults.contents = buildGradleContent;
    return config;
  });
}

module.exports = withAndroidExcludes;
