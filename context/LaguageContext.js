import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Ensure this import is correct

// Define translations for different languages
const translations = {
  en: {
    home_heading: "📦 Inventory Logger",
    record_sale: "Record Sale",
    record_restock: "Record Restock",
    view_summary: "View Today's Summary",
    view_history: "View History",
    tip_home:
      "🎙️ Tip: Use the 🎤 mic icon on your keyboard to quickly dictate item name or quantity.",
    item_name: "Item Name",
    quantity: "Quantity",
    item_name_placeholder: "e.g. Sugar",
    quantity_placeholder: "e.g. 3",
    record_transaction: "Record Transaction", // Generic for the form button
    sale_recorded: "Sale recorded successfully",
    restock_recorded: "Restock recorded successfully",
    error_saving: "Error saving transaction. Please try again.",
    item_name_required: "Item name is required",
    quantity_required: "Quantity is required",
    valid_quantity: "Enter a valid quantity",
    tip_transaction:
      "🎤 Tip: Tap the mic icon on your **keyboard** to speak item name or quantity.",
    record_a_sale: "Record a Sale",
    record_a_restock: "Record a Restock",
    todays_summary: "Today's Summary",
    sales: "Sales",
    restocks: "Restocks",
    transaction_history: "Transaction History",
    no_transactions: "No transactions yet.",
    sold: "Sold",
    restocked: "Restocked",
    select_language: "Select Language:",
    english: "English",
    luganda: "Luganda",
    swahili: "Kiswahili",
  },
  lg: {
    // Luganda
    home_heading: "📦 Inventory Logger", // Translated: "Ekigazi kya Byanika" - "Inventory Logger"
    record_sale: "Wandiika Ekitundiddwa", // "Record what was sold"
    record_restock: "Wandiika Ekigasse", // "Record what was added"
    view_summary: "Laba Ebyasumululwa Olwa Lero", // "See Today's Summary"
    view_history: "Laba Ebyafaayo", // "See History"
    tip_home:
      "🎙️ Amagezi: Kozesa akatamiro ka 🎤 mic ku keyboard yo okwogera amannya g'ebintu oba omuwendo mangu.", // "Tip: Use the mic icon on your keyboard to quickly speak item names or quantity."
    item_name: "Erinnya ly'Ekintu", // "Item's Name"
    quantity: "Omuwendo", // "Quantity"
    item_name_placeholder: "Eky'okulabirako: Sukari", // "Example: Sugar"
    quantity_placeholder: "Eky'okulabirako: 3", // "Example: 3"
    record_transaction: "Wandiika Enkola", // "Record Action/Transaction"
    sale_recorded: "Ekitundiddwa kiwandiddwa bulungi", // "Sale recorded successfully"
    restock_recorded: "Ekigasse kiwandiddwa bulungi", // "Restock recorded successfully"
    error_saving: "Wabaddewo ensobi mu kuwanika enkozesa. Ggukiriza nate.", // "There was an error saving the transaction. Try again."
    item_name_required: "Erinnya ly'ekintu lyetaagisa", // "Item name is required"
    quantity_required: "Omuwendo gwetaagisa", // "Quantity is required"
    valid_quantity: "Wandiika omuwendo ogumala", // "Enter a valid quantity"
    tip_transaction:
      "🎤 Amagezi: Kanyiga akatamiro ka mic ku **keyboard** yo okwogera erinnya ly'ekintu oba omuwendo.", // "Tip: Tap the mic icon on your keyboard to speak item name or quantity."
    record_a_sale: "Wandiika Ekitundiddwa", // "Record a Sale"
    record_a_restock: "Wandiika Ekigasse", // "Record a Restock"
    todays_summary: "Ebyasumululwa Olwa Lero", // "Today's Summary"
    sales: "Ebitundiddwa", // "Sales"
    restocks: "Ebigasse", // "Restocks"
    transaction_history: "Ebyafaayo By'enkozesa", // "Transaction History"
    no_transactions: "Tewali nkozesa n'emu.", // "No transactions yet."
    sold: "Kitundiddwa", // "It was sold"
    restocked: "Kigasse", // "It was restocked"
    select_language: "Londa Olulimi:", // "Choose Language:"
    english: "Lungereza", // English
    luganda: "Luganda", // Luganda
    swahili: "Kiswahili", // Swahili
  },
  sw: {
    // Swahili
    home_heading: "📦 Kidhibiti Mizigo", // "Inventory Manager"
    record_sale: "Andika Mauzo", // "Record Sales"
    record_restock: "Andika Bidhaa Mpya", // "Record New Stock"
    view_summary: "Tazama Muhtasari wa Leo", // "View Today's Summary"
    view_history: "Tazama Historia", // "View History"
    tip_home:
      "🎙️ Kidokezo: Tumia ikoni ya 🎤 maikrofoni kwenye kibodi yako kudikta haraka jina la bidhaa au kiasi.", // "Tip: Use the microphone icon on your keyboard to quickly dictate the item name or quantity."
    item_name: "Jina la Bidhaa", // "Item Name"
    quantity: "Kiasi", // "Quantity"
    item_name_placeholder: "Mfano: Sukari", // "Example: Sugar"
    quantity_placeholder: "Mfano: 3", // "Example: 3"
    record_transaction: "Andika Muamala", // "Record Transaction"
    sale_recorded: "Mauzo yameandikwa kwa ufanisi", // "Sales recorded successfully"
    restock_recorded: "Bidhaa mpya zimeandikwa kwa ufanisi", // "New stock recorded successfully"
    error_saving:
      "Hitilafu wakati wa kuhifadhi muamala. Tafadhali jaribu tena.", // "Error saving transaction. Please try again."
    item_name_required: "Jina la bidhaa linahitajika", // "Item name is required"
    quantity_required: "Kiasi kinahitajika", // "Quantity is required"
    valid_quantity: "Weka kiasi halali", // "Enter a valid quantity"
    tip_transaction:
      "🎤 Kidokezo: Gusa ikoni ya maikrofoni kwenye **kibodi** yako ili kusema jina la bidhaa au kiasi.", // "Tip: Tap the microphone icon on your keyboard to speak the item name or quantity."
    record_a_sale: "Andika Mauzo", // "Record a Sale"
    record_a_restock: "Andika Bidhaa Mpya", // "Record a Restock"
    todays_summary: "Muhtasari wa Leo", // "Today's Summary"
    sales: "Mauzo", // "Sales"
    restocks: "Bidhaa Mpya", // "New Stock"
    transaction_history: "Historia ya Miamala", // "Transaction History"
    no_transactions: "Hakuna miamala bado.", // "No transactions yet."
    sold: "Imeuzwa", // "Sold"
    restocked: "Imetiwa bidhaa mpya", // "Restocked"
    select_language: "Chagua Lugha:", // "Choose Language:"
    english: "Kiingereza", // English
    luganda: "Luganda", // Luganda
    swahili: "Kiswahili", // Swahili
  },
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en"); // Default language

  useEffect(() => {
    // Load saved language from AsyncStorage on component mount
    const loadSavedLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem("appLanguage");
        if (savedLanguage && translations[savedLanguage]) {
          setLanguage(savedLanguage);
        }
      } catch (error) {
        console.error("Failed to load language from AsyncStorage", error);
      }
    };
    loadSavedLanguage();
  }, []);

  const setAppLanguage = async (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
      try {
        await AsyncStorage.setItem("appLanguage", lang);
      } catch (error) {
        console.error("Failed to save language to AsyncStorage", error);
      }
    } else {
      console.warn(`Language '${lang}' is not supported.`);
    }
  };

  const translate = (key) => {
    return translations[language][key] || key; // Fallback to key if translation not found
  };

  return (
    <LanguageContext.Provider
      value={{ language, setAppLanguage, t: translate }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
