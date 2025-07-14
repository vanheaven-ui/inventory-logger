// plugins/withAndroidCustomizations.js
const { withAppBuildGradle } = require("@expo/config-plugins");

function withAndroidCustomizations(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === "groovy") {
      let buildGradleContent = config.modResults.contents;

      // 1. Ensure the configurations.all { exclude ... } block is present (outside android {})
      const excludeClassBlock = `
configurations.all {
    exclude group: 'com.android.support', module: 'support-compat'
    exclude group: 'com.android.support', module: 'versionedparcelable'
}
`;
      // Check if it already exists to avoid duplication
      if (
        !buildGradleContent.includes(
          "exclude group: 'com.android.support', module: 'support-compat'"
        )
      ) {
        buildGradleContent += excludeClassBlock; // Append at the end of the file
      }

      // 2. Add/merge packagingOptions for resource duplicates into the *correct* location
      // This regex looks for the top-level 'packagingOptions {' block within the 'android {' block
      const packagingOptionsBlockRegex =
        /(android\s*\{[^}]*?)(\bpackagingOptions\s*\{[^}]*?\})([^}]*?\})/s;

      const newPickFirsts = `
            pickFirst 'META-INF/androidx.localbroadcastmanager_localbroadcastmanager.version'
            pickFirst 'META-INF/androidx.customview_customview.version'
      `;

      if (buildGradleContent.match(packagingOptionsBlockRegex)) {
        // If a packagingOptions block already exists at the correct level, insert into it
        buildGradleContent = buildGradleContent.replace(
          packagingOptionsBlockRegex,
          (match, p1, p2, p3) => {
            // p1 is content before packagingOptions block, p2 is packagingOptions block, p3 is content after
            const lastBraceOfPackagingOptions = p2.lastIndexOf("}");
            return (
              p1 +
              p2.substring(0, lastBraceOfPackagingOptions) +
              newPickFirsts + // Insert new rules
              p2.substring(lastBraceOfPackagingOptions) +
              p3
            );
          }
        );
      } else {
        // Fallback: If no top-level packagingOptions block exists (unlikely in Expo projects),
        // find the android {} block and inject a new one.
        const androidBlockInsertionRegex = /(android\s*\{[^}]*?\})/s;
        if (buildGradleContent.match(androidBlockInsertionRegex)) {
          buildGradleContent = buildGradleContent.replace(
            androidBlockInsertionRegex,
            (match) => {
              const lastBraceIndex = match.lastIndexOf("}");
              return (
                match.substring(0, lastBraceIndex) +
                `
              packagingOptions {
                  jniLibs {
                      useLegacyPackaging (findProperty('expo.useLegacyPackaging')?.toBoolean() ?: false)
                  }
                  ${newPickFirsts}
              }
                          ` +
                match.substring(lastBraceIndex)
              );
            }
          );
        } else {
          console.warn(
            "Could not find 'android { }' block in build.gradle. Cannot add packagingOptions."
          );
        }
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
