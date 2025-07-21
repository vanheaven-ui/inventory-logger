import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert, // Added Alert for better user feedback
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

import useVoiceRecognition from "../hooks/useVoiceRecognition";
import { useLanguage } from "../context/LanguageContext";

const TransactionForm = ({
  isMobileMoneyAgent,
  transactionType, // 'sell' or 'restock'
  currentPhysicalCash,
  availableFloat, // For selected MM network
  availableQuantity, // For selected general product

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
}) => {
  const { t, language } = useLanguage();

  const speechRecognizerLocale = useRef(language);

  useEffect(() => {
    speechRecognizerLocale.current = language;
  }, [language]);

  const currencyFormatter = new Intl.NumberFormat(language || "en", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
  });

  // --- Voice Recognition Hook ---
  const {
    recognizedText,
    partialResults,
    isListening,
    error,
    startListening,
    stopListening,
    cancelListening,
    setRecognizedText,
  } = useVoiceRecognition();

  const [activeVoiceField, setActiveVoiceField] = useState(null);

  // Effect to process recognized text when a final result is available
  useEffect(() => {
    if (recognizedText && activeVoiceField) {
      const textToProcess = recognizedText.toLowerCase().trim();
      let valueToSet = "";

      switch (activeVoiceField) {
        case "productName":
          setProductName(textToProcess);
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
      setRecognizedText(""); // Clear recognized text after processing
      stopListening(); // Stop listening after processing the final result
    }
    // If listening stops for any reason (e.g., error, timeout, or manual stop)
    // and there was an active field, clear the active field.
    if (!isListening && activeVoiceField) {
      setActiveVoiceField(null);
    }
  }, [
    recognizedText,
    activeVoiceField,
    isListening, // Keep this dependency
    setProductName,
    setQuantity,
    setMmNetworkName,
    setMmAmount,
    setRecognizedText,
    stopListening, // Ensure stopListening is a dependency
  ]);

  // Effect to handle form type change (Mobile Money Agent vs. General Product)
  useEffect(() => {
    if (isMobileMoneyAgent) {
      setProductName("");
      setQuantity("");
    } else {
      setMmNetworkName("");
      setMmAmount("");
    }

    // IMPORTANT: Only attempt to cancel voice recognition if it's currently active.
    // This prevents trying to cancel when there's nothing to cancel.
    // Also, wrap in an async IIFE for await.
    if (isListening) {
      // Add condition here
      (async () => {
        try {
          console.log(
            "TransactionForm: Cancelling voice due to form type change."
          );
          await cancelListening();
        } catch (e) {
          console.error(
            "TransactionForm: Error cancelling voice on form type change:",
            e
          );
          // Optionally, show an alert to the user if this is a critical error
          // Alert.alert("Voice Error", "Could not stop voice recognition cleanly when changing form type.");
        }
      })();
    }
  }, [
    isMobileMoneyAgent,
    isListening, // Add isListening as a dependency
    setProductName,
    setQuantity,
    setMmNetworkName,
    setMmAmount,
    cancelListening,
  ]);

  // Refined handleVoiceInputPress to prevent redundant cancellations and manage state
  const handleVoiceInputPress = async (field) => {
    // If an error exists, notify the user and reset before trying again
    if (error) {
      Alert.alert(
        t("voice_error"),
        `${t("voice_error_message")}: ${error}\n${t("please_try_again")}`
      );
      // Optionally, attempt to destroy/re-init voice engine here if the error is persistent
      // For now, we rely on the useVoiceRecognition hook's internal cleanup.
      // It's good to clear the error state in the hook after showing it.
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
          // Even if cancel fails, we attempt to reset our local state
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
          // Continue trying to start the new session even if cancel failed
          // as the previous session might have implicitly ended or is in a bad state.
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
      style={styles.voiceButton}
      onPress={() => handleVoiceInputPress(fieldKey)}
      // Disable button if an overall voice error exists that prevents starting
      disabled={!!error && !isListening}
    >
      {isListening && activeVoiceField === fieldKey ? (
        <ActivityIndicator size="small" color="#0066cc" />
      ) : (
        <FontAwesome5 name="microphone" size={20} color="#0066cc" />
      )}
      <Text style={styles.voiceButtonText}>
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
              style={[
                styles.input,
                validationErrors?.productName && styles.errorInput,
                { flex: 1 },
              ]}
              value={productName}
              onChangeText={setProductName}
              placeholder={t("product_name_placeholder")}
              placeholderTextColor="#999"
            />
            {renderVoiceInputButton("productName", "speak_product_name")}
          </View>
          {validationErrors?.productName && (
            <Text style={styles.errorText}>{validationErrors.productName}</Text>
          )}

          <Text style={styles.label}>{t("quantity_label")}</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                validationErrors?.quantity && styles.errorInput,
                { flex: 1 },
              ]}
              value={quantity}
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

      {error && <Text style={styles.errorText}>Voice Error: {error}</Text>}
      {isListening && partialResults.length > 0 && (
        <Text style={styles.partialResultsText}>
          {t("listening")} {partialResults[0]}...
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
    backgroundColor: "#e6f2ff",
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  voiceButtonText: {
    color: "#0066cc",
    fontSize: 12,
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
});
