const { withAppBuildGradle } = require("@expo/config-plugins");

function withAndroidCustomizations(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      throw new Error(
        "Cannot add Android customizations to non-Groovy build.gradle"
      );
    }

    let buildGradleContent = config.modResults.contents;

    // Packaging rules to resolve META-INF conflicts
    const pickFirstRules = `
        pickFirst 'META-INF/androidx.localbroadcastmanager_localbroadcastmanager.version'
        pickFirst 'META-INF/androidx.customview_customview.version'
        pickFirst 'META-INF/androidx.legacy_legacy-support-core-ui.version'
        pickFirst 'META-INF/androidx.activity_activity.version'
        pickFirst 'META-INF/androidx.fragment_fragment.version'
        // Add more pickFirst lines here as needed.
    `;

    // Markers to help safely re-insert or update packagingOptions
    const marker = "// Expo Config Plugin - custom packagingOptions start";
    const endMarker = "// Expo Config Plugin - custom packagingOptions end";
    const markedBlockRegex = new RegExp(
      `(?://\\s*Expo Config Plugin - custom packagingOptions start[\\s\\S]*?//\\s*Expo Config Plugin - custom packagingOptions end)`,
      "g"
    );

    // Remove previous injections
    buildGradleContent = buildGradleContent.replace(markedBlockRegex, "");

    // Find 'android {' block
    const androidBlockRegex = /android\s*\{[^}]*\}/s;
    const androidMatch = buildGradleContent.match(androidBlockRegex);

    if (androidMatch) {
      const androidBlock = androidMatch[0];
      const packagingOptionsRegex = /packagingOptions\s*\{([\s\S]*?)\}/;

      let updatedAndroidBlock = androidBlock;

      if (packagingOptionsRegex.test(androidBlock)) {
        // Merge with existing packagingOptions
        updatedAndroidBlock = androidBlock.replace(
          packagingOptionsRegex,
          (match, existingContent) => {
            let jniLibs =
              existingContent.match(/jniLibs\s*\{[^}]*\}/)?.[0] || "";

            return `packagingOptions {
    ${jniLibs}
    ${pickFirstRules}
}`;
          }
        );
      } else {
        // Insert new packagingOptions block
        const lastBraceIndex = androidBlock.lastIndexOf("}");
        updatedAndroidBlock =
          androidBlock.slice(0, lastBraceIndex) +
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
          androidBlock.slice(lastBraceIndex);
      }

      // Replace original android block in full gradle content
      buildGradleContent = buildGradleContent.replace(
        androidBlock,
        updatedAndroidBlock
      );
    } else {
      console.warn(
        "Expo Config Plugin: Could not find 'android { }' block. Skipping packagingOptions injection."
      );
    }

    // Add configurations.all excludes if not already present
    const excludeBlock = `
configurations.all {
    exclude group: 'com.android.support', module: 'support-compat'
    exclude group: 'com.android.support', module: 'versionedparcelable'
    exclude group: 'com.android.support', module: 'support-core-ui'
    exclude group: 'com.android.support', module: 'support-fragment'
    exclude group: 'com.android.support', module: 'support-activity'
}
`;

    if (
      !buildGradleContent.includes(
        "exclude group: 'com.android.support', module: 'support-compat'"
      )
    ) {
      buildGradleContent += excludeBlock;
    }

    config.modResults.contents = buildGradleContent;
    return config;
  });
}

module.exports = withAndroidCustomizations;
