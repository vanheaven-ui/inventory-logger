// plugins/withAndroidExcludes.js
const { withAppBuildGradle } = require("@expo/config-plugins");

function withAndroidExcludes(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      throw new Error(
        "Cannot add Android customizations to non-Groovy build.gradle"
      );
    }

    let buildGradleContent = config.modResults.contents;

    // Define ALL packagingOptions content to be injected/merged
    const pickFirstRules = `
            pickFirst 'META-INF/androidx.localbroadcastmanager_localbroadcastmanager.version'
            pickFirst 'META-INF/androidx.customview_customview.version'
            pickFirst 'META-INF/androidx.legacy_legacy-support-core-ui.version'
            pickFirst 'META-INF/androidx.activity_activity.version'
            pickFirst 'META-INF/androidx.fragment_fragment.version'
            pickFirst 'META-INF/androidx.legacy_legacy-support-core-utils.version'
            pickFirst 'META-INF/androidx.coordinatorlayout_coordinatorlayout.version'
            pickFirst 'META-INF/androidx.drawerlayout_drawerlayout.version'
            pickFirst 'META-INF/androidx.appcompat_appcompat.version' // <--- ADDED THIS NEW LINE!
            // Add more 'pickFirst' lines here as new META-INF conflicts appear.
    `;

    // 1. Construct the complete, desired packagingOptions block.
    const newPackagingOptionsBlock = `
    packagingOptions {
        jniLibs {
            useLegacyPackaging (findProperty('expo.useLegacyPackaging')?.toBoolean() ?: false)
        }
        ${pickFirstRules}
    }
    `;

    // 2. Remove any existing packagingOptions block within the 'android' block.
    const androidBlockRegex = /(android\s*\{[\s\S]*?\})/s;
    let androidBlockMatch = buildGradleContent.match(androidBlockRegex);

    if (androidBlockMatch) {
      let androidBlockContent = androidBlockMatch[1]; // Get the full matched 'android { ... }' block including braces

      // Remove any existing packagingOptions block from the content of the android block
      const packagingOptionsInAndroidRegex = /packagingOptions\s*\{[\s\S]*?\}/g;
      let replacedCount = 0;
      androidBlockContent = androidBlockContent.replace(
        packagingOptionsInAndroidRegex,
        (match) => {
          console.log(
            "Expo Config Plugin: Removing existing packagingOptions inside 'android' block."
          );
          replacedCount++;
          return ""; // Remove it
        }
      );
      if (replacedCount > 0) {
        console.log(
          `Expo Config Plugin: Removed ${replacedCount} existing packagingOptions blocks.`
        );
      } else {
        console.log(
          "Expo Config Plugin: No existing packagingOptions found inside 'android' block."
        );
      }

      // Insert the newPackagingOptionsBlock just before the last '}' of the android block content.
      const lastBraceIndex = androidBlockContent.lastIndexOf("}");
      androidBlockContent =
        androidBlockContent.substring(0, lastBraceIndex) +
        `\n${newPackagingOptionsBlock}\n` +
        androidBlockContent.substring(lastBraceIndex);

      // Replace the old android block with the modified one in the full file content
      buildGradleContent = buildGradleContent.replace(
        androidBlockRegex,
        androidBlockContent
      );
      console.log(
        "Expo Config Plugin: Successfully injected new packagingOptions block into 'android' block."
      );
    } else {
      console.warn(
        "Expo Config Plugin: Could not find 'android { }' block in build.gradle. Cannot inject packagingOptions."
      );
    }

    // 3. Ensure configurations.all { exclude ... } block is present and contains all necessary excludes.
    const requiredExcludeRules = `
    exclude group: 'com.android.support', module: 'support-compat'
    exclude group: 'com.android.support', module: 'versionedparcelable'
    exclude group: 'com.android.support', module: 'support-core-ui'
    exclude group: 'com.android.support', module: 'support-fragment'
    exclude group: 'com.android.support', module: 'support-activity'
    exclude group: 'com.android.support', module: 'support-core-utils'
    exclude group: 'com.android.support', module: 'coordinatorlayout'
    exclude group: 'com.android.support', module: 'drawerlayout'
    exclude group: 'com.android.support', module: 'appcompat-v7' // <--- ADDED THIS NEW LINE!
    `;
    const fullConfigurationsAllBlock = `
configurations.all {
    ${requiredExcludeRules}
}
`;
    // Remove any existing configurations.all block to replace it with our full version
    const configurationsAllRegex = /(configurations\.all\s*\{[\s\S]*?\})/gs;
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
