// plugins/withAndroidExcludes.js
const { withAppBuildGradle } = require("@expo/config-plugins");

function withAndroidPackagingOptions(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === "groovy") {
      // --- BEGIN previous 'exclude' block for duplicate classes ---
      const excludeClassBlock = `
          configurations.all {
              exclude group: 'com.android.support', module: 'support-compat'
              exclude group: 'com.android.support', module: 'versionedparcelable'
              // Add other specific duplicate class modules from your error log as needed
          }
          `;
      // --- END previous 'exclude' block ---

      // --- NEW: packagingOptions block for duplicate resources ---
      const packagingOptionsBlock = `
          packagingOptions {
              // This tells Gradle to pick the first one it finds for this specific file.
              // Since you're on AndroidX, the androidx version will likely be picked first,
              // or at least it resolves the conflict.
              pickFirst 'META-INF/androidx.localbroadcastmanager_localbroadcastmanager.version'
              // Alternatively, you could exclude the old one explicitly:
              // exclude 'META-INF/com.android.support_localbroadcastmanager.version'
              // but pickFirst is generally safer for these version files.

              // You can also add a general rule to exclude all .version files
              // if you encounter more like this, but be cautious as it might hide
              // other legitimate version conflicts.
              // exclude 'META-INF/*.version'
          }
          `;
      // --- END NEW: packagingOptions block ---

      // Logic to insert blocks into the android { ... } section
      let newContents = config.modResults.contents;

      // Regex to find the 'android { ... }' block
      const androidBlockRegex = /(android\s*\{[^}]*?\})/s;

      if (newContents.match(androidBlockRegex)) {
        newContents = newContents.replace(androidBlockRegex, (match) => {
          // Insert the excludeClassBlock (from previous fix) right before the closing brace '}'
          let tempMatch =
            match.substring(0, match.lastIndexOf("}")) +
            excludeClassBlock +
            "}";

          // Now insert the packagingOptionsBlock into the modified tempMatch
          const innerAndroidBlockRegex = /(\{[^}]*?\})/s; // Regex for content inside the android block
          return tempMatch.replace(innerAndroidBlockRegex, (innerMatch) => {
            const innerLastBraceIndex = innerMatch.lastIndexOf("}");
            return (
              innerMatch.substring(0, innerLastBraceIndex) +
              packagingOptionsBlock +
              innerMatch.substring(innerLastBraceIndex)
            );
          });
        });
      } else {
        // Fallback: append if android block not found (less ideal)
        console.warn(
          "Could not find 'android { }' block in build.gradle. Appending exclude rules and packagingOptions to end of file."
        );
        newContents += excludeClassBlock;
        newContents += packagingOptionsBlock;
      }

      config.modResults.contents = newContents;
    } else {
      throw new Error(
        "Cannot add Android excludes/packagingOptions to non-groovy build.gradle"
      );
    }
    return config;
  });
}

module.exports = withAndroidPackagingOptions;
