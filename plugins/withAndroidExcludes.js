// plugins/withAndroidCustomizations.js
const { withAppBuildGradle } = require("@expo/config-plugins");

function withAndroidCustomizations(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === "groovy") {
      let buildGradleContent = config.modResults.contents;

      // 1. Remove packagingOptions from defaultConfig to avoid incorrect placement
      // This regex captures the defaultConfig block and then tries to remove any packagingOptions inside it.
      // It's crucial this works, so we'll log if it attempts to remove.
      const initialContent = buildGradleContent;
      buildGradleContent = buildGradleContent.replace(
        /(defaultConfig\s*\{[^}]*?)(\s*packagingOptions\s*\{[^}]*?\})([^}]*?\})/s,
        (
          match,
          beforePackagingOptions,
          packagingOptionsBlock,
          afterPackagingOptions
        ) => {
          console.log(
            "Expo Config Plugin: Removing packagingOptions from defaultConfig."
          );
          return beforePackagingOptions + afterPackagingOptions; // Reconstruct without the inner packagingOptions
        }
      );
      if (initialContent !== buildGradleContent) {
        console.log(
          "Expo Config Plugin: Successfully removed packagingOptions from defaultConfig."
        );
      } else {
        console.log(
          "Expo Config Plugin: No packagingOptions found in defaultConfig to remove (or regex did not match)."
        );
      }

      // Define ALL packagingOptions content to be injected/merged
      const newPackagingOptionsContent = `
            pickFirst 'META-INF/androidx.localbroadcastmanager_localbroadcastmanager.version'
            pickFirst 'META-INF/androidx.customview_customview.version'
            pickFirst 'META-INF/androidx.legacy_legacy-support-core-ui.version' // <--- ADD THIS NEW LINE!
            // Add other resource conflicts here if they appear later
            // pickFirst 'META-INF/some_other_conflicting_file.version'
      `;

      // 2. Find the top-level 'android {' block and either inject or merge packagingOptions
      const androidBlockInsertionRegex = /(android\s*\{[^}]*?\})/s;

      if (buildGradleContent.match(androidBlockInsertionRegex)) {
        buildGradleContent = buildGradleContent.replace(
          androidBlockInsertionRegex,
          (androidBlockMatch) => {
            const topLevelPackagingOptionsRegex =
              /packagingOptions\s*\{[^}]*?\}/s;
            if (androidBlockMatch.match(topLevelPackagingOptionsRegex)) {
              // If it exists, find it and insert new rules inside it
              console.log(
                "Expo Config Plugin: Merging into existing top-level packagingOptions."
              );
              return androidBlockMatch.replace(
                topLevelPackagingOptionsRegex,
                (packagingOptionsMatch) => {
                  // Ensure jniLibs is preserved if it was already there
                  let existingJniLibs = "";
                  const jniLibsMatch =
                    packagingOptionsMatch.match(/jniLibs\s*\{[^}]*?\}/s);
                  if (jniLibsMatch) {
                    existingJniLibs = jniLibsMatch[0];
                  }

                  // Remove any old pickFirst rules to avoid duplication within the same block
                  let cleanedPackagingOptionsMatch = packagingOptionsMatch
                    .replace(
                      /pickFirst\s*'META-INF\/androidx\.localbroadcastmanager_localbroadcastmanager\.version'/g,
                      ""
                    )
                    .replace(
                      /pickFirst\s*'META-INF\/androidx\.customview_customview\.version'/g,
                      ""
                    )
                    .replace(
                      /pickFirst\s*'META-INF\/androidx\.legacy_legacy-support-core-ui\.version'/g,
                      ""
                    );

                  const lastBraceIndex =
                    cleanedPackagingOptionsMatch.lastIndexOf("}");
                  return (
                    cleanedPackagingOptionsMatch.substring(0, lastBraceIndex) +
                    newPackagingOptionsContent +
                    cleanedPackagingOptionsMatch.substring(lastBraceIndex)
                  );
                }
              );
            } else {
              // If it doesn't exist, create a new top-level packagingOptions block
              // and insert it before the closing brace of the android block.
              console.log(
                "Expo Config Plugin: Creating new top-level packagingOptions."
              );
              const lastBraceIndex = androidBlockMatch.lastIndexOf("}");
              return (
                androidBlockMatch.substring(0, lastBraceIndex) +
                `
    packagingOptions {
        jniLibs {
            useLegacyPackaging (findProperty('expo.useLegacyPackaging')?.toBoolean() ?: false)
        }
        ${newPackagingOptionsContent}
    }
                          ` +
                androidBlockMatch.substring(lastBraceIndex)
              );
            }
          }
        );
      } else {
        console.warn(
          "Expo Config Plugin: Could not find 'android { }' block in build.gradle. Cannot inject packagingOptions."
        );
      }

      // 3. Ensure configurations.all { exclude ... } block is present (at the end of the file)
      const excludeClassBlock = `
configurations.all {
    exclude group: 'com.android.support', module: 'support-compat'
    exclude group: 'com.android.support', module: 'versionedparcelable'
    // You might need to add more exclusions here for other legacy support libraries if they cause issues.
    // exclude group: 'com.android.support', module: 'support-core-ui' // Consider this if you still get issues
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
