import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Alert,
} from "react-native";
import Toast from "react-native-toast-message";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { useLanguage } from "../context/LanguageContext";
import { Ionicons } from "@expo/vector-icons";
// CHANGED: Import from the new package
import Voice from "@react-native-voice/voice";

import {
  saveTransaction,
  getGeneralInventoryItems,
  getFloatEntries,
  updateGeneralInventoryItem,
  updateFloatEntry,
  calculateCommission,
} from "../storage/transactionStorage";

export default function TransactionForm({ isMobileMoneyAgent }) {
  const route = useRoute();
  const { type } = route.params; // 'sell' or 'restock' from TransactionScreen

  const [networkName, setNetworkName] = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [customerIdentifier, setCustomerIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const { t, language } = useLanguage();
  const nav = useNavigation();

  // Voice Recognition States
  const [isListeningNetworkName, setIsListeningNetworkName] = useState(false);
  const [isListeningAmount, setIsListeningAmount] = useState(false);
  const [isListeningCustomerIdentifier, setIsListeningCustomerIdentifier] =
    useState(false);
  const [partialResults, setPartialResults] = useState([]);
  const [lastSpokenField, setLastSpokenField] = useState(null);

  // --- VOICE RECOGNITION IMPLEMENTATION ---
  useEffect(() => {
    // Set up voice event listeners
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechPartialResults = onSpeechPartialResults;
    Voice.onSpeechError = onSpeechError;
    // Optional: You might also want to add onSpeechVolumeChanged for visual feedback
    // Voice.onSpeechVolumeChanged = onSpeechVolumeChanged;

    // Clean up listeners on unmount
    return () => {
      // It's good practice to ensure destroy is called safely
      Voice.destroy()
        .then(Voice.removeAllListeners)
        .catch((e) => console.error("Error destroying Voice instance:", e));
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        // Ensure voice recognition stops when the screen loses focus
        stopRecognizing();
        resetListeningStates();
      };
    }, [])
  );

  const resetListeningStates = () => {
    setIsListeningNetworkName(false);
    setIsListeningAmount(false);
    setIsListeningCustomerIdentifier(false);
    setPartialResults([]);
    setLastSpokenField(null);
  };

  const onSpeechStart = useCallback(
    (e) => {
      console.log("onSpeechStart: ", e);
      // The `started` property indicates if the recognition started successfully
      if (e.error === false) {
        // Check for explicit error: false
        if (lastSpokenField === "networkName") setIsListeningNetworkName(true);
        else if (lastSpokenField === "transactionAmount")
          setIsListeningAmount(true);
        else if (lastSpokenField === "customerIdentifier")
          setIsListeningCustomerIdentifier(true);
        setPartialResults([]);
      } else {
        // Handle cases where onSpeechStart fires but with an error, though less common
        console.warn("Speech start event with error:", e);
        resetListeningStates();
      }
    },
    [lastSpokenField]
  );

  const onSpeechEnd = useCallback((e) => {
    console.log("onSpeechEnd: ", e);
    // onSpeechEnd indicates the recognition session has finished,
    // regardless of whether results were found.
    resetListeningStates();
  }, []);

  const onSpeechResults = useCallback(
    (e) => {
      console.log("onSpeechResults: ", e);
      if (e.value && e.value.length > 0) {
        const recognizedText = e.value[0];
        applyVoiceResultToField(recognizedText, lastSpokenField);
      } else {
        // If no value is returned, it means no clear speech was recognized
        Toast.show({
          type: "info",
          text1: t("no_speech_detected"),
          text2: t("please_try_again_clearer"),
        });
      }
      resetListeningStates(); // Reset after results are processed
    },
    [lastSpokenField, t]
  );

  const onSpeechPartialResults = useCallback((e) => {
    console.log("onSpeechPartialResults: ", e);
    if (e.value) {
      setPartialResults(e.value);
    }
  }, []);

  const onSpeechError = useCallback(
    (e) => {
      console.log("onSpeechError: ", e);
      resetListeningStates();
      let errorMessage = t("try_again_or_check_settings");
      if (e.error) {
        // More specific error handling based on common codes
        switch (e.error.code) {
          case "3": // ERROR_AUDIO: Client side error while recording audio.
            errorMessage = t("mic_audio_error");
            break;
          case "6": // ERROR_NO_MATCH: No recognition result matched.
            errorMessage = t("no_match_found");
            break;
          case "7": // ERROR_SPEECH_TIMEOUT: No speech input.
            errorMessage = t("speech_timeout");
            break;
          case "8": // ERROR_TOO_MANY_REQUESTS: Too many requests for speech recognition.
            errorMessage = t("too_many_requests");
            break;
          case "9": // ERROR_CLIENT: Client side error.
            errorMessage = t("general_client_error");
            break;
          case "11": // ERROR_PERMISSION_DENIED
            errorMessage = t("mic_permission_denied");
            break;
          default:
            errorMessage = e.error.message || t("try_again_or_check_settings");
        }
      }

      Toast.show({
        type: "error",
        text1: t("voice_recognition_error"),
        text2: errorMessage,
      });
    },
    [t]
  );

  const startRecognizing = async (field) => {
    // If another recognition is active, stop it first
    if (
      isListeningNetworkName ||
      isListeningAmount ||
      isListeningCustomerIdentifier
    ) {
      await stopRecognizing();
      resetListeningStates();
    }

    setLastSpokenField(field);
    setPartialResults([]);

    try {
      // Ensure the language code is correctly formatted for the library.
      // 'lg' is Luganda. Check if 'lg-UG' is specifically supported by the underlying ASR.
      // 'en-UG' for English (Uganda)
      const langCode = language === "lg" ? "lg-UG" : "en-US"; // 'en-US' is a safe fallback if 'en-UG' isn't explicitly supported by the device's engine

      // The new package returns a Promise, which is cleaner
      await Voice.start(langCode);

      // Update listening state only if start was successful
      if (field === "networkName") setIsListeningNetworkName(true);
      else if (field === "transactionAmount") setIsListeningAmount(true);
      else if (field === "customerIdentifier")
        setIsListeningCustomerIdentifier(true);

      Toast.show({
        type: "info",
        text1: t("speak_now"),
        text2: t("listening_for_field", { field: t(field) }),
      });
    } catch (e) {
      console.error("Error starting voice recognition:", e);
      Toast.show({
        type: "error",
        text1: t("voice_start_error"),
        text2: e.message || t("check_mic_permissions"),
      });
      resetListeningStates();
    }
  };

  const stopRecognizing = async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.error("Error stopping voice recognition:", e);
    } finally {
      resetListeningStates(); // Ensure states are reset even if stop fails
    }
  };

  const applyVoiceResultToField = useCallback(
    (result, field) => {
      const cleanedResult = result.trim();
      if (!cleanedResult) {
        Toast.show({
          type: "info",
          text1: t("no_speech_detected"),
          text2: t("please_try_again_clearer"),
        });
        return;
      }

      switch (field) {
        case "networkName":
          setNetworkName(cleanedResult);
          break;
        case "transactionAmount":
          // Added more robust parsing for amounts from voice
          const parsedAmount = cleanedResult.replace(/[^0-9.]/g, ""); // Remove non-numeric/non-dot characters
          if (parsedAmount) {
            setTransactionAmount(parsedAmount);
          } else {
            Toast.show({
              type: "error",
              text1: t("invalid_amount_voice"),
              text2: t("please_speak_clearly"),
            });
          }
          break;
        case "customerIdentifier":
          setCustomerIdentifier(cleanedResult);
          break;
        default:
          console.warn("Unknown field for voice input:", field);
      }
    },
    [t]
  );

  const getSubmitButtonText = useCallback(() => {
    if (isMobileMoneyAgent) {
      if (type === "sell") {
        return t("record_withdrawal");
      } else {
        return t("record_deposit");
      }
    } else {
      if (type === "sell") {
        return t("record_sale");
      } else {
        return t("record_restock");
      }
    }
  }, [isMobileMoneyAgent, type, t]);

  const handleSubmit = async () => {
    await stopRecognizing(); // Stop any active listening before submission
    resetListeningStates(); // Ensure states are reset

    const isWithdrawal = type === "sell";
    const parsedAmount = parseFloat(transactionAmount);

    if (!networkName.trim()) {
      Toast.show({
        type: "error",
        text1: t("network_name_required"),
      });
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Toast.show({
        type: "error",
        text1: t("valid_amount_required"),
      });
      return;
    }

    if (isMobileMoneyAgent && isWithdrawal && !customerIdentifier.trim()) {
      Toast.show({
        type: "error",
        text1: t("customer_id_required_for_withdrawal"),
      });
      return;
    }

    setLoading(true);
    try {
      let transactionPayload = {
        id: Date.now().toString(),
        type: type,
        itemName: networkName,
        quantity: parsedAmount,
        customer: customerIdentifier,
        isMobileMoneyAgent: isMobileMoneyAgent,
        timestamp: new Date().toISOString(),
      };

      if (!isMobileMoneyAgent) {
        let currentItems = await getGeneralInventoryItems();
        let existingItem = currentItems.find(
          (item) => item.itemName?.toLowerCase() === networkName.toLowerCase()
        );

        if (existingItem) {
          transactionPayload.costPrice = existingItem.costPricePerUnit;
          transactionPayload.sellingPrice = existingItem.sellingPricePerUnit;
          if (type === "sell") {
            transactionPayload.amount =
              parsedAmount * existingItem.sellingPricePerUnit;
          } else if (type === "restock") {
            transactionPayload.amount =
              parsedAmount * existingItem.costPricePerUnit;
          }

          const updatedQuantity =
            type === "sell"
              ? existingItem.currentStock - parsedAmount
              : existingItem.currentStock + parsedAmount;
          await updateGeneralInventoryItem({
            ...existingItem,
            currentStock: updatedQuantity,
          });

          await saveTransaction(transactionPayload);
          Toast.show({ type: "success", text1: t("transaction_recorded") });
          nav.goBack();
        } else {
          Toast.show({
            type: "error",
            text1: t("item_not_found_in_inventory"),
            text2: t("please_add_item_first"),
            visibilityTime: 4000,
          });

          nav.navigate("ManageItem", {
            itemName: networkName,
            isNewItem: true,
          });
        }
      } else {
        transactionPayload.amount = parsedAmount;
        const commission = await calculateCommission(
          networkName,
          parsedAmount,
          type
        );
        transactionPayload.commissionEarned = commission;

        let currentFloatEntries = await getFloatEntries();
        let existingFloat = currentFloatEntries.find(
          (entry) => entry.itemName?.toLowerCase() === networkName.toLowerCase()
        );

        if (existingFloat) {
          const updatedFloatValue =
            type === "sell" // withdrawal
              ? existingFloat.currentStock - parsedAmount
              : existingFloat.currentStock + parsedAmount; // deposit
          await updateFloatEntry({
            ...existingFloat,
            currentStock: updatedFloatValue,
          });
        } else {
          console.warn(
            `Float entry for network "${networkName}" not found. It will be added as a new float entry by saveTransaction.`
          );
        }
        await saveTransaction(transactionPayload);
        Toast.show({ type: "success", text1: t("transaction_recorded") });
        nav.goBack();
      }
    } catch (error) {
      console.error("Error submitting transaction:", error);
      Toast.show({
        type: "error",
        text1: t("error_submitting_transaction"),
        text2: error.message || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMicIconName = (field) => {
    if (field === "networkName" && isListeningNetworkName) return "mic";
    if (field === "transactionAmount" && isListeningAmount) return "mic";
    if (field === "customerIdentifier" && isListeningCustomerIdentifier)
      return "mic";
    return "mic-outline";
  };

  const getMicButtonColor = (field) => {
    if (
      (field === "networkName" && isListeningNetworkName) ||
      (field === "transactionAmount" && isListeningAmount) ||
      (field === "customerIdentifier" && isListeningCustomerIdentifier)
    ) {
      return styles.colors.activeMic; // Red when active to indicate recording
    }
    return styles.colors.primary; // Blue when inactive
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={
        Platform.OS === "ios" ? 0 : StatusBar.currentHeight + 20
      }
    >
      <View style={styles.form}>
        {(isListeningNetworkName ||
          isListeningAmount ||
          isListeningCustomerIdentifier) && (
          <View style={styles.voiceStatusContainer}>
            <ActivityIndicator size="small" color={styles.colors.primary} />
            <Text style={styles.voiceStatusText}>{t("listening")}...</Text>
            {partialResults.length > 0 && (
              <Text style={styles.partialResultsText}>{partialResults[0]}</Text>
            )}
          </View>
        )}

        <Text style={styles.label}>
          {isMobileMoneyAgent ? t("network_name") : t("item_name")}
        </Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={networkName}
            onChangeText={setNetworkName}
            placeholder={
              isMobileMoneyAgent ? t("enter_network") : t("enter_item_name")
            }
            placeholderTextColor={styles.colors.placeholderText}
          />
          <TouchableOpacity
            onPress={() => startRecognizing("networkName")}
            style={styles.micButton}
            disabled={loading}
          >
            <Ionicons
              name={getMicIconName("networkName")}
              size={28}
              color={getMicButtonColor("networkName")}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>
          {isMobileMoneyAgent ? t("transaction_amount") : t("quantity")}
        </Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={transactionAmount}
            onChangeText={setTransactionAmount}
            keyboardType="numeric"
            placeholder={
              isMobileMoneyAgent ? t("enter_amount") : t("enter_quantity")
            }
            placeholderTextColor={styles.colors.placeholderText}
          />
          <TouchableOpacity
            onPress={() => startRecognizing("transactionAmount")}
            style={styles.micButton}
            disabled={loading}
          >
            <Ionicons
              name={getMicIconName("transactionAmount")}
              size={28}
              color={getMicButtonColor("transactionAmount")}
            />
          </TouchableOpacity>
        </View>

        {isMobileMoneyAgent && type === "sell" && (
          <>
            <Text style={styles.label}>{t("customer_identifier")}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={customerIdentifier}
                onChangeText={setCustomerIdentifier}
                placeholder={t("enter_customer_phone_or_name")}
                placeholderTextColor={styles.colors.placeholderText}
              />
              <TouchableOpacity
                onPress={() => startRecognizing("customerIdentifier")}
                style={styles.micButton}
                disabled={loading}
              >
                <Ionicons
                  name={getMicIconName("customerIdentifier")}
                  size={28}
                  color={getMicButtonColor("customerIdentifier")}
                />
              </TouchableOpacity>
            </View>
          </>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={styles.colors.primary} />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>{getSubmitButtonText()}</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Define a color palette for easier management
  colors: {
    primary: "#0F4C81", // A deep, strong blue (common in finance/tech)
    secondary: "#FFAA00", // A vibrant orange/yellow (can be used for accents or warnings)
    success: "#28a745", // Standard green for success
    danger: "#dc3545", // Standard red for errors/active mic
    textPrimary: "#333333",
    textSecondary: "#666666",
    placeholderText: "#999999",
    background: "#F8F9FA", // Light grey-white background
    cardBackground: "#FFFFFF", // Pure white for forms/cards
    borderColor: "#DDDDDD",
    activeMic: "#dc3545", // Red when mic is active
  },
  container: {
    flex: 1,
    backgroundColor: "#F0F4F7", // Slightly off-white/light blue for a softer feel
    justifyContent: "center",
    padding: 20,
  },
  form: {
    backgroundColor: "#FFFFFF", // Pure white for the form card
    borderRadius: 12, // Slightly larger border radius for a softer look
    padding: 25, // More padding inside the form
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 }, // More pronounced shadow
    shadowOpacity: 0.15, // A bit more opaque shadow
    shadowRadius: 10,
    elevation: 8, // Higher elevation for Android shadow
  },
  label: {
    fontSize: 17, // Slightly larger font size for readability
    marginBottom: 8,
    color: "#333333", // Darker text for better contrast
    fontWeight: "600", // Stronger font weight
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20, // More space between input fields
    borderWidth: 1,
    borderColor: "#CCCCCC", // Lighter border
    borderRadius: 10, // Matching the form's border radius
    backgroundColor: "#FDFDFD", // Very light background for inputs
  },
  input: {
    flex: 1,
    paddingVertical: 14, // More vertical padding
    paddingHorizontal: 15,
    fontSize: 17, // Larger text in inputs
    color: "#333333",
  },
  micButton: {
    padding: 12, // Larger padding for easier tap
  },
  button: {
    backgroundColor: "#0F4C81", // Use the primary blue
    paddingVertical: 18, // Taller button for easier tap
    borderRadius: 10, // Matching other rounded elements
    alignItems: "center",
    marginTop: 25, // More space above the button
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 19, // Larger text in button
    fontWeight: "700", // Bold text
  },
  voiceStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12, // More padding
    backgroundColor: "#EBF5FF", // Lighter blue for status
    borderRadius: 10,
    marginBottom: 20, // More space below status
    borderWidth: 1,
    borderColor: "#CDE0F6", // A complementary border
  },
  voiceStatusText: {
    marginLeft: 12, // More space from spinner
    fontSize: 16,
    color: "#0056B3", // Darker blue for status text
    fontWeight: "500",
  },
  partialResultsText: {
    marginTop: 8, // More space
    fontSize: 15, // Slightly larger
    color: "#0056B3",
    fontStyle: "italic",
    textAlign: "center",
    flexShrink: 1, // Allow text to wrap
    paddingHorizontal: 10,
  },
});
