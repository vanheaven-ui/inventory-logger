// plugins/withAndroidCustomizations.js
const { withAppBuildGradle } = require("@expo/config-plugins");

function withAndroidCustomizations(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === "groovy") {
      let buildGradleContent = config.modResults.contents;

      // Define ALL packagingOptions content to be injected/merged
      // This will be the content *inside* the packagingOptions {} block
      const pickFirstRules = `
            pickFirst 'META-INF/androidx.localbroadcastmanager_localbroadcastmanager.version'
            pickFirst 'META-INF/androidx.customview_customview.version'
            pickFirst 'META-INF/androidx.legacy_legacy-support-core-ui.version'
            pickFirst 'META-INF/androidx.activity_activity.version'
            pickFirst 'META-INF/androidx.fragment_fragment.version'
            // Add more 'pickFirst' lines here as new META-INF conflicts appear.
            // Example: pickFirst 'META-INF/some_other_conflicting_file.version'
      `;

      // 1. First, try to remove any old, potentially mis-inserted packagingOptions from our previous attempts
      // We'll look for a unique string we know our plugin adds to identify and remove blocks it created.
      // This is a bit fragile but necessary given the previous issues.
      const marker = "// Expo Config Plugin - custom packagingOptions start";
      const endMarker = "// Expo Config Plugin - custom packagingOptions end";

      // Regex to find and remove blocks wrapped by our markers
      const markedBlockRegex = new RegExp(
        `(?://\\s*${marker}[\\s\\S]*?//\\s*${endMarker})`,
        "g"
      );

      let initialContent = buildGradleContent;
      buildGradleContent = buildGradleContent.replace(
        markedBlockRegex,
        (match) => {
          console.log(
            "Expo Config Plugin: Removing a previously marked custom packagingOptions block."
          );
          return ""; // Remove the entire marked block
        }
      );
      if (initialContent !== buildGradleContent) {
        console.log(
          "Expo Config Plugin: Successfully cleaned up old marked blocks."
        );
      } else {
        console.log(
          "Expo Config Plugin: No previously marked custom packagingOptions blocks found."
        );
      }

      // 2. Now, find the 'android {' block and either update existing packagingOptions or insert a new one
      const androidBlockRegex = /(android\s*\{[^}]*?\})/s; // Matches the entire android { ... } block

      if (buildGradleContent.match(androidBlockRegex)) {
        buildGradleContent = buildGradleContent.replace(
          androidBlockRegex,
          (androidBlockMatch) => {
            const existingPackagingOptionsRegex =
              /packagingOptions\s*\{([\s\S]*?)\}/;
            let updatedAndroidBlock = androidBlockMatch;

            if (androidBlockMatch.match(existingPackagingOptionsRegex)) {
              // If packagingOptions already exists, merge our rules into it
              console.log(
                "Expo Config Plugin: Merging into existing top-level packagingOptions."
              );
              updatedAndroidBlock = androidBlockMatch.replace(
                existingPackagingOptionsRegex,
                (packagingOptionsMatch, existingContent) => {
                  // Ensure jniLibs is preserved if it was already there by Expo's default
                  let jniLibsBlock = "";
                  const jniLibsMatch =
                    existingContent.match(/jniLibs\s*\{[^}]*?\}/);
                  if (jniLibsMatch) {
                    jniLibsBlock = jniLibsMatch[0];
                  }

                  // Combine jniLibs with our new pickFirst rules
                  return `packagingOptions {\n${jniLibsBlock}\n${pickFirstRules}\n}`;
                }
              );
            } else {
              // If packagingOptions doesn't exist, insert a new one
              console.log(
                "Expo Config Plugin: Creating new top-level packagingOptions block."
              );
              const lastBraceIndex = androidBlockMatch.lastIndexOf("}");
              updatedAndroidBlock =
                androidBlockMatch.substring(0, lastBraceIndex) +
                `
    ${marker}
    packagingOptions {
        jniLibs {
            useLegacyPackaging (findProperty('expo.useLegacyPackaging')?.toBoolean() ?: false)
        }
        ${pickFirstRules}
    }
    ${endMarker}
                          ` +
                androidBlockMatch.substring(lastBraceIndex);
            }
            return updatedAndroidBlock;
          }
        );
      } else {
        console.warn(
          "Expo Config Plugin: Could not find 'android { }' block in build.gradle. Cannot inject packagingOptions."
        );
      }

      // 3. Ensure configurations.all { exclude ... } block is present
      // This is generally appended at the end of the file.
      const excludeClassBlock = `
configurations.all {
    exclude group: 'com.android.support', module: 'support-compat'
    exclude group: 'com.android.support', module: 'versionedparcelable'
    exclude group: 'com.android.support', module: 'support-core-ui' // Explicitly exclude this if the pickFirst isn't enough
    exclude group: 'com.android.support', module: 'support-fragment'
    exclude group: 'com.android.support', module: 'support-activity'
}
`;
      // Check for presence to avoid duplicate blocks, but also make sure our specific excludes are there
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
          "Expo Config Plugin: configurations.all exclude block already present. Checking for specific excludes."
        );
        // If the block exists, we might need to ensure our specific excludes are within it
        // This part gets tricky with regex to merge, so for now, assume the first check is sufficient.
        // If you still get `com.android.support` errors, we'd need more complex regex here.
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
