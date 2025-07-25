import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert, // Keep Alert for critical messages
  FlatList,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

import { useLanguage } from "../context/LanguageContext";

const TransactionForm = ({
  isMobileMoneyAgent,
  transactionType,
  currentPhysicalCash,
  availableFloat,
  availableQuantity,

  productName,
  setProductName,
  quantity,
  setQuantity,

  mmNetworkName,
  setMmNetworkName,
  mmAmount,
  setMmAmount,

  validationErrors,
  handleSaveTransaction,

  // Voice Recognition Props (now received from parent)
  recognizedText,
  partialResults,
  isListening,
  error, // <-- This prop will be used to show UI for errors
  startListening,
  stopListening,
  cancelListening,
  setRecognizedText, // Renamed from resetVoiceRecognition to match the hook's return
  resetVoiceRecognition, // <-- Added this prop back, it's very useful

  // Props for Product Suggestions
  filteredProductSuggestions,
  showProductSuggestions,
  onProductSuggestionPress,
  onProductNameChange, // This is the combined setter for product name
}) => {
  const { t, language } = useLanguage();

  const speechRecognizerLocale = useRef(language);

  // Ref for the product name input to handle blur/focus for suggestions
  const productNameInputRef = useRef(null);
  const [isProductNameFocused, setIsProductNameFocused] = useState(false);

  useEffect(() => {
    speechRecognizerLocale.current = language;
  }, [language]);

  const currencyFormatter = new Intl.NumberFormat(language || "en", {
    style: "currency",
    currency: "UGX", // Assuming UGX is the fixed currency for your app based on previous context
    minimumFractionDigits: 0,
  });

  const [activeVoiceField, setActiveVoiceField] = useState(null);

  // Effect to process recognized text when a final result is available
  useEffect(() => {
    if (recognizedText && activeVoiceField) {
      const textToProcess = recognizedText.toLowerCase().trim();
      let valueToSet = "";

      switch (activeVoiceField) {
        case "productName":
          onProductNameChange(textToProcess); // Use combined handler for voice input
          break;
        case "quantity":
          valueToSet = textToProcess.match(/\d+(\.\d+)?/);
          setQuantity(valueToSet ? valueToSet[0] : "");
          break;
        case "mmAmount":
          valueToSet = textToProcess.match(/\d+(\.\d+)?/);
          setMmAmount(valueToSet ? valueToSet[0] : "");
          break;
        case "mmNetworkName":
          setMmNetworkName(textToProcess);
          break;
        default:
          break;
      }
      setActiveVoiceField(null);
      // setRecognizedText(""); // This is handled by the parent's resetVoiceRecognition
      stopListening(); // Stop listening after processing the final result
    }
    // If listening stops for any reason (e.g., error, timeout, or manual stop)
    // and there was an active field, clear the active field.
    if (!isListening && activeVoiceField && !error) { // Only clear activeVoiceField if no error, as error needs user attention
      setActiveVoiceField(null);
    }
  }, [
    recognizedText,
    activeVoiceField,
    isListening,
    onProductNameChange,
    setQuantity,
    setMmNetworkName,
    setMmAmount,
    // setRecognizedText, // No longer needed here as parent handles it
    stopListening,
    error // Added error to dependency array to consider its state
  ]);

  // Effect to handle form type change (Mobile Money Agent vs. General Product)
  useEffect(() => {
    if (isMobileMoneyAgent) {
      onProductNameChange(""); // Clear product name using the new handler
      setQuantity("");
    } else {
      setMmNetworkName("");
      setMmAmount("");
    }

    // Always attempt to cancel listening on form type change
    // regardless of whether `isListening` is true, to ensure a clean state.
    (async () => {
      try {
        if (isListening) { // Only attempt if currently listening
          console.log(
            "TransactionForm: Cancelling voice due to form type change."
          );
          await cancelListening();
        }
        // Always reset voice recognition state when form type changes
        resetVoiceRecognition();
      } catch (e) {
        console.error(
          "TransactionForm: Error cancelling/resetting voice on form type change:",
          e
        );
      }
    })();
  }, [
    isMobileMoneyAgent,
    isListening,
    onProductNameChange,
    setQuantity,
    setMmNetworkName,
    setMmAmount,
    cancelListening,
    resetVoiceRecognition, // Add resetVoiceRecognition to dependencies
  ]);

  // Refined handleVoiceInputPress to prevent redundant cancellations and manage state
  const handleVoiceInputPress = async (field) => {
    // If there's an existing error, and the user taps the mic button again for *any* field,
    // we should immediately reset the voice recognition state.
    if (error) {
      console.log("TransactionForm: Clearing previous voice error and retrying.");
      resetVoiceRecognition(); // Clear error and other voice states
      // We'll proceed to start listening below after clearing
    }

    if (isListening) {
      // Case 1: Already listening
      if (activeVoiceField === field) {
        // User clicked the mic button for the currently active field: Stop listening.
        console.log(`TransactionForm: Stopping voice for ${field}`);
        try {
          await cancelListening(); // Use cancel for a clean stop and state reset
          setActiveVoiceField(null);
        } catch (e) {
          console.error(
            `TransactionForm: Error stopping voice for ${field}:`,
            e
          );
          Alert.alert(t("voice_error"), t("failed_to_stop_listening"));
          setActiveVoiceField(null);
        }
      } else {
        // User clicked a DIFFERENT mic button while another was active:
        // First, cancel the current session, then start a new one for the new field.
        console.log(
          `TransactionForm: Switching from ${activeVoiceField} to ${field}`
        );
        try {
          await cancelListening(); // Ensure current session is stopped before starting new
        } catch (e) {
          console.error(
            `TransactionForm: Error cancelling voice before switching fields:`,
            e
          );
          Alert.alert(t("voice_error"), t("failed_to_switch_voice_input"));
        } finally {
          setActiveVoiceField(field);
          try {
            await startListening(speechRecognizerLocale.current);
          } catch (e) {
            console.error(
              `TransactionForm: Error starting voice for ${field} after switch:`,
              e
            );
            Alert.alert(t("voice_error"), t("failed_to_start_listening"));
            setActiveVoiceField(null); // Clear active field if start fails
          }
        }
      }
    } else {
      // Case 2: Not listening at all (or was just stopped/cancelled from elsewhere)
      // Just start listening for the clicked field.
      console.log(`TransactionForm: Starting voice for ${field}`);
      setActiveVoiceField(field);
      try {
        await startListening(speechRecognizerLocale.current);
      } catch (e) {
        console.error(`TransactionForm: Error starting voice for ${field}:`, e);
        Alert.alert(t("voice_error"), t("failed_to_start_listening"));
        setActiveVoiceField(null); // Clear active field if start fails
      }
    }
  };

  const renderVoiceInputButton = (fieldKey, placeholderTextKey) => (
    <TouchableOpacity
      style={[
        styles.voiceButton,
        isListening && activeVoiceField === fieldKey && styles.voiceButtonActive,
        error && styles.voiceButtonError, // Apply error style
      ]}
      onPress={() => handleVoiceInputPress(fieldKey)}
      // Only disable the button if there's a voice error AND it's NOT the currently active field
      // This allows the user to tap the active mic button to stop/cancel even if an error occurs.
      disabled={!!error && activeVoiceField !== fieldKey}
    >
      {isListening && activeVoiceField === fieldKey ? (
        <ActivityIndicator size="small" color="#fff" /> 
      ) : (
        <FontAwesome5
          name={error ? "microphone-slash" : "microphone"} // Changed icon on error
          size={20}
          color={error ? "#dc3545" : "#0066cc"} // Red for error, blue normally
        />
      )}
      <Text
        style={[
          styles.voiceButtonText,
          isListening && activeVoiceField === fieldKey && styles.voiceButtonTextActive,
          error && styles.voiceButtonTextError, // Apply error text style
        ]}
      >
        {isListening && activeVoiceField === fieldKey
          ? t("listening")
          : t(placeholderTextKey)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.form}>
      {/* Physical Cash for Withdrawals (Mobile Money Agent) */}
      {isMobileMoneyAgent && transactionType === "sell" && (
        <View style={styles.infoBox}>
          <FontAwesome5 name="money-bill-wave" size={20} color="#28a745" />
          <Text style={styles.infoLabel}>{t("your_physical_cash")}:</Text>
          <Text style={styles.infoValue}>
            {currencyFormatter.format(currentPhysicalCash || 0)}
          </Text>
        </View>
      )}

      {/* E-Float Balance for Deposits (Mobile Money Agent) - Shown ONLY when network name is entered */}
      {isMobileMoneyAgent &&
        transactionType === "restock" &&
        String(mmNetworkName || "").trim() && (
          <View style={styles.infoBox}>
            <FontAwesome5 name="mobile-alt" size={20} color="#007bff" />
            <Text style={styles.infoLabel}>
              {t("float_balance_for_network", {
                network: mmNetworkName || "—",
              })}
              :
            </Text>
            <Text style={styles.infoValue}>
              {currencyFormatter.format(availableFloat || 0)}
            </Text>
          </View>
        )}

      {/* Available Quantity for General Products (non-MM agent) */}
      {!isMobileMoneyAgent && String(productName || "").trim() && (
        <View style={styles.infoBox}>
          <FontAwesome5 name="box" size={20} color="#ff8c00" />
          <Text style={styles.infoLabel}>{t("available_quantity")}:</Text>
          <Text style={styles.infoValue}>{availableQuantity || 0}</Text>
        </View>
      )}

      {/* FORM FIELDS */}
      {isMobileMoneyAgent ? (
        <>
          <Text style={styles.label}>{t("mobile_money_network_label")}</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                validationErrors?.mmNetworkName && styles.errorInput,
                { flex: 1 },
              ]}
              value={mmNetworkName}
              onChangeText={setMmNetworkName}
              placeholder={t("mobile_money_network_placeholder")}
              placeholderTextColor="#999"
            />
            {renderVoiceInputButton("mmNetworkName", "speak_network")}
          </View>
          {validationErrors?.mmNetworkName && (
            <Text style={styles.errorText}>
              {validationErrors.mmNetworkName}
            </Text>
          )}

          <Text style={styles.label}>{t("amount_label")}</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                validationErrors?.mmAmount && styles.errorInput,
                { flex: 1 },
              ]}
              value={mmAmount}
              onChangeText={(text) => setMmAmount(text.replace(/[^0-9.]/g, ""))}
              placeholder={t("amount_placeholder")}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            {renderVoiceInputButton("mmAmount", "speak_amount")}
          </View>
          {validationErrors?.mmAmount && (
            <Text style={styles.errorText}>{validationErrors.mmAmount}</Text>
          )}
        </>
      ) : (
        <>
          <Text style={styles.label}>{t("product_name_label")}</Text>
          <View style={styles.inputContainer}>
            <TextInput
              ref={productNameInputRef}
              style={[
                styles.input,
                validationErrors?.productName && styles.errorInput,
                { flex: 1 },
              ]}
              value={
                isListening &&
                activeVoiceField === "productName" &&
                partialResults.length > 0
                  ? partialResults[0] // Display partial result while listening
                  : productName // Otherwise, display the actual state
              }
              onChangeText={onProductNameChange} // Use the new prop
              placeholder={t("product_name_placeholder")}
              placeholderTextColor="#999"
              onFocus={() => setIsProductNameFocused(true)} // Show suggestions when focused
              onBlur={() => {
                // Delay hiding to allow tap on suggestion
                setTimeout(() => setIsProductNameFocused(false), 100);
              }}
            />
            {renderVoiceInputButton("productName", "speak_product_name")}
          </View>
          {validationErrors?.productName && (
            <Text style={styles.errorText}>{validationErrors.productName}</Text>
          )}

          {/* --- MODIFIED: Product Suggestions List --- */}
          {/* Show suggestions if input focused AND (suggestions exist OR voice is active for this field) */}
          {isProductNameFocused &&
            showProductSuggestions &&
            filteredProductSuggestions.length > 0 && (
              <View style={styles.suggestionListContainer}>
                <FlatList
                  data={filteredProductSuggestions}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.suggestionItem}
                      onPress={() => onProductSuggestionPress(item)}
                    >
                      <Text style={styles.suggestionText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                  keyboardShouldPersistTaps="handled" // Important for not dismissing keyboard/suggestions
                />
              </View>
            )}

          <Text style={styles.label}>{t("quantity_label")}</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                validationErrors?.quantity && styles.errorInput,
                { flex: 1 },
              ]}
              value={
                isListening &&
                activeVoiceField === "quantity" &&
                partialResults.length > 0
                  ? partialResults[0] // Display partial result while listening
                  : quantity // Otherwise, display the actual state
              }
              onChangeText={(text) => setQuantity(text.replace(/[^0-9.]/g, ""))}
              placeholder={t("quantity_placeholder")}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
            {renderVoiceInputButton("quantity", "speak_quantity")}
          </View>
          {validationErrors?.quantity && (
            <Text style={styles.errorText}>{validationErrors.quantity}</Text>
          )}
        </>
      )}

      {/* --- Voice Error Display --- */}
      {error && (
        <View style={styles.voiceErrorContainer}>
          <FontAwesome5 name="exclamation-triangle" size={18} color="#dc3545" style={styles.voiceErrorIcon} />
          <View style={styles.voiceErrorMessageContent}>
            <Text style={styles.voiceErrorTitle}>{t("voice_error")}</Text>
            <Text style={styles.voiceErrorText}>
              {t("voice_error_message_prefix")}: {error}
            </Text>
            <TouchableOpacity onPress={resetVoiceRecognition} style={styles.voiceErrorRetryButton}>
              <Text style={styles.voiceErrorRetryButtonText}>{t("retry_voice")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Partial Results Display (only show if actively listening and no error) */}
      {isListening && partialResults.length > 0 && !error && (
        <Text style={styles.partialResultsText}>
          {t("listening_for_input")} {partialResults[0]}...
        </Text>
      )}

      <TouchableOpacity style={styles.button} onPress={handleSaveTransaction}>
        <Text style={styles.buttonText}>{t("save_transaction")}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default TransactionForm;

const styles = StyleSheet.create({
  form: {
    padding: 16,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0f7fa",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#005a6a",
    marginLeft: 10,
    marginRight: 5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#007bff",
  },
  label: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingRight: 5,
  },
  input: {
    flex: 1,
    padding: 10,
    fontSize: 16,
    borderWidth: 0,
  },
  errorInput: {
    borderColor: "#f00",
  },
  errorText: {
    color: "#f00",
    marginBottom: 8,
  },
  voiceButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#e6f2ff", // Default light blue
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  voiceButtonActive: {
    backgroundColor: "#0066cc", // Darker blue when active
  },
  voiceButtonError: {
    backgroundColor: "#ffe0e0", // Light red for error state
    borderColor: '#dc3545', // Red border
    borderWidth: 1,
  },
  voiceButtonText: {
    color: "#0066cc", // Default blue text
    fontSize: 12,
  },
  voiceButtonTextActive: {
    color: "#fff", // White text when active
  },
  voiceButtonTextError: {
    color: "#dc3545", // Red text for error state
  },
  partialResultsText: {
    color: "#0066cc",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#0066cc",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  suggestionListContainer: {
    maxHeight: 150, // Limit height
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#fff",
    marginTop: -10, // Overlap the input field slightly
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 1, // Ensure it's above other elements within the form
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  suggestionText: {
    fontSize: 16,
    color: "#333",
  },
  // --- New Styles for Voice Error Display ---
  voiceErrorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Align items to the start for better text flow
    backgroundColor: '#fff3cd', // Light yellow for warnings/errors
    borderColor: '#ffc107',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15, // Space it out from the next element
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  voiceErrorIcon: {
    marginRight: 10,
    marginTop: 2, // Align icon with the first line of text
  },
  voiceErrorMessageContent: {
    flex: 1, // Allow text content to take up remaining space
  },
  voiceErrorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404', // Darker yellow/brown for title
    marginBottom: 5,
  },
  voiceErrorText: {
    fontSize: 14,
    color: '#856404', // Darker yellow/brown for text
    marginBottom: 10,
  },
  voiceErrorRetryButton: {
    backgroundColor: '#ffc107', // Match header orange or a suitable warning color
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignSelf: 'flex-start', // Align button to the left
  },
  voiceErrorRetryButtonText: {
    color: '#fff', // White text for better contrast
    fontSize: 14,
    fontWeight: 'bold',
  },
});