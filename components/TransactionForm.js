import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
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
          if (activeVoiceField === "mmAmount")
            setMmAmount(valueToSet ? valueToSet[0] : "");
          break;
        case "mmNetworkName":
          setMmNetworkName(textToProcess);
          break;
        default:
          break;
      }
      setActiveVoiceField(null);
      setRecognizedText("");
      stopListening();
    }
    if (!isListening && activeVoiceField) {
      setActiveVoiceField(null);
    }
  }, [
    recognizedText,
    activeVoiceField,
    isListening,
    setProductName,
    setQuantity,
    setMmNetworkName,
    setMmAmount,
    setRecognizedText,
    stopListening,
  ]);

  useEffect(() => {
    if (isMobileMoneyAgent) {
      setProductName("");
      setQuantity("");
    } else {
      setMmNetworkName("");
      setMmAmount("");
    }
    (async () => {
      await cancelListening();
    })();
  }, [
    isMobileMoneyAgent,
    setProductName,
    setQuantity,
    setMmNetworkName,
    setMmAmount,
    cancelListening,
  ]);

  const handleVoiceInputPress = (field) => {
    if (isListening && activeVoiceField === field) {
      cancelListening();
      setActiveVoiceField(null);
    } else {
      cancelListening();
      setActiveVoiceField(field);
      startListening(speechRecognizerLocale.current);
    }
  };

  const renderVoiceInputButton = (fieldKey, placeholderTextKey) => (
    <TouchableOpacity
      style={styles.voiceButton}
      onPress={() => handleVoiceInputPress(fieldKey)}
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
            {" "}
            {/* Changed style name */}
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
  // REMOVED: balanceInfoContainer style

  // NEW/MODIFIED: infoBox style, combining previous balanceInfoContainer and balanceItem properties
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0f7fa", // Light blue background for info
    borderRadius: 10,
    padding: 15,
    marginBottom: 15, // Margin between info boxes and to the first input
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  infoLabel: {
    // Renamed from balanceLabel
    fontSize: 16,
    fontWeight: "500",
    color: "#005a6a", // Darker blue-green for label
    marginLeft: 10,
    marginRight: 5,
  },
  infoValue: {
    // Renamed from balanceValue
    fontSize: 16,
    fontWeight: "700",
    color: "#007bff", // Blue for values
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
