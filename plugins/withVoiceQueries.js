// plugins/withVoiceQueries.js
const { withAndroidManifest } = require("@expo/config-plugins");

function withVoiceQueries(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;

    // Ensure the <queries> tag exists at the root level of the manifest
    // It should be an array of objects, even if there's only one <queries> tag
    if (
      !androidManifest.manifest.queries ||
      !Array.isArray(androidManifest.manifest.queries)
    ) {
      androidManifest.manifest.queries = [{}]; // Initialize as an array with an empty object
    }

    // Ensure the first <queries> object has an 'intent' array
    if (
      !androidManifest.manifest.queries[0].intent ||
      !Array.isArray(androidManifest.manifest.queries[0].intent)
    ) {
      androidManifest.manifest.queries[0].intent = [];
    }

    // Define the intent for speech recognition service
    const speechRecognitionAction = {
      $: { "android:name": "android.speech.RecognitionService" },
    };

    // Check if the RecognitionService intent is already present to avoid duplicates
    const hasRecognitionService =
      androidManifest.manifest.queries[0].intent.some(
        (intentEntry) =>
          intentEntry.action &&
          Array.isArray(intentEntry.action) &&
          intentEntry.action.some(
            (action) =>
              action.$["android:name"] === "android.speech.RecognitionService"
          )
      );

    if (!hasRecognitionService) {
      // Add the speech recognition intent to the existing intent array
      androidManifest.manifest.queries[0].intent.push({
        action: [speechRecognitionAction],
      });
      console.log(
        "Expo Config Plugin: Added android.speech.RecognitionService query to AndroidManifest.xml"
      );
    } else {
      console.log(
        "Expo Config Plugin: android.speech.RecognitionService query already present in AndroidManifest.xml (no action taken)."
      );
    }

    return config;
  });
}

module.exports = withVoiceQueries;
