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
import Icon from "react-native-vector-icons/MaterialCommunityIcons"; // Make sure this is FontAwesome5 if you want the specific triangle icon
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
    error: voiceError, // Renamed to voiceError for clarity within this component
    startListening,
    stopListening,
    cancelListening,
    setRecognizedText, // This typically also clears partial results
    resetVoiceRecognition, // <--- Add this from your hook to clear errors and states
  } = useVoiceRecognition();

  const {
    itemName: passedItemName,
    isNewItem: isRedirectedNewItem,
    itemToEdit,
  } = route.params || {};

  const [itemName, setItemName] = useState("");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [costPricePerUnit, setCostPricePerUnit] = useState("0");
  const [sellingPricePerUnit, setSellingPricePerUnit] = useState("0");

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeInput, setActiveInput] = useState(null);

  const speechRecognizerLocale = React.useRef(language);

  // Update locale ref if language changes
  useEffect(() => {
    speechRecognizerLocale.current = language;
  }, [language]);

  useEffect(() => {
    if (itemToEdit) {
      setIsEditing(true);
      setItemName(itemToEdit.itemName || "");
      setStockQuantity(String(itemToEdit.currentStock || 0));
      setCostPricePerUnit(String(itemToEdit.costPricePerUnit || 0));
      setSellingPricePerUnit(String(itemToEdit.sellingPricePerUnit || 0));
    } else if (isRedirectedNewItem && passedItemName) {
      setItemName(passedItemName);
      setStockQuantity("0");
      setCostPricePerUnit("0");
      setSellingPricePerUnit("0");
      setIsEditing(false);
    } else {
      setItemName("");
      setStockQuantity("0");
      setCostPricePerUnit("0");
      setSellingPricePerUnit("0");
      setIsEditing(false);
    }
  }, [passedItemName, isRedirectedNewItem, itemToEdit]);

  // Use useLayoutEffect to set navigation options for the header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: isEditing ? t("edit_item") : t("add_new_item"),
      headerShown: true,
      headerStyle: {
        backgroundColor: "#28a745",
      },
      headerTintColor: "#fff",
      headerBackTitleVisible: false,
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
        case "stockQuantity":
          setStockQuantity(parseNumberFromVoice(recognizedText));
          break;
        case "costPricePerUnit":
          setCostPricePerUnit(parseNumberFromVoice(recognizedText));
          break;
        case "sellingPricePerUnit":
          setSellingPricePerUnit(parseNumberFromVoice(recognizedText));
          break;
      }
      setRecognizedText(""); // Clear the recognized text in the hook
      stopListening();
      setActiveInput(null);
    }
    // If listening stops for any reason (user stops, error), clear active input
    // Only clear if there's no persistent voiceError after stopping,
    // as we want the error to remain visible.
    if (!isListening && activeInput && !voiceError) {
      setActiveInput(null);
    }
  }, [
    recognizedText,
    activeInput,
    isListening,
    setRecognizedText,
    stopListening,
    voiceError, // Include voiceError in dependencies
  ]);

  // Removed the Toast.show for voiceError here. We will display it directly.
  // useEffect(() => {
  //   if (voiceError) {
  //     Toast.show({
  //       type: "error",
  //       text1: t("voice_input_error"),
  //       text2: voiceError,
  //       visibilityTime: 4000,
  //     });
  //   }
  // }, [voiceError, t]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        // When screen loses focus, ensure voice recognition is stopped and reset
        cancelListening();
        resetVoiceRecognition(); // Reset the voice recognition states, including error
        setActiveInput(null);
      };
    }, [cancelListening, resetVoiceRecognition]) // Added resetVoiceRecognition
  );

  const handleSaveItem = async () => {
    if (!itemName.trim()) {
      Toast.show({ type: "error", text1: t("item_name_required") });
      return;
    }

    setLoading(true);
    cancelListening();
    setActiveInput(null);
    resetVoiceRecognition(); // Ensure voice states are reset on save attempt

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
        currentStock: parseFloat(stockQuantity) || 0,
        costPricePerUnit: parseFloat(costPricePerUnit) || 0,
        sellingPricePerUnit: parseFloat(sellingPricePerUnit) || 0,
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
    // If there's an existing voice error, clear it before attempting to listen again
    if (voiceError) {
      console.log(
        "ManageItemScreen: Clearing previous voice error and retrying."
      );
      resetVoiceRecognition(); // This clears the voiceError, isListening, recognizedText, etc.
      // After resetting, proceed to start listening for the new input
    }

    if (isListening && activeInput === inputName) {
      cancelListening(); // Stop listening if already active for this field
      setActiveInput(null);
    } else {
      cancelListening(); // Cancel any existing listening session
      setActiveInput(inputName);
      setRecognizedText(""); // Clear previous recognized text
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
            // Apply error border if this is the active input and there's a voice error
            activeInput === inputIdentifier && voiceError && styles.errorInput,
          ]}
          value={
            isListening &&
            activeInput === inputIdentifier &&
            partialResults.length > 0
              ? partialResults[0] // Show partial results while listening
              : value // Otherwise, show the actual value
          }
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          autoCapitalize={autoCapitalize}
          // Only set active input if no voice error or if it's the current active input
          onFocus={() => {
            // If there's a voice error, don't auto-activate input until user clears it or taps mic
            if (!voiceError) {
              setActiveInput(inputIdentifier);
            } else if (activeInput === inputIdentifier) {
              // If this is already the active input and there's an error, keep it active for visual feedback
              setActiveInput(inputIdentifier);
            }
          }}
          onBlur={() => {
            // Only deactivate if no voice error or if this input is not the source of the error
            if (!voiceError || activeInput !== inputIdentifier) {
              setActiveInput(null);
            }
          }}
          editable={
            editable && (!isListening || activeInput === inputIdentifier)
          } // Disable typing while listening to voice input for other fields
        />
        <TouchableOpacity
          style={[
            styles.micButton,
            isListening &&
              activeInput === inputIdentifier &&
              styles.micButtonActive,
            !editable && styles.micButtonDisabled,
            voiceError && styles.micButtonError, // Apply error style to button
          ]}
          onPress={() => handleMicPress(inputIdentifier)}
          disabled={
            !editable || (voiceError && activeInput !== inputIdentifier)
          } // Disable if not editable, or if voice error and not current active input
        >
          {isListening && activeInput === inputIdentifier ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Icon
              name={voiceError ? "microphone-off" : "microphone-outline"} // Change icon based on voiceError
              size={24}
              color={voiceError ? "#dc3545" : !editable ? "#aaa" : "#666"}
            />
          )}
          <Text
            style={[
              styles.micButtonText,
              isListening &&
                activeInput === inputIdentifier &&
                styles.micButtonTextActive,
              voiceError && styles.micButtonTextError, // Apply error text color
            ]}
          >
            {isListening && activeInput === inputIdentifier
              ? t("listening")
              : t(micPlaceholderKey)}
          </Text>
        </TouchableOpacity>
      </View>
      {/* Partial results moved here for better context */}
      {isListening &&
        partialResults.length > 0 &&
        activeInput === inputIdentifier &&
        !voiceError && ( // Only show partials if no voice error
          <Text style={styles.partialText}>
            {t("listening_for_input")} {partialResults[0]}...
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
        backgroundColor="#28a745"
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
            "speak_item_name"
          )}
          {renderInputField(
            t("stock_quantity"),
            stockQuantity,
            (text) => setStockQuantity(text.replace(/[^0-9.]/g, "")), // Ensure only numbers
            t("enter_stock_quantity"),
            "stockQuantity",
            "numeric",
            false,
            1,
            "none",
            true,
            "speak_quantity"
          )}
          {renderInputField(
            t("cost_price_per_unit"),
            costPricePerUnit,
            (text) => setCostPricePerUnit(text.replace(/[^0-9.]/g, "")), // Ensure only numbers
            t("enter_cost_price"),
            "costPricePerUnit",
            "numeric",
            false,
            1,
            "none",
            true,
            "speak_price"
          )}
          {renderInputField(
            t("selling_price_per_unit"),
            sellingPricePerUnit,
            (text) => setSellingPricePerUnit(text.replace(/[^0-9.]/g, "")), // Ensure only numbers
            t("enter_selling_price"),
            "sellingPricePerUnit",
            "numeric",
            false,
            1,
            "none",
            true,
            "speak_price"
          )}
        </View>
      </ScrollView>

      {/* --- Voice Error Display --- */}
      {voiceError && (
        <View style={styles.voiceErrorContainer}>
          <Icon
            name="alert-circle-outline"
            size={24}
            color="#dc3545"
            style={styles.voiceErrorIcon}
          />
          <View style={styles.voiceErrorMessageContent}>
            <Text style={styles.voiceErrorTitle}>{t("voice_input_error")}</Text>
            <Text style={styles.voiceErrorText}>
              {t("voice_error_message_prefix")}: {voiceError}
            </Text>
            <TouchableOpacity
              onPress={resetVoiceRecognition}
              style={styles.voiceErrorRetryButton}
            >
              <Text style={styles.voiceErrorRetryButtonText}>
                {t("retry_voice")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
  errorInput: {
    borderColor: "#dc3545", // Red border for input when voice error exists for that field
  },
  disabledInput: {
    backgroundColor: "#e9ecef",
    color: "#6c757d",
  },
  micButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    gap: 5,
  },
  micButtonActive: {
    backgroundColor: "#28a745", // Green when listening (consistent with header)
  },
  micButtonDisabled: {
    backgroundColor: "#f1f1f1",
    opacity: 0.6,
  },
  micButtonText: {
    color: "#666",
    fontSize: 12,
  },
  micButtonTextActive: {
    color: "#fff", // White text when active
  },
  micButtonError: {
    backgroundColor: "#ffe0e0", // Light red for error state
    borderColor: "#dc3545",
    borderWidth: 1,
  },
  micButtonTextError: {
    color: "#dc3545", // Red text for error state
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
    marginHorizontal: 20, // Add horizontal margin for the button
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
  // --- New Styles for Voice Error Display ---
  voiceErrorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff3cd", // Light yellow for warnings/errors
    borderColor: "#ffc107",
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginHorizontal: 20, // Add horizontal margin
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  voiceErrorIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  voiceErrorMessageContent: {
    flex: 1,
  },
  voiceErrorTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#856404",
    marginBottom: 5,
  },
  voiceErrorText: {
    fontSize: 14,
    color: "#856404",
    marginBottom: 10,
  },
  voiceErrorRetryButton: {
    backgroundColor: "#ffc107",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignSelf: "flex-start",
  },
  voiceErrorRetryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});
