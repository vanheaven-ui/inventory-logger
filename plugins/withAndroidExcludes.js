// plugins/withAndroidCustomizations.js
const { withAppBuildGradle } = require("@expo/config-plugins");

function withAndroidCustomizations(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === "groovy") {
      let buildGradleContent = config.modResults.contents;

      // 1. Add the configurations.all { exclude ... } block (for class duplicates)
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

      // 2. Add the packagingOptions block (for resource duplicates)
      const packagingOptionsBlock = `
          packagingOptions {
              // Existing rule for localbroadcastmanager
              pickFirst 'META-INF/androidx.localbroadcastmanager_localbroadcastmanager.version'
              // NEW RULE for customview
              pickFirst 'META-INF/androidx.customview_customview.version'
              // Add other resource conflicts here if they appear later
              // pickFirst 'META-INF/some_other_conflicting_file.version'
          }
      `;

      const androidBlockInsertionRegex = /(android\s*\{[^}]*?\})/s;

      if (buildGradleContent.match(androidBlockInsertionRegex)) {
        buildGradleContent = buildGradleContent.replace(
          androidBlockInsertionRegex,
          (match) => {
            const lastBraceIndex = match.lastIndexOf("}");
            return (
              match.substring(0, lastBraceIndex) +
              packagingOptionsBlock +
              match.substring(lastBraceIndex)
            );
          }
        );
      } else {
        console.warn(
          "Could not find 'android { }' block in build.gradle. Appending packagingOptions block to end of file."
        );
        buildGradleContent += packagingOptionsBlock;
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
