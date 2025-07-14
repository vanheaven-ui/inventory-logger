// plugins/withAndroidCustomizations.js
const { withAppBuildGradle } = require("@expo/config-plugins");

function withAndroidCustomizations(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === "groovy") {
      let buildGradleContent = config.modResults.contents;

      // 1. Remove packagingOptions from defaultConfig to avoid incorrect placement
      // This regex captures the defaultConfig block and then tries to remove any packagingOptions inside it.
      buildGradleContent = buildGradleContent.replace(
        /(defaultConfig\s*\{[^}]*?)packagingOptions\s*\{[^}]*?\}([^}]*?\})/s,
        (match, beforePackagingOptions, afterPackagingOptions) => {
          console.log("Removing packagingOptions from defaultConfig.");
          return beforePackagingOptions + afterPackagingOptions; // Reconstruct without the inner packagingOptions
        }
      );

      // 2. Define the packagingOptions content to be injected/merged
      const newPackagingOptionsContent = `
            pickFirst 'META-INF/androidx.localbroadcastmanager_localbroadcastmanager.version'
            pickFirst 'META-INF/androidx.customview_customview.version'
            // Add other resource conflicts here if they appear later
            // pickFirst 'META-INF/some_other_conflicting_file.version'
      `;

      // 3. Find the top-level 'android {' block and either inject or merge packagingOptions
      const androidBlockInsertionRegex = /(android\s*\{[^}]*?\})/s;

      if (buildGradleContent.match(androidBlockInsertionRegex)) {
        buildGradleContent = buildGradleContent.replace(
          androidBlockInsertionRegex,
          (androidBlockMatch) => {
            // Check if a packagingOptions block already exists at the top level
            const topLevelPackagingOptionsRegex =
              /packagingOptions\s*\{[^}]*?\}/s;
            if (androidBlockMatch.match(topLevelPackagingOptionsRegex)) {
              // If it exists, find it and insert new rules inside it
              return androidBlockMatch.replace(
                topLevelPackagingOptionsRegex,
                (packagingOptionsMatch) => {
                  const lastBraceIndex = packagingOptionsMatch.lastIndexOf("}");
                  return (
                    packagingOptionsMatch.substring(0, lastBraceIndex) +
                    newPackagingOptionsContent +
                    packagingOptionsMatch.substring(lastBraceIndex)
                  );
                }
              );
            } else {
              // If it doesn't exist, create a new top-level packagingOptions block
              // and insert it before the closing brace of the android block.
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
          "Could not find 'android { }' block in build.gradle. Cannot inject packagingOptions."
        );
      }

      // 4. Ensure configurations.all { exclude ... } block is present (at the end of the file)
      const excludeClassBlock = `
configurations.all {
    exclude group: 'com.android.support', module: 'support-compat'
    exclude group: 'com.android.support', module: 'versionedparcelable'
}
`;
      if (
        !buildGradleContent.includes(
          "exclude group: 'com.android.support', module: 'support-compat'"
        )
      ) {
        buildGradleContent += excludeClassBlock;
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
