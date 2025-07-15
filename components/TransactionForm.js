import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform, // <-- ADDED
  ActivityIndicator,
  StatusBar,
  Alert,
  PermissionsAndroid, // <-- ADDED
} from "react-native";
import Voice from "@react-native-voice/voice";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSelector } from "react-redux";
import { selectTheme } from "../features/themeSlice";

// Helper function to request microphone permission
const requestMicrophonePermission = async (t) => {
  if (Platform.OS === "android") {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: t("microphone_permission_title"), // e.g., "Microphone Permission"
          message: t("microphone_permission_message"), // e.g., "This app needs access to your microphone to enable voice input."
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
          text1: t("mic_permission_denied"), // e.g., "Microphone Permission Denied"
          text2: t("please_grant_mic_permission"), // e.g., "Please grant microphone permission in settings."
        });
        return false;
      }
    } catch (err) {
      console.warn("Error requesting microphone permission:", err);
      Toast.show({
        type: "error",
        text1: t("mic_permission_error"), // New key: e.g., "Permission Error"
        text2: err.message || t("failed_to_request_mic_permission"), // New key: e.g., "Failed to request microphone permission."
      });
      return false;
    }
  }
  // iOS handles permission prompts mostly automatically when Voice.start() is called
  // as long as infoPlist entries are correct in app.json.
  // We'll still return true for iOS here as the explicit Android runtime request is the focus.
  return true;
};

export default function TransactionForm({ isMobileMoneyAgent }) {
  const [amount, setAmount] = useState("");
  const [customerIdentifier, setCustomerIdentifier] = useState("");
  const [networkName, setNetworkName] = useState("");
  const [partialResults, setPartialResults] = useState([]);
  const [lastSpokenField, setLastSpokenField] = useState(null);

  const [isListeningAmount, setIsListeningAmount] = useState(false);
  const [isListeningCustomerIdentifier, setIsListeningCustomerIdentifier] =
    useState(false);
  const [isListeningNetworkName, setIsListeningNetworkName] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // To show loading state for speech recognition

  const { t, i18n } = useTranslation();
  const language = i18n.language; // 'en' or 'lg'

  const theme = useSelector(selectTheme);
  const { colors } = theme;

  // Refs for text inputs to focus them programmatically
  const amountInputRef = useRef(null);
  const customerIdentifierInputRef = useRef(null);
  const networkNameInputRef = useRef(null);

  const focusInput = (field) => {
    switch (field) {
      case "amount":
        amountInputRef.current?.focus();
        break;
      case "customerIdentifier":
        customerIdentifierInputRef.current?.focus();
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
    setIsListeningCustomerIdentifier(false);
    setIsListeningNetworkName(false);
    setIsLoading(false);
    setLastSpokenField(null);
  }, []);

  const onSpeechStart = useCallback((e) => {
    console.log("onSpeechStart: ", e);
    setIsLoading(true); // Indicate that speech recognition is active
  }, []);

  const onSpeechEnd = useCallback(
    (e) => {
      console.log("onSpeechEnd: ", e);
      resetListeningStates(); // Reset all listening states when speech ends
    },
    [resetListeningStates]
  );

  const onSpeechResults = useCallback(
    (e) => {
      console.log("onSpeechResults: ", e);
      if (e.value && e.value.length > 0) {
        const text = e.value[0];
        const cleanedText = text.replace(/,|-|\s/g, ""); // Remove commas, dashes, spaces for amount/identifier

        if (lastSpokenField === "amount") {
          const numericAmount = cleanedText.match(/\d+/g)?.join("") || ""; // Extract only digits
          setAmount(numericAmount);
        } else if (lastSpokenField === "customerIdentifier") {
          setCustomerIdentifier(cleanedText);
        } else if (lastSpokenField === "networkName") {
          setNetworkName(text); // Keep original text for network name
        }
      }
      resetListeningStates(); // Stop listening after results are processed
    },
    [lastSpokenField, resetListeningStates]
  );

  const onSpeechError = useCallback(
    (e) => {
      console.log("onSpeechError: ", e);
      if (e.error?.message === "not-authorized" || e.error?.code === "14") {
        // "not-authorized" is common on iOS, "14" is a common permission denied code for Android
        Alert.alert(
          t("permission_required_title"), // e.g., "Permission Required"
          t("microphone_access_needed"), // e.g., "Microphone access is required for voice input. Please enable it in your device settings."
          [
            {
              text: t("ok"), // e.g., "OK"
              onPress: () => console.log("Permission error acknowledged"),
            },
          ]
        );
      } else {
        Toast.show({
          type: "error",
          text1: t("speech_recognition_error"), // e.g., "Speech Recognition Error"
          text2: e.error?.message || t("an_unknown_error_occurred"), // e.g., "An unknown error occurred."
        });
      }
      resetListeningStates(); // Always reset on error
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
    // If another recognition is active, stop it first
    if (
      isListeningNetworkName ||
      isListeningAmount ||
      isListeningCustomerIdentifier
    ) {
      await stopRecognizing();
      resetListeningStates();
    }

    // --- NEW: Request permission before starting recognition ---
    const hasPermission = await requestMicrophonePermission(t);
    if (!hasPermission) {
      // Permission not granted, stop here.
      resetListeningStates();
      return;
    }
    // --- END NEW ---

    setLastSpokenField(field);
    setPartialResults([]);
    setIsLoading(true); // Set loading true while starting

    try {
      const langCode = language === "lg" ? "lg-UG" : "en-US";

      // Defensive check: Ensure Voice module is not null/undefined before using it
      if (!Voice || typeof Voice.start !== "function") {
        console.error(
          "Voice module not properly initialized. Cannot call Voice.start."
        );
        Toast.show({
          type: "error",
          text1: t("voice_module_error"), // e.g., "Voice Module Error"
          text2: t("initialization_failed"), // e.g., "Speech recognition module failed to initialize."
        });
        resetListeningStates();
        return;
      }

      await Voice.start(langCode);

      // Set the specific listening state only after Voice.start() is successfully called
      if (field === "amount") setIsListeningAmount(true);
      else if (field === "customerIdentifier")
        setIsListeningCustomerIdentifier(true);
      else if (field === "networkName") setIsListeningNetworkName(true);

      focusInput(field); // Focus the input field after starting
    } catch (e) {
      console.error("Error starting voice recognition:", e);
      Toast.show({
        type: "error",
        text1: t("voice_start_error"), // e.g., "Voice Start Error"
        text2: e.message || t("check_mic_permissions_or_rebuild"), // e.g., "Check microphone permissions or rebuild app."
      });
      resetListeningStates(); // Ensure all states are reset on error
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
        text1: t("voice_stop_error"), // e.g., "Voice Stop Error"
        text2: e.message || t("failed_to_stop_recognition"), // e.g., "Failed to stop speech recognition."
      });
    } finally {
      resetListeningStates(); // Always reset states
    }
  };

  const clearInputs = () => {
    setAmount("");
    setCustomerIdentifier("");
    setNetworkName("");
    setPartialResults([]);
    resetListeningStates();
    Toast.show({
      type: "info",
      text1: t("inputs_cleared"), // e.g., "Inputs Cleared"
    });
  };

  const handleSubmit = () => {
    if (
      !amount ||
      !customerIdentifier ||
      (isMobileMoneyAgent && !networkName)
    ) {
      Toast.show({
        type: "error",
        text1: t("all_fields_required"), // e.g., "All fields are required"
      });
      return;
    }

    Alert.alert(
      t("transaction_details"), // e.g., "Transaction Details"
      `${t("amount")}: ${amount}\n${t(
        "customer_identifier"
      )}: ${customerIdentifier}\n${
        isMobileMoneyAgent ? `${t("network_name")}: ${networkName}` : ""
      }`,
      [
        {
          text: t("cancel"),
          style: "cancel",
        },
        {
          text: t("confirm"),
          onPress: () => {
            // Process the transaction here
            Toast.show({
              type: "success",
              text1: t("transaction_successful"), // e.g., "Transaction Successful!"
            });
            clearInputs(); // Clear inputs after successful submission
          },
        },
      ]
    );
  };

  const getMicIconColor = (isListening) => {
    return isListening ? "#FF0000" : colors.text; // Red when listening, otherwise theme text color
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={theme.dark ? "light-content" : "dark-content"} />

      <Text style={[styles.title, { color: colors.text }]}>
        {t("transaction_form_title")}
      </Text>

      {/* Amount Input */}
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
            onChangeText={(text) => {
              setAmount(text.replace(/[^0-9]/g, "")); // Allow only numeric input
            }}
            placeholder={t("enter_amount")}
            placeholderTextColor={colors.placeholder}
            onFocus={() => {
              if (isListeningAmount) {
                stopRecognizing(); // Stop if already listening for this field
              }
              // Prevent mic from starting if keyboard is opened manually
              // We want mic to start only when mic icon is pressed
            }}
          />
          <TouchableOpacity
            style={styles.micButton}
            onPress={() =>
              isListeningAmount ? stopRecognizing() : startRecognizing("amount")
            }
          >
            {isLoading && isListeningAmount ? (
              <ActivityIndicator size="small" color="#FF0000" />
            ) : (
              <Ionicons
                name={isListeningAmount ? "mic" : "mic-outline"}
                size={24}
                color={getMicIconColor(isListeningAmount)}
              />
            )}
          </TouchableOpacity>
        </View>
        {isListeningAmount && partialResults.length > 0 && (
          <Text style={[styles.partialResult, { color: colors.textSecondary }]}>
            {t("listening")}: {partialResults[0]}
          </Text>
        )}
      </View>

      {/* Customer Identifier Input */}
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>
          {t("customer_identifier")}
        </Text>
        <View style={styles.inputWithMic}>
          <TextInput
            ref={customerIdentifierInputRef}
            style={[
              styles.input,
              { borderColor: colors.border, color: colors.text },
            ]}
            keyboardType="default"
            value={customerIdentifier}
            onChangeText={setCustomerIdentifier}
            placeholder={t("enter_customer_identifier")}
            placeholderTextColor={colors.placeholder}
            onFocus={() => {
              if (isListeningCustomerIdentifier) {
                stopRecognizing();
              }
            }}
          />
          <TouchableOpacity
            style={styles.micButton}
            onPress={() =>
              isListeningCustomerIdentifier
                ? stopRecognizing()
                : startRecognizing("customerIdentifier")
            }
          >
            {isLoading && isListeningCustomerIdentifier ? (
              <ActivityIndicator size="small" color="#FF0000" />
            ) : (
              <Ionicons
                name={isListeningCustomerIdentifier ? "mic" : "mic-outline"}
                size={24}
                color={getMicIconColor(isListeningCustomerIdentifier)}
              />
            )}
          </TouchableOpacity>
        </View>
        {isListeningCustomerIdentifier && partialResults.length > 0 && (
          <Text style={[styles.partialResult, { color: colors.textSecondary }]}>
            {t("listening")}: {partialResults[0]}
          </Text>
        )}
      </View>

      {/* Network Name Input (Conditional for Mobile Money Agent) */}
      {isMobileMoneyAgent && (
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
              onFocus={() => {
                if (isListeningNetworkName) {
                  stopRecognizing();
                }
              }}
            />
            <TouchableOpacity
              style={styles.micButton}
              onPress={() =>
                isListeningNetworkName
                  ? stopRecognizing()
                  : startRecognizing("networkName")
              }
            >
              {isLoading && isListeningNetworkName ? (
                <ActivityIndicator size="small" color="#FF0000" />
              ) : (
                <Ionicons
                  name={isListeningNetworkName ? "mic" : "mic-outline"}
                  size={24}
                  color={getMicIconColor(isListeningNetworkName)}
                />
              )}
            </TouchableOpacity>
          </View>
          {isListeningNetworkName && partialResults.length > 0 && (
            <Text
              style={[styles.partialResult, { color: colors.textSecondary }]}
            >
              {t("listening")}: {partialResults[0]}
            </Text>
          )}
        </View>
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

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
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

      <Toast />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
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
    overflow: "hidden", // Ensure gradient respects border radius
  },
  submitButton: {
    flex: 1,
    marginLeft: 10,
    borderRadius: 10,
    overflow: "hidden", // Ensure gradient respects border radius
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
