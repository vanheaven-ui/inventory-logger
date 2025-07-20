import React, {
  useState,
  useEffect,
  useCallback,
  useLayoutEffect,
} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { useLanguage } from "../context/LanguageContext";
import FocusAwareStatusBar from "../components/FocusAwareStatusBar";
import useVoiceRecognition from "../hooks/useVoiceRecognition";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { saveInventoryItem } from "../storage/dataStorage";

export default function ManageItemScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t, language } = useLanguage(); // Get language from context

  // Voice Recognition Hook
  const {
    recognizedText,
    partialResults,
    isListening,
    error: voiceError,
    startListening,
    stopListening,
    cancelListening,
    setRecognizedText,
  } = useVoiceRecognition();

  const {
    itemName: passedItemName,
    isNewItem: isRedirectedNewItem,
    itemToEdit,
  } = route.params || {};

  const [itemName, setItemName] = useState("");
  // Renamed currentStock to stockQuantity
  const [stockQuantity, setStockQuantity] = useState("0");
  const [costPricePerUnit, setCostPricePerUnit] = useState("0");
  const [sellingPricePerUnit, setSellingPricePerUnit] = useState("0");
  // Removed unit, category, description states

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeInput, setActiveInput] = useState(null);

  // Use a ref to store the locale for speech recognition
  const speechRecognizerLocale = React.useRef(language);

  // Update locale ref if language changes
  useEffect(() => {
    speechRecognizerLocale.current = language;
  }, [language]);

  useEffect(() => {
    if (itemToEdit) {
      setIsEditing(true);
      setItemName(itemToEdit.itemName || "");
      // Update from currentStock to stockQuantity
      setStockQuantity(String(itemToEdit.currentStock || 0));
      setCostPricePerUnit(String(itemToEdit.costPricePerUnit || 0));
      setSellingPricePerUnit(String(itemToEdit.sellingPricePerUnit || 0));
      // Removed unit, category, description population
    } else if (isRedirectedNewItem && passedItemName) {
      setItemName(passedItemName);
      setStockQuantity("0"); // Update for new item
      setCostPricePerUnit("0");
      setSellingPricePerUnit("0");
      setIsEditing(false);
    } else {
      setItemName("");
      setStockQuantity("0"); // Update for new item default
      setCostPricePerUnit("0");
      setSellingPricePerUnit("0");
      setIsEditing(false);
    }
  }, [passedItemName, isRedirectedNewItem, itemToEdit]);

  // Use useLayoutEffect to set navigation options for the header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: isEditing ? t("edit_item") : t("add_new_item"),
      headerShown: true, // Ensure the header is shown
      headerStyle: {
        backgroundColor: "#28a745", // Match your desired green color
      },
      headerTintColor: "#fff", // White color for title and back arrow
      headerBackTitleVisible: false, // Hide the iOS "Back" text next to the arrow
    });
  }, [navigation, isEditing, t]);

  const parseNumberFromVoice = (text) => {
    const cleanedText = text.replace(/,/g, "");
    const parsed = parseFloat(cleanedText);
    if (!isNaN(parsed)) {
      return String(parsed);
    }
    return "";
  };

  useEffect(() => {
    if (recognizedText && activeInput) {
      switch (activeInput) {
        case "itemName":
          setItemName(recognizedText);
          break;
        case "stockQuantity": // Updated to stockQuantity
          setStockQuantity(parseNumberFromVoice(recognizedText));
          break;
        case "costPricePerUnit":
          setCostPricePerUnit(parseNumberFromVoice(recognizedText));
          break;
        case "sellingPricePerUnit":
          setSellingPricePerUnit(parseNumberFromVoice(recognizedText));
          break;
        // Removed cases for unit, category, description
      }
      setRecognizedText("");
      stopListening();
      setActiveInput(null);
    }
    // If listening stops for any reason (user stops, error), clear active input
    if (!isListening && activeInput) {
      setActiveInput(null);
    }
  }, [
    recognizedText,
    activeInput,
    isListening,
    setRecognizedText,
    stopListening,
  ]);

  useEffect(() => {
    if (voiceError) {
      Toast.show({
        type: "error",
        text1: t("voice_input_error"),
        text2: voiceError,
        visibilityTime: 4000,
      });
    }
  }, [voiceError, t]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        cancelListening();
        setActiveInput(null);
        setRecognizedText("");
      };
    }, [cancelListening, setRecognizedText])
  );

  const handleSaveItem = async () => {
    if (!itemName.trim()) {
      Toast.show({ type: "error", text1: t("item_name_required") });
      return;
    }

    setLoading(true);
    cancelListening();
    setActiveInput(null);

    try {
      const derivedVoiceKeywords = itemName
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 0)
        .map((word) => word.replace(/[^a-z0-9]/g, ""));

      const uniqueKeywords = [...new Set(derivedVoiceKeywords)];

      const itemData = {
        id: itemToEdit?.id || Date.now().toString(),
        itemName: itemName.trim(),
        // Updated to stockQuantity for saving
        currentStock: parseFloat(stockQuantity) || 0, // Keep the key as 'currentStock' for storage consistency if needed, but use stockQuantity state
        costPricePerUnit: parseFloat(costPricePerUnit) || 0,
        sellingPricePerUnit: parseFloat(sellingPricePerUnit) || 0,
        // Removed unit, category, description from itemData
        voiceKeywords: uniqueKeywords,
      };

      await saveInventoryItem(itemData);
      Toast.show({
        type: "success",
        text1: isEditing
          ? t("inventory_item_updated")
          : t("inventory_item_added"),
      });
      navigation.goBack();
    } catch (error) {
      console.error("Error saving item:", error);
      Toast.show({
        type: "error",
        text1: t("error_saving_item"),
        text2: error.message || t("please_try_again"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMicPress = (inputName) => {
    if (isListening && activeInput === inputName) {
      cancelListening(); // Stop listening if already active for this field
      setActiveInput(null);
    } else {
      cancelListening(); // Cancel any existing listening session
      setActiveInput(inputName);
      setRecognizedText("");
      startListening(speechRecognizerLocale.current); // Pass the current locale to the hook
    }
  };

  const renderInputField = (
    label,
    value,
    onChangeText,
    placeholder,
    inputIdentifier,
    keyboardType = "default",
    multiline = false,
    numberOfLines = 1,
    autoCapitalize = "sentences",
    editable = true,
    micPlaceholderKey // New prop for mic button text translation key
  ) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineInput,
            !editable && styles.disabledInput,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          autoCapitalize={autoCapitalize}
          onFocus={() => setActiveInput(inputIdentifier)}
          onBlur={() => setActiveInput(null)}
          editable={editable}
        />
        <TouchableOpacity
          style={[
            styles.micButton,
            isListening &&
              activeInput === inputIdentifier &&
              styles.micButtonActive,
            !editable && styles.micButtonDisabled,
          ]}
          onPress={() => handleMicPress(inputIdentifier)}
          disabled={!editable}
        >
          {isListening && activeInput === inputIdentifier ? (
            <ActivityIndicator size="small" color="red" />
          ) : (
            <Icon
              name="microphone-outline"
              size={24}
              color={!editable ? "#aaa" : "#666"}
            />
          )}
          <Text style={styles.micButtonText}>
            {isListening && activeInput === inputIdentifier
              ? t("listening")
              : t(micPlaceholderKey)}
          </Text>
        </TouchableOpacity>
      </View>
      {isListening &&
        partialResults.length > 0 &&
        activeInput === inputIdentifier && (
          <Text style={styles.partialText}>
            {t("listening")} {partialResults[0]}...
          </Text>
        )}
    </>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.fullContainer}
    >
      <FocusAwareStatusBar
        backgroundColor="#28a745" // Status bar will match the new header color
        barStyle="light-content"
        animated={true}
      />

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.form}>
          {renderInputField(
            t("item_name"),
            itemName,
            setItemName,
            t("enter_item_name"),
            "itemName",
            "default",
            false,
            1,
            "sentences",
            !isEditing,
            "speak_item_name" // Mic button text key
          )}
          {renderInputField(
            t("stock_quantity"), // Updated label to stock_quantity
            stockQuantity, // Updated to stockQuantity state
            setStockQuantity, // Updated to setStockQuantity
            t("enter_stock_quantity"), // Updated placeholder
            "stockQuantity", // Updated identifier
            "numeric",
            false,
            1,
            "none",
            true,
            "speak_quantity" // Mic button text key
          )}
          {renderInputField(
            t("cost_price_per_unit"),
            costPricePerUnit,
            setCostPricePerUnit,
            t("enter_cost_price"),
            "costPricePerUnit",
            "numeric",
            false,
            1,
            "none",
            true,
            "speak_price" // Mic button text key
          )}
          {renderInputField(
            t("selling_price_per_unit"),
            sellingPricePerUnit,
            setSellingPricePerUnit,
            t("enter_selling_price"),
            "sellingPricePerUnit",
            "numeric",
            false,
            1,
            "none",
            true,
            "speak_price" // Mic button text key
          )}
        </View>
      </ScrollView>
      {loading || isListening ? (
        <ActivityIndicator
          size="large"
          color="#28a745"
          style={styles.loading}
        />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleSaveItem}>
          <Text style={styles.buttonText}>
            {isEditing ? t("update_inventory_item") : t("add_to_inventory")}
          </Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    backgroundColor: "#f6f6f6",
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f6f6f6",
  },
  form: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fcfcfc",
    marginRight: 10,
  },
  disabledInput: {
    backgroundColor: "#e9ecef",
    color: "#6c757d",
  },
  micButton: {
    flexDirection: "row", // Arrange icon and text horizontally
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    gap: 5, // Space between icon and text
  },
  micButtonActive: {
    backgroundColor: "#ffe0e0",
  },
  micButtonDisabled: {
    backgroundColor: "#f1f1f1",
    opacity: 0.6,
  },
  micButtonText: {
    color: "#666", // Default text color
    fontSize: 12,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  partialText: {
    fontSize: 14,
    color: "#28a745",
    textAlign: "center",
    marginBottom: 10,
    marginTop: -10,
  },
  button: {
    backgroundColor: "#28a745",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  loading: {
    marginTop: 20,
    marginBottom: 20,
  },
});
