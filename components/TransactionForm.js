import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView, // Keep KeyboardAvoidingView for keyboard behavior
  Platform,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  SafeAreaView, 
} from "react-native";
import Voice from "@react-native-voice/voice";
import { useLanguage } from "../context/LanguageContext"; 
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { saveTransaction, calculateCommission } from "../storage/transactionStorage";

console.log(Voice);


// Helper function to request microphone permission
const requestMicrophonePermission = async (t) => {
  if (Platform.OS === "android") {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: t("microphone_permission_title"),
          message: t("microphone_permission_message"),
          buttonNeutral: t("ask_me_later"),
          buttonNegative: t("cancel"),
          buttonPositive: t("ok"),
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("Microphone permission granted.");
        return true;
      } else {
        console.log("Microphone permission denied.");
        Toast.show({
          type: "error",
          text1: t("mic_permission_denied"),
          text2: t("please_grant_mic_permission"),
        });
        return false;
      }
    } catch (err) {
      console.warn("Error requesting microphone permission:", err);
      Toast.show({
        type: "error",
        text1: t("mic_permission_error"),
        text2: err.message || t("failed_to_request_mic_permission"),
      });
      return false;
    }
  }
  return true;
};

// TransactionForm now receives 'type' as a prop from TransactionScreen
export default function TransactionForm({ type, isMobileMoneyAgent }) {
  // REMOVED: Transaction Category State - no longer needed as isMobileMoneyAgent prop directly controls form
  // const [transactionCategory, setTransactionCategory] = useState(
  //   isMobileMoneyAgent ? "mobileMoney" : "shop"
  // );

  // Input States
  const [amount, setAmount] = useState(""); // For MM: transaction value
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState(""); // For MM
  const [itemName, setItemName] = useState(""); // For Shop
  const [quantity, setQuantity] = useState(""); // For Shop
  const [networkName, setNetworkName] = useState(""); // For MM

  // Voice Recognition States
  const [partialResults, setPartialResults] = useState([]);
  const [lastSpokenField, setLastSpokenField] = useState(null);
  const [isListeningAmount, setIsListeningAmount] = useState(false);
  const [isListeningCustomerPhoneNumber, setIsListeningCustomerPhoneNumber] =
    useState(false);
  const [isListeningItemName, setIsListeningItemName] = useState(false);
  const [isListeningQuantity, setIsListeningQuantity] = useState(false);
  const [isListeningNetworkName, setIsListeningNetworkName] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { t, language } = useLanguage();

  // Hardcoded colors for a light theme
  const colors = {
    background: "#f8f8f8",
    text: "#333333",
    textSecondary: "#666666",
    border: "#cccccc",
    placeholder: "#999999",
    primaryButton: "#4CAF50",
    secondaryButton: "#FFD700",
    activeCategory: "#007bff",
    inactiveCategory: "#e0e0e0",
    activeCategoryText: "#FFFFFF",
    inactiveCategoryText: "#333333",
  };

  // Refs for focusing inputs
  const amountInputRef = useRef(null);
  const customerPhoneNumberInputRef = useRef(null);
  const itemNameInputRef = useRef(null);
  const quantityInputRef = useRef(null);
  const networkNameInputRef = useRef(null);

  const focusInput = (field) => {
    switch (field) {
      case "amount":
        amountInputRef.current?.focus();
        break;
      case "customerPhoneNumber":
        customerPhoneNumberInputRef.current?.focus();
        break;
      case "itemName":
        itemNameInputRef.current?.focus();
        break;
      case "quantity":
        quantityInputRef.current?.focus();
        break;
      case "networkName":
        networkNameInputRef.current?.focus();
        break;
      default:
        break;
    }
  };

  const resetListeningStates = useCallback(() => {
    setIsListeningAmount(false);
    setIsListeningCustomerPhoneNumber(false);
    setIsListeningItemName(false);
    setIsListeningQuantity(false);
    setIsListeningNetworkName(false);
    setIsLoading(false);
    setLastSpokenField(null);
  }, []);

  // Voice Recognition Handlers
  const onSpeechStart = useCallback((e) => {
    console.log("onSpeechStart: ", e);
    setIsLoading(true);
  }, []);

  const onSpeechEnd = useCallback(
    (e) => {
      console.log("onSpeechEnd: ", e);
      resetListeningStates();
    },
    [resetListeningStates]
  );

  const onSpeechResults = useCallback(
    (e) => {
      console.log("onSpeechResults: ", e);
      if (e.value && e.value.length > 0) {
        const text = e.value[0];
        const cleanedText = text.replace(/,|-|\s/g, ""); // Remove commas, dashes, spaces

        switch (lastSpokenField) {
          case "amount":
            setAmount(cleanedText.match(/\d+/g)?.join("") || ""); // Extract only numbers
            break;
          case "customerPhoneNumber":
            setCustomerPhoneNumber(cleanedText.match(/\d+/g)?.join("") || ""); // Extract only numbers
            break;
          case "itemName":
            setItemName(text);
            break;
          case "quantity":
            setQuantity(cleanedText.match(/\d+/g)?.join("") || "");
            break;
          case "networkName":
            setNetworkName(text);
            break;
          default:
            break;
        }
      }
      resetListeningStates();
    },
    [lastSpokenField, resetListeningStates]
  );

  const onSpeechError = useCallback(
    (e) => {
      console.log("onSpeechError: ", e);
      if (e.error?.message === "not-authorized" || e.error?.code === "14") {
        Alert.alert(
          t("permission_required_title"),
          t("microphone_access_needed"),
          [
            {
              text: t("ok"),
              onPress: () => console.log("Permission error acknowledged"),
            },
          ]
        );
      } else {
        Toast.show({
          type: "error",
          text1: t("speech_recognition_error"),
          text2: e.error?.message || t("an_unknown_error_occurred"),
        });
      }
      resetListeningStates();
    },
    [resetListeningStates, t]
  );

  const onSpeechPartialResults = useCallback((e) => {
    console.log("onSpeechPartialResults: ", e);
    setPartialResults(e.value);
  }, []);

  useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechPartialResults = onSpeechPartialResults;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [
    onSpeechStart,
    onSpeechEnd,
    onSpeechResults,
    onSpeechError,
    onSpeechPartialResults,
  ]);

  const startRecognizing = async (field) => {
    // Stop any active listening before starting a new one
    if (
      isListeningNetworkName ||
      isListeningAmount ||
      isListeningCustomerPhoneNumber ||
      isListeningItemName ||
      isListeningQuantity
    ) {
      await stopRecognizing();
      resetListeningStates();
    }

    const hasPermission = await requestMicrophonePermission(t);
    if (!hasPermission) {
      resetListeningStates();
      return;
    }

    setLastSpokenField(field);
    setPartialResults([]);
    setIsLoading(true);

    try {
      const langCode = language === "lg" ? "lg-UG" : "en-US";

      if (!Voice || typeof Voice.start !== "function") {
        console.error(
          "Voice module not properly initialized. Cannot call Voice.start."
        );
        Toast.show({
          type: "error",
          text1: t("voice_module_error"),
          text2: t("initialization_failed"),
        });
        resetListeningStates();
        return;
      }

      await Voice.start(langCode);

      // Set specific listening state based on field
      switch (field) {
        case "amount":
          setIsListeningAmount(true);
          break;
        case "customerPhoneNumber":
          setIsListeningCustomerPhoneNumber(true);
          break;
        case "itemName":
          setIsListeningItemName(true);
          break;
        case "quantity":
          setIsListeningQuantity(true);
          break;
        case "networkName":
          setIsListeningNetworkName(true);
          break;
        default:
          break;
      }

      focusInput(field);
    } catch (e) {
      console.error("Error starting voice recognition:", e);
      Toast.show({
        type: "error",
        text1: t("voice_start_error"),
        text2: e.message || t("check_mic_permissions_or_rebuild"),
      });
      resetListeningStates();
    }
  };

  const stopRecognizing = async () => {
    try {
      if (Voice && typeof Voice.stop === "function") {
        await Voice.stop();
      } else {
        console.warn("Voice.stop() not available or Voice module is null.");
      }
    } catch (e) {
      console.error("Error stopping voice recognition:", e);
      Toast.show({
        type: "error",
        text1: t("voice_stop_error"),
        text2: e.message || t("failed_to_stop_recognition"),
      });
    } finally {
      resetListeningStates();
    }
  };

  const clearInputs = useCallback(() => {
    setAmount("");
    setCustomerPhoneNumber("");
    setItemName("");
    setQuantity("");
    setNetworkName("");
    setPartialResults([]);
    resetListeningStates();
    Toast.show({
      type: "info",
      text1: t("inputs_cleared"),
    });
  }, [resetListeningStates, t]);

  const handleSubmit = async () => {
    let transactionData = {};
    let displayMessage = "";

    // Determine the actual transaction type based on 'isMobileMoneyAgent' and the 'type' prop from parent
    let actualTransactionType;
    if (!isMobileMoneyAgent) {
      // Shop transaction
      actualTransactionType = type; // 'sell' or 'restock' from prop
    } else {
      // Mobile Money transaction
      actualTransactionType = type === "sell" ? "withdrawal" : "deposit"; // Map prop 'sell' to 'withdrawal', 'restock' to 'deposit'
    }

    // Basic Validation - adjusted to use actualTransactionType
    if (!isMobileMoneyAgent) {
      // Shop transaction
      if (!itemName || !quantity) {
        Toast.show({ type: "error", text1: t("all_fields_required") });
        return;
      }
      if (isNaN(Number(quantity)) || Number(quantity) <= 0) {
        Toast.show({ type: "error", text1: t("invalid_quantity") });
        return;
      }

      if (actualTransactionType === "sell") {
        transactionData = {
          isMobileMoney: false,
          type: "sell",
          itemName: itemName.trim(),
          quantity: Number(quantity),
          amount: 0, // Placeholder, actual amount derived from DB selling price * quantity
          customerIdentifier: null, // Not applicable for general sales
          networkName: null, // Not applicable
          commissionEarned: 0, // Not applicable
        };
        displayMessage = `${t("item_name")}: ${itemName}\n${t(
          "quantity"
        )}: ${quantity}\n${t("total_amount")}: ${t("calculated_from_db")}`;
      } else if (actualTransactionType === "restock") {
        transactionData = {
          isMobileMoney: false,
          type: "restock",
          itemName: itemName.trim(),
          quantity: Number(quantity),
          costPrice: 0, // Placeholder, actual cost price derived from DB
          amount: 0, // Placeholder, actual amount derived from DB cost price * quantity
          customerIdentifier: null,
          networkName: null,
          commissionEarned: 0,
        };
        displayMessage = `${t("item_name")}: ${itemName}\n${t(
          "quantity"
        )}: ${quantity}\n${t("cost_price")}: ${t("calculated_from_db")}\n${t(
          "total_amount"
        )}: ${t("calculated_from_db")}`;
      }
    } else {
      // Mobile Money transaction
      if (!customerPhoneNumber || !amount || !networkName) {
        Toast.show({ type: "error", text1: t("all_fields_required") });
        return;
      }
      if (isNaN(Number(amount)) || Number(amount) <= 0) {
        Toast.show({ type: "error", text1: t("invalid_amount") });
        return;
      }

      let commission = 0;
      if (actualTransactionType === "deposit") {
        // Now using 'deposit'
        commission = calculateCommission(
          networkName,
          Number(amount),
          "deposit"
        );
        transactionData = {
          isMobileMoney: true,
          type: "restock", // For MM, deposit is agent 'restocking' float
          itemName: networkName.trim(), // Network name is the 'item' for MM
          quantity: Number(amount), // Amount is the quantity for MM
          amount: Number(amount), // Total amount of transaction
          customerIdentifier: customerPhoneNumber.trim(),
          networkName: networkName.trim(),
          commissionEarned: commission,
        };
        displayMessage = `${t("transaction_type")}: ${t("deposit")}\n${t(
          "network_name"
        )}: ${networkName}\n${t(
          "customer_phone_number"
        )}: ${customerPhoneNumber}\n${t("amount")}: ${amount}\n${t(
          "commission"
        )}: ${commission}`;
      } else if (actualTransactionType === "withdrawal") {
        // Now using 'withdrawal'
        commission = calculateCommission(
          networkName,
          Number(amount),
          "withdrawal"
        );
        transactionData = {
          isMobileMoney: true,
          type: "sell", // For MM, withdrawal is agent 'selling' float
          itemName: networkName.trim(), // Network name is the 'item' for MM
          quantity: Number(amount), // Amount is the quantity for MM
          amount: Number(amount), // Total amount of transaction
          customerIdentifier: customerPhoneNumber.trim(),
          networkName: networkName.trim(),
          commissionEarned: commission,
        };
        displayMessage = `${t("transaction_type")}: ${t("withdrawal")}\n${t(
          "network_name"
        )}: ${networkName}\n${t(
          "customer_phone_number"
        )}: ${customerPhoneNumber}\n${t("amount")}: ${amount}\n${t(
          "commission"
        )}: ${commission}`;
      }
    }

    Alert.alert(t("confirm_transaction"), displayMessage, [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("confirm"),
        onPress: async () => {
          try {
            await saveTransaction(transactionData);
            Toast.show({ type: "success", text1: t("transaction_successful") });
            clearInputs();
          } catch (error) {
            console.error("Failed to save transaction:", error);
            Toast.show({
              type: "error",
              text1: t("transaction_failed"),
              text2: error.message || t("an_unknown_error_occurred"),
            });
          }
        },
      },
    ]);
  };

  const getMicIconColor = (isListening) => {
    return isListening ? "#FF0000" : colors.text;
  };

  // Determine which mic icon should be active for the current field
  const getActiveMicState = (field) => {
    switch (field) {
      case "amount":
        return isListeningAmount;
      case "customerPhoneNumber":
        return isListeningCustomerPhoneNumber;
      case "itemName":
        return isListeningItemName;
      case "quantity":
        return isListeningQuantity;
      case "networkName":
        return isListeningNetworkName;
      default:
        return false;
    }
  };

  return (
    // Wrap KeyboardAvoidingView inside SafeAreaView
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[
          styles.fullScreenContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <View style={styles.contentContainer}>
          {/* REMOVED: Transaction Category Selector */}

          {/* Dynamic Input Fields based on isMobileMoneyAgent prop and Type */}
          {!isMobileMoneyAgent ? ( // Shop transaction fields
            <>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t("item_name")}
                </Text>
                <View style={styles.inputWithMic}>
                  <TextInput
                    ref={itemNameInputRef}
                    style={[
                      styles.input,
                      { borderColor: colors.border, color: colors.text },
                    ]}
                    keyboardType="default"
                    value={itemName}
                    onChangeText={setItemName}
                    placeholder={t("enter_item_name")}
                    placeholderTextColor={colors.placeholder}
                    onFocus={() =>
                      getActiveMicState("itemName") && stopRecognizing()
                    }
                  />
                  <TouchableOpacity
                    style={styles.micButton}
                    onPress={() => startRecognizing("itemName")}
                  >
                    {isLoading && isListeningItemName ? (
                      <ActivityIndicator size="small" color="#FF0000" />
                    ) : (
                      <Ionicons
                        name={
                          getActiveMicState("itemName") ? "mic" : "mic-outline"
                        }
                        size={24}
                        color={getMicIconColor(getActiveMicState("itemName"))}
                      />
                    )}
                  </TouchableOpacity>
                </View>
                {isListeningItemName && partialResults.length > 0 && (
                  <Text
                    style={[
                      styles.partialResult,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t("listening")}: {partialResults[0]}
                  </Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t("quantity")}
                </Text>
                <View style={styles.inputWithMic}>
                  <TextInput
                    ref={quantityInputRef}
                    style={[
                      styles.input,
                      { borderColor: colors.border, color: colors.text },
                    ]}
                    keyboardType="numeric"
                    value={quantity}
                    onChangeText={(text) =>
                      setQuantity(text.replace(/[^0-9]/g, ""))
                    }
                    placeholder={t("enter_quantity")}
                    placeholderTextColor={colors.placeholder}
                    onFocus={() =>
                      getActiveMicState("quantity") && stopRecognizing()
                    }
                  />
                  <TouchableOpacity
                    style={styles.micButton}
                    onPress={() => startRecognizing("quantity")}
                  >
                    {isLoading && isListeningQuantity ? (
                      <ActivityIndicator size="small" color="#FF0000" />
                    ) : (
                      <Ionicons
                        name={
                          getActiveMicState("quantity") ? "mic" : "mic-outline"
                        }
                        size={24}
                        color={getMicIconColor(getActiveMicState("quantity"))}
                      />
                    )}
                  </TouchableOpacity>
                </View>
                {isListeningQuantity && partialResults.length > 0 && (
                  <Text
                    style={[
                      styles.partialResult,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t("listening")}: {partialResults[0]}
                  </Text>
                )}
              </View>
            </>
          ) : (
            // Mobile Money transaction fields
            <>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t("customer_phone_number")}
                </Text>
                <View style={styles.inputWithMic}>
                  <TextInput
                    ref={customerPhoneNumberInputRef}
                    style={[
                      styles.input,
                      { borderColor: colors.border, color: colors.text },
                    ]}
                    keyboardType="phone-pad"
                    value={customerPhoneNumber}
                    onChangeText={(text) =>
                      setCustomerPhoneNumber(text.replace(/[^0-9]/g, ""))
                    }
                    placeholder={t("enter_customer_phone_number")}
                    placeholderTextColor={colors.placeholder}
                    onFocus={() =>
                      getActiveMicState("customerPhoneNumber") &&
                      stopRecognizing()
                    }
                  />
                  <TouchableOpacity
                    style={styles.micButton}
                    onPress={() => startRecognizing("customerPhoneNumber")}
                  >
                    {isLoading && isListeningCustomerPhoneNumber ? (
                      <ActivityIndicator size="small" color="#FF0000" />
                    ) : (
                      <Ionicons
                        name={
                          getActiveMicState("customerPhoneNumber")
                            ? "mic"
                            : "mic-outline"
                        }
                        size={24}
                        color={getMicIconColor(
                          getActiveMicState("customerPhoneNumber")
                        )}
                      />
                    )}
                  </TouchableOpacity>
                </View>
                {isListeningCustomerPhoneNumber &&
                  partialResults.length > 0 && (
                    <Text
                      style={[
                        styles.partialResult,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {t("listening")}: {partialResults[0]}
                    </Text>
                  )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t("network_name")}
                </Text>
                <View style={styles.inputWithMic}>
                  <TextInput
                    ref={networkNameInputRef}
                    style={[
                      styles.input,
                      { borderColor: colors.border, color: colors.text },
                    ]}
                    keyboardType="default"
                    value={networkName}
                    onChangeText={setNetworkName}
                    placeholder={t("enter_network_name")}
                    placeholderTextColor={colors.placeholder}
                    onFocus={() =>
                      getActiveMicState("networkName") && stopRecognizing()
                    }
                  />
                  <TouchableOpacity
                    style={styles.micButton}
                    onPress={() => startRecognizing("networkName")}
                  >
                    {isLoading && isListeningNetworkName ? (
                      <ActivityIndicator size="small" color="#FF0000" />
                    ) : (
                      <Ionicons
                        name={
                          getActiveMicState("networkName")
                            ? "mic"
                            : "mic-outline"
                        }
                        size={24}
                        color={getMicIconColor(
                          getActiveMicState("networkName")
                        )}
                      />
                    )}
                  </TouchableOpacity>
                </View>
                {isListeningNetworkName && partialResults.length > 0 && (
                  <Text
                    style={[
                      styles.partialResult,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t("listening")}: {partialResults[0]}
                  </Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t("amount")}
                </Text>
                <View style={styles.inputWithMic}>
                  <TextInput
                    ref={amountInputRef}
                    style={[
                      styles.input,
                      { borderColor: colors.border, color: colors.text },
                    ]}
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={(text) =>
                      setAmount(text.replace(/[^0-9]/g, ""))
                    }
                    placeholder={t("enter_amount")}
                    placeholderTextColor={colors.placeholder}
                    onFocus={() =>
                      getActiveMicState("amount") && stopRecognizing()
                    }
                  />
                  <TouchableOpacity
                    style={styles.micButton}
                    onPress={() => startRecognizing("amount")}
                  >
                    {isLoading && isListeningAmount ? (
                      <ActivityIndicator size="small" color="#FF0000" />
                    ) : (
                      <Ionicons
                        name={
                          getActiveMicState("amount") ? "mic" : "mic-outline"
                        }
                        size={24}
                        color={getMicIconColor(isListeningAmount)}
                      />
                    )}
                  </TouchableOpacity>
                </View>
                {isListeningAmount && partialResults.length > 0 && (
                  <Text
                    style={[
                      styles.partialResult,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {t("listening")}: {partialResults[0]}
                  </Text>
                )}
              </View>
            </>
          )}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.clearButton} onPress={clearInputs}>
              <LinearGradient
                colors={["#FFD700", "#FFA500"]}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>{t("clear")}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <LinearGradient
                colors={["#4CAF50", "#2E8B57"]}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>{t("submit")}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
        <Toast />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6f6f6", // Match your InventoryScreen's SafeAreaView background
  },
  fullScreenContainer: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 20, // Now fixed padding, SafeAreaView handles the top inset
  },
  // Removed title style as the Text component is removed
  categorySelector: {
    // REMOVED: This style is no longer used by any component
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    overflow: "hidden",
  },
  categoryButton: {
    // REMOVED: This style is no longer used by any component
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  categoryButtonText: {
    // REMOVED: This style is no longer used by any component
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "600",
  },
  inputWithMic: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  micButton: {
    padding: 5,
  },
  partialResult: {
    marginTop: 5,
    fontSize: 14,
    fontStyle: "italic",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 30,
  },
  clearButton: {
    flex: 1,
    marginRight: 10,
    borderRadius: 10,
    overflow: "hidden",
  },
  submitButton: {
    flex: 1,
    marginLeft: 10,
    borderRadius: 10,
    overflow: "hidden",
  },
  gradientButton: {
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
