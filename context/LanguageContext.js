import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization"; // For getting device's locale

// Import your translation files
import enTranslations from "../translations/en.json";
import lgTranslations from "../translations/lg.json";
import achTranslations from "../translations/ach.json";
import swTranslations from "../translations/sw.json";

// Combine all translations into one object
const translations = {
  en: enTranslations,
  lg: lgTranslations,
  ach: achTranslations,
  sw: swTranslations,
};

const LanguageContext = createContext();

const ASYNC_STORAGE_LANG_KEY = "userLanguage";

// --- Translation Data ---


// --- Language Provider Component ---


// --- Language Provider Component ---
export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en"); // Default to English
  const [initialLoad, setInitialLoad] = useState(true);

  // Function to determine the best language to use
  const getDeviceLanguage = useCallback(() => {
    const locale = Localization.getLocales()[0];
    const systemLanguage = locale ? locale.languageCode : "en"; // e.g., 'en', 'lg'

    // Check if the system language is one of our supported languages
    if (translations[systemLanguage]) {
      return systemLanguage;
    }

    // Fallback to a broader language if a specific dialect isn't supported
    // For example, if system is 'sw-TZ' but we only have 'sw'
    const baseLanguage = systemLanguage.split("-")[0];
    if (translations[baseLanguage]) {
      return baseLanguage;
    }

    return "en"; // Default fallback
  }, []);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const storedLanguage = await AsyncStorage.getItem(
          ASYNC_STORAGE_LANG_KEY
        );
        if (storedLanguage && translations[storedLanguage]) {
          setLanguage(storedLanguage);
        } else {
          // If no language is stored or stored language is not supported,
          // try to use device language
          const deviceLang = getDeviceLanguage();
          setLanguage(deviceLang);
          await AsyncStorage.setItem(ASYNC_STORAGE_LANG_KEY, deviceLang); // Save it for next time
        }
      } catch (error) {
        console.error("Failed to load language from storage:", error);
        setLanguage("en"); // Fallback on error
      } finally {
        setInitialLoad(false);
      }
    };

    loadLanguage();
  }, [getDeviceLanguage]);

  // Function to change the language
  const changeLanguage = useCallback(async (newLanguageCode) => {
    // Ensure the new language code is supported before changing
    if (translations[newLanguageCode]) {
      setLanguage(newLanguageCode);
      try {
        await AsyncStorage.setItem(ASYNC_STORAGE_LANG_KEY, newLanguageCode);
      } catch (error) {
        console.error("Failed to save language to storage:", error);
      }
    } else {
      console.warn(`Language code '${newLanguageCode}' is not supported.`);
    }
  }, []);

  // Translation function
  const t = useCallback(
    (key, options) => {
      // Return key if translations are not yet loaded or if key is missing
      let translatedText = null;

      if (translations[language] && translations[language][key]) {
        translatedText = translations[language][key];
      } else if (translations.en && translations.en[key]) {
        // Fallback to English if key is missing in current language
        console.warn(
          `Translation key '${key}' not found for language '${language}'. Falling back to English.`
        );
        translatedText = translations.en[key];
      } else {
        console.warn(
          `Translation key '${key}' not found for language '${language}' or 'en'. Returning key.`
        );
        translatedText = key; // Return the key itself if no translation is found
      }

      // Handle interpolation (e.g., "Float Balance for {network}")
      if (options && typeof translatedText === "string") {
        for (const [placeholder, value] of Object.entries(options)) {
          translatedText = translatedText.replace(
            new RegExp(`{${placeholder}}`, "g"),
            value
          );
        }
      }

      return translatedText;
    },
    [language] // Recalculate t when language changes
  );

  if (initialLoad) {
    // You might want to render a loading spinner here
    // For now, we return null to prevent rendering UI before language is set
    return null;
  }

  return (
    <LanguageContext.Provider value={{ t, language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// --- Custom Hook for Language Context ---
// export const useLanguage = () => {
//   const context = useContext(LanguageContext);
//   if (context === undefined) {
//     throw new Error("useLanguage must be used within a LanguageProvider");
//   }
//   return context;
// };

// --- Custom Hook for Language Context ---
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
