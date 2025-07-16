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
  StatusBar,
  Alert,
  PermissionsAndroid,
} from "react-native";
import Voice from "@react-native-voice/voice";
import { useLanguage } from "../context/LanguageContext"; // Assuming this path is correct
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
// REMOVED: import { useSelector } from "react-redux";
// REMOVED: import { selectTheme } from "../features/themeSlice";

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
  const [isLoading, setIsLoading] = useState(false);

  const { t, language } = useLanguage();

  // HARDCODED COLORS - Since Redux theme is removed
  const colors = {
    background: "#f8f8f8", // Light background
    text: "#333333", // Dark text
    textSecondary: "#666666", // Lighter text for partial results
    border: "#cccccc", // Border color for inputs
    placeholder: "#999999", // Placeholder text color
  };

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
        const cleanedText = text.replace(/,|-|\s/g, "");

        if (lastSpokenField === "amount") {
          const numericAmount = cleanedText.match(/\d+/g)?.join("") || "";
          setAmount(numericAmount);
        } else if (lastSpokenField === "customerIdentifier") {
          setCustomerIdentifier(cleanedText);
        } else if (lastSpokenField === "networkName") {
          setNetworkName(text);
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
    if (
      isListeningNetworkName ||
      isListeningAmount ||
      isListeningCustomerIdentifier
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

      if (field === "amount") setIsListeningAmount(true);
      else if (field === "customerIdentifier")
        setIsListeningCustomerIdentifier(true);
      else if (field === "networkName") setIsListeningNetworkName(true);

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

  const clearInputs = () => {
    setAmount("");
    setCustomerIdentifier("");
    setNetworkName("");
    setPartialResults([]);
    resetListeningStates();
    Toast.show({
      type: "info",
      text1: t("inputs_cleared"),
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
        text1: t("all_fields_required"),
      });
      return;
    }

    Alert.alert(
      t("transaction_details"),
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
            Toast.show({
              type: "success",
              text1: t("transaction_successful"),
            });
            clearInputs();
          },
        },
      ]
    );
  };

  const getMicIconColor = (isListening) => {
    return isListening ? "#FF0000" : colors.text;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      // Renamed from 'container' and removed padding here to allow background to extend fully
      style={[
        styles.fullScreenContainer,
        { backgroundColor: colors.background },
      ]}
    >
      {/* StatusBar style adjusted for light background */}
      {/* Set translucent to true and backgroundColor to transparent to allow content behind */}
      <StatusBar
        barStyle={"dark-content"}
        translucent={true}
        backgroundColor="transparent"
      />
      {/* New container for content with padding, to push content below the status bar */}
      <View style={styles.contentContainer}>

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
                setAmount(text.replace(/[^0-9]/g, ""));
              }}
              placeholder={t("enter_amount")}
              placeholderTextColor={colors.placeholder}
              onFocus={() => {
                if (isListeningAmount) {
                  stopRecognizing();
                }
              }}
            />
            <TouchableOpacity
              style={styles.micButton}
              onPress={() =>
                isListeningAmount
                  ? stopRecognizing()
                  : startRecognizing("amount")
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
            <Text
              style={[styles.partialResult, { color: colors.textSecondary }]}
            >
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
            <Text
              style={[styles.partialResult, { color: colors.textSecondary }]}
            >
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
      </View>{" "}
      {/* End of contentContainer */}
      <Toast />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    // Renamed from 'container'
    flex: 1,
    // Removed padding here to allow background to extend
  },
  contentContainer: {
    // New container for content with padding
    flex: 1,
    padding: 20, // Apply padding here for content
    // Add status bar height for Android to push content down, iOS is handled by KeyboardAvoidingView behavior="padding"
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 20 : 20,
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
