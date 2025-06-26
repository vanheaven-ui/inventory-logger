// components/TransactionForm.js
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
} from "react-native";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import { useLanguage } from "../context/LanguageContext";
import { Ionicons } from "@expo/vector-icons";
import { saveTransaction, getInventory } from "../storage/transactionStorage"; // Import getInventory

// MOCK Voice recognition for demonstration.
// In a real React Native app, you would uncomment and use:
// import Voice from '@react-native-community/voice';

export default function TransactionForm({ type, navigation }) {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const { t, language } = useLanguage();
  const nav = useNavigation();

  // State for voice recognition (UI elements only)
  const [isListeningItemName, setIsListeningItemName] = useState(false);
  const [isListeningQuantity, setIsListeningQuantity] = useState(false);
  const [speechResult, setSpeechResult] = useState("");

  // MOCK VOICE RECOGNITION FUNCTIONS
  const mockStartListening = useCallback((field) => {
    console.log(`MOCK: Starting listening for ${field}`);
    if (field === "itemName") setIsListeningItemName(true);
    if (field === "quantity") setIsListeningQuantity(true);
    setSpeechResult("");

    setTimeout(() => {
      let mockResult = "";
      if (field === "itemName") {
        const mockItems = [
          "Sugar",
          "Salt",
          "Milk",
          "Bread",
          "Soap",
          "Rice",
          "Flour",
          "Eggs",
          "Soda",
        ];
        mockResult = mockItems[Math.floor(Math.random() * mockItems.length)];
      } else if (field === "quantity") {
        mockResult = (Math.floor(Math.random() * 10) + 1).toString();
      }
      setSpeechResult(mockResult);
      Toast.show({
        type: "info",
        text1: `Voice Input (${field}): ${mockResult}`,
        visibilityTime: 2000,
      });
      console.log(`MOCK: Received speech result for ${field}: ${mockResult}`);
    }, 2000);
  }, []);

  const mockStopListening = useCallback((field) => {
    console.log(`MOCK: Stopping listening for ${field}`);
    if (field === "itemName") setIsListeningItemName(false);
    if (field === "quantity") setIsListeningQuantity(false);
  }, []);

  useEffect(() => {
    if (speechResult) {
      if (isListeningItemName) {
        setItemName(speechResult);
        setIsListeningItemName(false);
      } else if (isListeningQuantity) {
        setQuantity(speechResult);
        setIsListeningQuantity(false);
      }
      setSpeechResult("");
    }
  }, [
    speechResult,
    isListeningItemName,
    isListeningQuantity,
    setItemName,
    setQuantity,
  ]);

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
      let transactionSuccess = false;
      const currentInventory = await getInventory();
      const existingItem = currentInventory.find(
        (item) => item.itemName.toLowerCase() === itemName.trim().toLowerCase()
      );

      if (type === "sell") {
        if (!existingItem) {
          Toast.show({
            type: "error",
            text1: t("item_not_found"),
          });
          setLoading(false);
          return;
        }
        if (existingItem.currentStock < parsedQuantity) {
          Toast.show({
            type: "error",
            text1: t("insufficient_stock"),
          });
          setLoading(false);
          return;
        }
        // If selling, use existing cost/selling price for transaction record consistency
        transactionSuccess = await saveTransaction(type, {
          itemName: itemName.trim(),
          quantity: parsedQuantity,
          costPrice: existingItem.costPricePerUnit, // Pass existing prices
          sellingPrice: existingItem.sellingPricePerUnit,
        });
      } else if (type === "restock") {
        // For restock, if new item, default prices to 0. User can later edit via Manage Item.
        transactionSuccess = await saveTransaction(type, {
          itemName: itemName.trim(),
          quantity: parsedQuantity,
          costPrice: existingItem ? existingItem.costPricePerUnit : 0,
          sellingPrice: existingItem ? existingItem.sellingPricePerUnit : 0,
        });
      }

      if (transactionSuccess) {
        Toast.show({
          type: "success",
          text1: type === "sell" ? t("sale_recorded") : t("restock_recorded"),
        });
        setItemName("");
        setQuantity("");
        nav.goBack();
      } else {
        // This 'else' block would catch other internal saveTransaction failures
        // which are already logged internally, but providing a generic error here
        Toast.show({
          type: "error",
          text1: t("error_saving"),
        });
      }
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
    >
      <View style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t("item_name")}</Text>
          <View style={styles.inputWithIonicons}>
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
                  ? mockStopListening("itemName")
                  : mockStartListening("itemName")
              }
            >
              <Ionicons
                name={isListeningItemName ? "mic-off" : "mic"}
                size={24}
                color={isListeningItemName ? "#d9534f" : "#007bff"}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t("quantity")}</Text>
          <View style={styles.inputWithIonicons}>
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
                  ? mockStopListening("quantity")
                  : mockStartListening("quantity")
              }
            >
              <Ionicons
                name={isListeningQuantity ? "mic-off" : "mic"}
                size={24}
                color={isListeningQuantity ? "#d9534f" : "#007bff"}
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading || isListeningItemName || isListeningQuantity}
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
  inputWithIonicons: {
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
