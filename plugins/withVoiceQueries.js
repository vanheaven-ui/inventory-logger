// plugins/withVoiceQueries.js
const { withAndroidManifest } = require("@expo/config-plugins");

function withVoiceQueries(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;

    // Ensure the <queries> tag exists at the root level of the manifest
    if (!androidManifest.manifest.queries) {
      androidManifest.manifest.queries = [];
    }

    // Define the intent for speech recognition service
    const speechRecognitionIntent = {
      intent: [
        {
          action: [
            {
              $: { "android:name": "android.speech.RecognitionService" },
            },
          ],
        },
      ],
    };

    // Check if the RecognitionService intent is already present to avoid duplicates
    const hasRecognitionService =
      androidManifest.manifest.queries[0]?.intent?.some(
        (intent) =>
          intent.action &&
          intent.action.some(
            (action) =>
              action.$["android:name"] === "android.speech.RecognitionService"
          )
      );

    if (!hasRecognitionService) {
      // Add the speech recognition intent to the queries block
      // We assume queries is an array, as it should be from the manifest structure
      if (
        androidManifest.manifest.queries.length > 0 &&
        androidManifest.manifest.queries[0].intent
      ) {
        androidManifest.manifest.queries[0].intent.push(
          speechRecognitionIntent.intent[0]
        );
      } else {
        // If no existing intent array, create it
        androidManifest.manifest.queries.push(speechRecognitionIntent);
      }
      console.log(
        "Expo Config Plugin: Added android.speech.RecognitionService query to AndroidManifest.xml"
      );
    } else {
      console.log(
        "Expo Config Plugin: android.speech.RecognitionService query already present in AndroidManifest.xml"
      );
    }

    // Optional: Add other queries you might need that were previously added by expo-build-properties
    // For example, if you still want TTS_SERVICE explicitly, you can add it here too.
    // For now, let's keep it focused on the problematic one.

    return config;
  });
}

module.exports = withVoiceQueries;
