import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  SafeAreaView,
} from "react-native";
import Voice from "@react-native-voice/voice";
import { useNavigation } from "@react-navigation/native";
import { useLanguage } from "../context/LanguageContext";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import {
  saveTransaction,
  calculateCommission,
  getFloatEntries, // <--- Import getFloatEntries to populate network names
} from "../storage/dataStorage"; // Make sure this path is correct

// Helper function to request microphone permission (no change, but including for completeness)
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

export default function TransactionForm({ type, isMobileMoneyAgent }) {
  const navigation = useNavigation();
  const { t, language } = useLanguage();

  // Input States
  const [amount, setAmount] = useState(""); // For MM: transaction value
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState(""); // For MM
  const [itemName, setItemName] = useState(""); // For Shop
  const [quantity, setQuantity] = useState(""); // For Shop
  const [networkName, setNetworkName] = useState(""); // For MM

  // **NEW STATE FOR COMMISSION**
  const [calculatedCommission, setCalculatedCommission] = useState(0);
  // **NEW STATE FOR AVAILABLE NETWORKS (optional, but good for UI pickers)**
  const [availableNetworks, setAvailableNetworks] = useState([]);

  // Voice Recognition States
  const [partialResults, setPartialResults] = useState([]);
  const [lastSpokenField, setLastSpokenField] = useState(null);
  const [isListeningAmount, setIsListeningAmount] = useState(false);
  const [isListeningCustomerPhoneNumber, setIsListeningCustomerPhoneNumber] =
    useState(false);
  const [isListeningItemName, setIsListeningItemName] = useState(false);
  const [isListeningQuantity, setIsListeningQuantity] = useState(false);
  const [isListeningNetworkName, setIsListeningNetworkName] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Indicates general loading for speech

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
    setIsLoading(false); // Reset general loading too
    setLastSpokenField(null);
  }, []);

  // Voice Recognition Handlers (No changes here, keeping for completeness)
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
        // Clean text based on field type
        let cleanedText = text;
        if (
          ["amount", "customerPhoneNumber", "quantity"].includes(
            lastSpokenField
          )
        ) {
          cleanedText =
            text
              .replace(/,|-|\s/g, "")
              .match(/\d+/g)
              ?.join("") || ""; // Extract only numbers
        }

        switch (lastSpokenField) {
          case "amount":
            setAmount(cleanedText);
            break;
          case "customerPhoneNumber":
            setCustomerPhoneNumber(cleanedText);
            break;
          case "itemName":
            setItemName(text); // Keep full text for item name
            break;
          case "quantity":
            setQuantity(cleanedText);
            break;
          case "networkName":
            setNetworkName(text); // Keep full text for network name
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
    // Check if Voice is defined before assigning listeners
    if (Voice) {
      Voice.onSpeechStart = onSpeechStart;
      Voice.onSpeechEnd = onSpeechEnd;
      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechError = onSpeechError;
      Voice.onSpeechPartialResults = onSpeechPartialResults;
    } else {
      console.warn(
        "Voice module is not available. Speech recognition will not work."
      );
      Toast.show({
        type: "error",
        text1: t("voice_module_missing_title"),
        text2: t("voice_module_missing_message"),
      });
    }

    return () => {
      if (Voice) {
        Voice.destroy().then(Voice.removeAllListeners);
      }
    };
  }, [
    onSpeechStart,
    onSpeechEnd,
    onSpeechResults,
    onSpeechError,
    onSpeechPartialResults,
    t,
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
      resetListeningStates(); // Ensure all states are reset before new start
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
    setCalculatedCommission(0); // <--- Clear calculated commission too
    resetListeningStates();
    Toast.show({
      type: "info",
      text1: t("inputs_cleared"),
    });
  }, [resetListeningStates, t]);

  // --- NEW: FETCH AVAILABLE NETWORKS ON MOUNT ---
  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const entries = await getFloatEntries();
        // Assuming itemName in floatEntries is the network name (e.g., "MTN Mobile Money")
        setAvailableNetworks(entries.map((entry) => entry.itemName));
      } catch (error) {
        console.error("Failed to fetch float entries:", error);
        Toast.show({
          type: "error",
          text1: t("error_fetching_networks"),
          text2: error.message || t("could_not_load_mobile_money_networks"),
        });
      }
    };

    if (isMobileMoneyAgent) {
      fetchNetworks();
    }
  }, [isMobileMoneyAgent, t]);

  // --- NEW: REAL-TIME COMMISSION CALCULATION ---
  useEffect(() => {
    const calculateAndSetCommission = async () => {
      if (isMobileMoneyAgent && networkName && amount && type) {
        const parsedAmount = parseFloat(amount);
        if (!isNaN(parsedAmount) && parsedAmount > 0) {
          // Map the 'type' prop to 'deposit'/'withdrawal' for calculateCommission
          const transactionTypeForCommission =
            type === "sell" ? "withdrawal" : "deposit";
          try {
            const commission = await calculateCommission(
              networkName,
              parsedAmount,
              transactionTypeForCommission
            );
            setCalculatedCommission(commission);
          } catch (error) {
            console.error("Error calculating commission:", error);
            // Optionally, set commission to 0 or display an error
            setCalculatedCommission(0);
            // Toast.show({
            //   type: "info",
            //   text1: t("commission_calculation_error"),
            //   text2: error.message,
            // });
          }
        } else {
          setCalculatedCommission(0); // Reset if amount is invalid
        }
      } else {
        setCalculatedCommission(0); // Reset if not MM or inputs are incomplete
      }
    };

    calculateAndSetCommission();
  }, [amount, networkName, type, isMobileMoneyAgent]); // Recalculate if these change

  const handleSubmit = async () => {
    let transactionData = {};
    let displayMessage = "";

    // Determine the actual transaction type based on 'isMobileMoneyAgent' and the 'type' prop from parent
    let actualTransactionType;
    if (!isMobileMoneyAgent) {
      actualTransactionType = type; // 'sell' or 'restock' from prop
    } else {
      // Map prop 'sell' to 'withdrawal', 'restock' to 'deposit' for MM context
      actualTransactionType = type === "sell" ? "withdrawal" : "deposit";
    }

    // Basic Validation
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
          customerIdentifier: null,
          networkName: null,
          commissionEarned: 0,
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
      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        Toast.show({ type: "error", text1: t("invalid_amount") });
        return;
      }

      // **Use the pre-calculated commission**
      const commission = calculatedCommission; // This will be 0 if calculation failed or inputs incomplete

      if (actualTransactionType === "deposit") {
        transactionData = {
          isMobileMoney: true,
          type: "restock", // For MM, deposit is agent 'restocking' float
          itemName: networkName.trim(), // Network name is the 'item' for MM
          quantity: numAmount, // Amount is the quantity for MM
          amount: numAmount, // Total amount of transaction
          customerIdentifier: customerPhoneNumber.trim(),
          networkName: networkName.trim(),
          commissionEarned: commission, // **Using the calculated commission**
        };
        displayMessage = `${t("transaction_type")}: ${t("deposit")}\n${t(
          "network_name"
        )}: ${networkName}\n${t(
          "customer_phone_number"
        )}: ${customerPhoneNumber}\n${t("amount")}: ${amount}\n${t(
          "commission"
        )}: ${commission.toFixed(2)}`; // Format commission for display
      } else if (actualTransactionType === "withdrawal") {
        transactionData = {
          isMobileMoney: true,
          type: "sell", // For MM, withdrawal is agent 'selling' float
          itemName: networkName.trim(), // Network name is the 'item' for MM
          quantity: numAmount, // Amount is the quantity for MM
          amount: numAmount, // Total amount of transaction
          customerIdentifier: customerPhoneNumber.trim(),
          networkName: networkName.trim(),
          commissionEarned: commission, // **Using the calculated commission**
        };
        displayMessage = `${t("transaction_type")}: ${t("withdrawal")}\n${t(
          "network_name"
        )}: ${networkName}\n${t(
          "customer_phone_number"
        )}: ${customerPhoneNumber}\n${t("amount")}: ${amount}\n${t(
          "commission"
        )}: ${commission.toFixed(2)}`; // Format commission for display
      }
    }

    Alert.alert(t("confirm_transaction"), displayMessage, [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("confirm"),
        onPress: async () => {
          try {
            await saveTransaction(transactionData);
            Toast.show({
              type: "success",
              text1: t("transaction_successful"),
              text2: isMobileMoneyAgent
                ? t("float_updated_and_commission_calculated")
                : t("inventory_updated"),
            });
            navigation.navigate("Home");
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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[
          styles.fullScreenContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <View style={styles.contentContainer}>
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

              {/* Display Calculated Commission */}
              {isMobileMoneyAgent &&
                networkName &&
                amount &&
                parseFloat(amount) > 0 && (
                  <View style={styles.commissionDisplayContainer}>
                    <Text
                      style={[styles.label, { color: colors.textSecondary }]}
                    >
                      {t("estimated_commission")}:
                    </Text>
                    <Text style={styles.commissionValue}>
                      UGX {calculatedCommission.toFixed(2)}
                    </Text>
                  </View>
                )}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6f6f6",
  },
  fullScreenContainer: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 20,
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
  // --- NEW STYLES FOR COMMISSION DISPLAY ---
  commissionDisplayContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#e8f5e9", // A light green background for emphasis
    borderWidth: 1,
    borderColor: "#a5d6a7", // A slightly darker green border
  },
  commissionValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32", // Darker green text
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
