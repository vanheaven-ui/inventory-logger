// plugins/withAndroidManifestModifications.js
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAndroidManifestModifications(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;

    // Ensure the 'tools' namespace is declared in the manifest tag
    if (!androidManifest.manifest.$['xmlns:tools']) {
      androidManifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    // Find the <application> tag
    const application = androidManifest.manifest.application[0];

    if (application.$) {
      // Add the tools:replace attribute to the application tag
      if (application.$['tools:replace']) {
        if (!application.$['tools:replace'].includes('android:appComponentFactory')) {
          application.$['tools:replace'] += ',android:appComponentFactory';
        }
      } else {
        application.$['tools:replace'] = 'android:appComponentFactory';
      }
      // Explicitly set the appComponentFactory value to the AndroidX one
      application.$['android:appComponentFactory'] = 'androidx.core.app.CoreComponentFactory';

    } else {
      // If no attributes exist on application tag, create the $ object
      application.$ = {
        'tools:replace': 'android:appComponentFactory',
        'android:appComponentFactory': 'androidx.core.app.CoreComponentFactory'
      };
    }

    return config;
  });
};