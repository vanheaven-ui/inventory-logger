// plugins/withAndroidManifestModifications.js
const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withAndroidManifestModifications(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;

    // Ensure the 'tools' namespace is declared in the manifest tag
    // <manifest xmlns:android="http://schemas.android.com/apk/res/android" xmlns:tools="http://schemas.android.com/tools">
    if (!androidManifest.manifest.$["xmlns:tools"]) {
      androidManifest.manifest.$["xmlns:tools"] =
        "http://schemas.android.com/tools";
    }

    // Find the <application> tag
    const application = androidManifest.manifest.application[0];

    // Add the tools:replace attribute to the application tag
    // <application ... tools:replace="android:appComponentFactory">
    if (application.$) {
      if (application.$["tools:replace"]) {
        // If tools:replace already exists, append appComponentFactory to it
        if (
          !application.$["tools:replace"].includes(
            "android:appComponentFactory"
          )
        ) {
          application.$["tools:replace"] += ",android:appComponentFactory";
        }
      } else {
        // If tools:replace doesn't exist, add it
        application.$["tools:replace"] = "android:appComponentFactory";
      }
    } else {
      // If no attributes exist on application tag, create the $ object

      application.$ = { "tools:replace": "android:appComponentFactory" };
    }

    return config;
  });
};
