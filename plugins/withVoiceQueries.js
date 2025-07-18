// plugins/withVoiceQueries.js
const { withAndroidManifest } = require("@expo/config-plugins");

function withVoiceQueries(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;

    // The desired new intent for RecognitionService
    const newRecognitionServiceIntent = {
      action: [{ $: { "android:name": "android.speech.RecognitionService" } }],
    };

    // Define other common intents that might be needed by other parts of your app
    // (e.g., TTS_SERVICE, which was in your manifest previously)
    const newTtsServiceIntent = {
      action: [{ $: { "android:name": "android.intent.action.TTS_SERVICE" } }],
    };

    // Add any other specific package queries if needed, e.g., the host.exp.exponent one
    const newHostExponentPackage = {
      $: { "android:name": "host.exp.exponent" },
    };

    // Initialize queries array if it doesn't exist
    if (
      !androidManifest.manifest.queries ||
      !Array.isArray(androidManifest.manifest.queries)
    ) {
      androidManifest.manifest.queries = [{}];
    }

    // Get the existing queries intent array, or initialize it
    let existingIntents = androidManifest.manifest.queries[0]?.intent || [];
    let existingPackages = androidManifest.manifest.queries[0]?.package || [];

    // Filter out duplicates and ensure our required intent is present
    const updatedIntents = [];

    // 1. Add RecognitionService if not present
    if (
      !existingIntents.some(
        (i) =>
          i.action &&
          i.action.some(
            (a) =>
              a.$ && a.$["android:name"] === "android.speech.RecognitionService"
          )
      )
    ) {
      updatedIntents.push(newRecognitionServiceIntent);
    }

    // 2. Add TTS_SERVICE if not present
    if (
      !existingIntents.some(
        (i) =>
          i.action &&
          i.action.some(
            (a) =>
              a.$ && a.$["android:name"] === "android.intent.action.TTS_SERVICE"
          )
      )
    ) {
      updatedIntents.push(newTtsServiceIntent);
    }

    // 3. Add existing intents that are not duplicates of what we just added
    existingIntents.forEach((intent) => {
      const isDuplicate = updatedIntents.some((newIntent) => {
        if (newIntent.action && intent.action) {
          return newIntent.action.some((newAction) =>
            intent.action.some(
              (oldAction) =>
                newAction.$ &&
                oldAction.$ &&
                newAction.$["android:name"] === oldAction.$["android:name"]
            )
          );
        }
        return false;
      });
      if (!isDuplicate) {
        updatedIntents.push(intent);
      }
    });

    // Handle packages (like host.exp.exponent)
    const updatedPackages = [];
    if (
      !existingPackages.some(
        (p) => p.$ && p.$["android:name"] === "host.exp.exponent"
      )
    ) {
      updatedPackages.push(newHostExponentPackage);
    }
    existingPackages.forEach((pkg) => {
      const isDuplicate = updatedPackages.some(
        (newPkg) =>
          newPkg.$ &&
          pkg.$ &&
          newPkg.$["android:name"] === pkg.$["android:name"]
      );
      if (!isDuplicate) {
        updatedPackages.push(pkg);
      }
    });

    // Reconstruct the queries block
    androidManifest.manifest.queries = [
      {
        intent: updatedIntents.length > 0 ? updatedIntents : undefined, // Ensure it's not an empty array if no intents
        package: updatedPackages.length > 0 ? updatedPackages : undefined, // Ensure it's not an empty array if no packages
        // Other query types like 'provider' or 'activity' would go here if needed
      },
    ];

    console.log(
      "Expo Config Plugin: Final AndroidManifest.xml queries updated."
    );
    return config;
  });
}

module.exports = withVoiceQueries;
