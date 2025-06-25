// components/TransactionForm.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import { useLanguage } from "../context/LanguageContext"; // Typo corrected: LanguageContext
import Icon from "react-native-vector-icons/MaterialCommunityIcons"; // You'll need to install this: npm install react-native-vector-icons
import { saveTransaction } from "../storage/transactionStorage";

// For voice recognition (UI elements only, actual logic to be implemented)
// import Voice from '@react-native-community/voice'; // Uncomment when ready to implement logic

export default function TransactionForm({ type, navigation }) {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  // const navigation = useNavigation();

  // State for voice recognition (UI elements only)
  const [isListeningItemName, setIsListeningItemName] = useState(false);
  const [isListeningQuantity, setIsListeningQuantity] = useState(false);

  const handleSubmit = async () => {
    if (!itemName.trim()) {
      Toast.show({
        type: "error",
        text1: t("item_name_required"),
      });
      return;
    }
    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      Toast.show({
        type: "error",
        text1: t("valid_quantity"),
      });
      return;
    }

    setLoading(true);
    try {
      await saveTransaction(type, { itemName, quantity: parsedQuantity });
      Toast.show({
        type: "success",
        text1: type === "sell" ? t("sale_recorded") : t("restock_recorded"),
      });
      setItemName("");
      setQuantity("");
      navigation.goBack(); // Go back to home or summary after successful transaction
    } catch (error) {
      console.error("Error submitting transaction:", error);
      Toast.show({
        type: "error",
        text1: t("error_saving"),
      });
    } finally {
      setLoading(false);
    }
  };

  // Placeholder functions for voice recognition
  const startListening = async (field) => {
    console.log(`Start listening for ${field}`);
    if (field === "itemName") setIsListeningItemName(true);
    if (field === "quantity") setIsListeningQuantity(true);
    // await Voice.start(language); // This would start the actual voice recognition
  };

  const stopListening = async (field) => {
    console.log(`Stop listening for ${field}`);
    if (field === "itemName") setIsListeningItemName(false);
    if (field === "quantity") setIsListeningQuantity(false);
    // await Voice.stop(); // This would stop the actual voice recognition
  };

  // You would typically have useEffects here to set up Voice listeners
  // and handle onSpeechResults, onSpeechError, etc.

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
    >
      <View style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t("item_name")}</Text>
          <View style={styles.inputWithIcon}>
            <TextInput
              style={styles.input}
              placeholder={t("item_name_placeholder")}
              value={itemName}
              onChangeText={setItemName}
            />
            <TouchableOpacity
              style={styles.micButton}
              onPress={() =>
                isListeningItemName
                  ? stopListening("itemName")
                  : startListening("itemName")
              }
            >
              <Icon
                name={isListeningItemName ? "microphone-off" : "microphone"}
                size={24}
                color={isListeningItemName ? "#d9534f" : "#007bff"}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t("quantity")}</Text>
          <View style={styles.inputWithIcon}>
            <TextInput
              style={styles.input}
              placeholder={t("quantity_placeholder")}
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
            />
            <TouchableOpacity
              style={styles.micButton}
              onPress={() =>
                isListeningQuantity
                  ? stopListening("quantity")
                  : startListening("quantity")
              }
            >
              <Icon
                name={isListeningQuantity ? "microphone-off" : "microphone"}
                size={24}
                color={isListeningQuantity ? "#d9534f" : "#007bff"}
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {t("record_transaction")}
            </Text>
          )}
        </TouchableOpacity>
        <Text style={styles.tipText}>{t("tip_transaction")}</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f4f6f8",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 25,
    width: "100%",
    maxWidth: 400,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fcfcfc",
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#333",
  },
  micButton: {
    padding: 8,
    marginLeft: 10,
  },
  submitButton: {
    backgroundColor: "#007bff",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  tipText: {
    marginTop: 20,
    textAlign: "center",
    color: "#666",
    fontSize: 13,
    fontStyle: "italic",
  },
});
