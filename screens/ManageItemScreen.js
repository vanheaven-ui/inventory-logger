// screens/ManageItemScreen.js
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useLanguage } from "../context/LanguageContext";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Ionicons } from "@expo/vector-icons";
import { saveInventoryItem } from "../storage/transactionStorage"; // Make sure this function correctly handles both add and update
import Toast from "react-native-toast-message";

export default function ManageItemScreen({ route }) {
  const navigation = useNavigation();
  const { t } = useLanguage();
  // Item passed for editing. If it's an edit, existingItem will have an 'id'.
  const existingItem = route.params?.item || null;

  const [itemName, setItemName] = useState(
    existingItem ? existingItem.itemName : ""
  );
  const [currentStock, setCurrentStock] = useState(
    existingItem ? String(existingItem.currentStock) : ""
  );
  const [costPricePerUnit, setCostPricePerUnit] = useState(
    existingItem ? String(existingItem.costPricePerUnit) : ""
  );
  const [sellingPricePerUnit, setSellingPricePerUnit] = useState(
    existingItem ? String(existingItem.sellingPricePerUnit) : ""
  );
  const [loading, setLoading] = useState(false);

  // States for voice recognition
  const [isListeningItemName, setIsListeningItemName] = useState(false);
  const [isListeningCurrentStock, setIsListeningCurrentStock] = useState(false);
  const [isListeningCostPrice, setIsListeningCostPrice] = useState(false);
  const [isListeningSellingPrice, setIsListeningSellingPrice] = useState(false);
  const [speechResult, setSpeechResult] = useState("");
  const [activeVoiceField, setActiveVoiceField] = useState(null); // To track which field is currently listening

  // MOCK VOICE RECOGNITION FUNCTIONS
  // Simplified startListening to ensure only one field is listening at a time
  const mockStartListening = useCallback(
    (field) => {
      // Prevent starting if another field is already listening
      if (activeVoiceField) {
        Toast.show({
          type: "info",
          text1: "Please wait, another voice input is active.",
          visibilityTime: 2000,
        });
        return;
      }

      console.log(`MOCK: Starting listening for ${field}`);
      setActiveVoiceField(field); // Set active field
      setSpeechResult(""); // Clear previous result

      // Reset all listening states first
      setIsListeningItemName(false);
      setIsListeningCurrentStock(false);
      setIsListeningCostPrice(false);
      setIsListeningSellingPrice(false);

      // Set the specific field to listening
      if (field === "itemName") setIsListeningItemName(true);
      else if (field === "currentStock") setIsListeningCurrentStock(true);
      else if (field === "costPricePerUnit") setIsListeningCostPrice(true);
      else if (field === "sellingPricePerUnit")
        setIsListeningSellingPrice(true);

      // Simulate speech recognition result after a delay
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
            "Milo",
            "Coffee",
          ];
          mockResult = mockItems[Math.floor(Math.random() * mockItems.length)];
        } else if (field === "currentStock") {
          mockResult = (Math.floor(Math.random() * 100) + 1).toString(); // Random stock up to 100
        } else if (field === "costPricePerUnit") {
          mockResult = (Math.floor(Math.random() * 5000) + 500).toString(); // Random price 500-5500
        } else if (field === "sellingPricePerUnit") {
          mockResult = (Math.floor(Math.random() * 7000) + 1000).toString(); // Random price 1000-8000
        }
        setSpeechResult(mockResult); // Set the result
        Toast.show({
          type: "info",
          text1: `${t("voice_input_for")} ${field}: ${mockResult}`, // Added translation for voice input
          visibilityTime: 2000,
        });
        console.log(`MOCK: Received speech result for ${field}: ${mockResult}`);
        // No need to stop listening here, useEffect handles setting the value and resetting states
      }, 2000); // Simulate 2 seconds of listening
    },
    [activeVoiceField, t]
  ); // Added t as a dependency for translation

  const mockStopListening = useCallback((field) => {
    console.log(`MOCK: Stopping listening for ${field}`);
    // Immediately stop the specific listening state
    if (field === "itemName") setIsListeningItemName(false);
    else if (field === "currentStock") setIsListeningCurrentStock(false);
    else if (field === "costPricePerUnit") setIsListeningCostPrice(false);
    else if (field === "sellingPricePerUnit") setIsListeningSellingPrice(false);

    setActiveVoiceField(null); // Clear active field
    setSpeechResult(""); // Clear any pending speech result if stopped manually
  }, []);

  // Effect to apply speech result to the correct input field
  useEffect(() => {
    if (speechResult && activeVoiceField) {
      if (activeVoiceField === "itemName") {
        setItemName(speechResult);
      } else if (activeVoiceField === "currentStock") {
        setCurrentStock(speechResult);
      } else if (activeVoiceField === "costPricePerUnit") {
        setCostPricePerUnit(speechResult);
      } else if (activeVoiceField === "sellingPricePerUnit") {
        setSellingPricePerUnit(speechResult);
      }
      setSpeechResult(""); // Clear the result after use
      setActiveVoiceField(null); // Reset active voice field

      // Ensure all listening flags are reset after a result is applied
      setIsListeningItemName(false);
      setIsListeningCurrentStock(false);
      setIsListeningCostPrice(false);
      setIsListeningSellingPrice(false);
    }
  }, [
    speechResult,
    activeVoiceField,
    setItemName,
    setCurrentStock,
    setCostPricePerUnit,
    setSellingPricePerUnit,
  ]);

  const handleSubmit = async () => {
    // Disable submission if any voice listening is active
    if (
      isListeningItemName ||
      isListeningCurrentStock ||
      isListeningCostPrice ||
      isListeningSellingPrice
    ) {
      Toast.show({
        type: "info",
        text1: t("wait_for_voice_input"), // Using translation key
      });
      return;
    }

    if (!itemName.trim()) {
      Toast.show({ type: "error", text1: t("item_name_required") });
      return;
    }
    const parsedStock = parseInt(currentStock);
    if (isNaN(parsedStock) || parsedStock < 0) {
      Toast.show({ type: "error", text1: t("valid_quantity") });
      return;
    }
    const parsedCostPrice = parseFloat(costPricePerUnit);
    if (isNaN(parsedCostPrice) || parsedCostPrice < 0) {
      Toast.show({
        type: "error",
        text1: t("valid_cost_price"),
      });
      return;
    }
    const parsedSellingPrice = parseFloat(sellingPricePerUnit);
    if (isNaN(parsedSellingPrice) || parsedSellingPrice < 0) {
      Toast.show({
        type: "error",
        text1: t("valid_selling_price"),
      });
      return;
    }
    if (parsedSellingPrice < parsedCostPrice) {
      Toast.show({
        type: "error",
        text1: t("selling_price_less_than_cost"), // New translation key
      });
      return;
    }

    setLoading(true);
    try {
      const itemToSave = {
        // If existingItem exists, pass its ID for updating; otherwise, let saveInventoryItem generate a new one.
        ...(existingItem && { itemName: existingItem.itemName }), // Keep original itemName for key if editing
        // For new items or if itemName changed during edit (though disabled for edit currently)
        itemName: itemName.trim(),
        currentStock: parsedStock,
        costPricePerUnit: parsedCostPrice,
        sellingPricePerUnit: parsedSellingPrice,
        lastUpdated: Date.now(), // Add last updated timestamp
      };

      await saveInventoryItem(itemToSave); // This function should handle both add and update based on itemName existence
      Toast.show({ type: "success", text1: t("item_saved_success") }); // New translation key
      navigation.goBack(); // Go back to Inventory screen
    } catch (error) {
      console.error("Error saving item:", error);
      Toast.show({
        type: "error",
        text1: t("error_saving_item"), // New translation key
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine if any field is currently listening
  const isAnyFieldListening =
    isListeningItemName ||
    isListeningCurrentStock ||
    isListeningCostPrice ||
    isListeningSellingPrice;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 20}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {existingItem ? t("edit_item") : t("add_new_item")}
          </Text>
        </View>

        <View style={styles.container}>
          <View style={styles.card}>
            {/* Item Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("item_name")}</Text>
              <View style={styles.inputWithIonicons}>
                <TextInput
                  style={styles.input}
                  placeholder={t("item_name_placeholder")}
                  value={itemName}
                  onChangeText={setItemName}
                  // Item name is NOT editable if editing an existing item to prevent key changes
                  editable={!existingItem && !isAnyFieldListening}
                />
                <TouchableOpacity
                  style={styles.micButton}
                  onPress={() =>
                    isListeningItemName
                      ? mockStopListening("itemName")
                      : mockStartListening("itemName")
                  }
                  // Mic button is disabled if editing existing item, or if another field is listening
                  disabled={
                    existingItem ||
                    (isAnyFieldListening && !isListeningItemName)
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

            {/* Current Stock Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("current_stock")}</Text>
              <View style={styles.inputWithIonicons}>
                <TextInput
                  style={styles.input}
                  placeholder={t("quantity_placeholder")}
                  keyboardType="numeric"
                  value={currentStock}
                  onChangeText={setCurrentStock}
                  editable={!isAnyFieldListening} // Disable if any field is listening
                />
                <TouchableOpacity
                  style={styles.micButton}
                  onPress={() =>
                    isListeningCurrentStock
                      ? mockStopListening("currentStock")
                      : mockStartListening("currentStock")
                  }
                  disabled={isAnyFieldListening && !isListeningCurrentStock} // Disable if another field is listening
                >
                  <Ionicons
                    name={isListeningCurrentStock ? "mic-off" : "mic"}
                    size={24}
                    color={isListeningCurrentStock ? "#d9534f" : "#007bff"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Cost Price Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("cost_price")}</Text>
              <View style={styles.inputWithIonicons}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 1000"
                  keyboardType="numeric"
                  value={costPricePerUnit}
                  onChangeText={setCostPricePerUnit}
                  editable={!isAnyFieldListening} // Disable if any field is listening
                />
                <TouchableOpacity
                  style={styles.micButton}
                  onPress={() =>
                    isListeningCostPrice
                      ? mockStopListening("costPricePerUnit")
                      : mockStartListening("costPricePerUnit")
                  }
                  disabled={isAnyFieldListening && !isListeningCostPrice} // Disable if another field is listening
                >
                  <Ionicons
                    name={isListeningCostPrice ? "mic-off" : "mic"}
                    size={24}
                    color={isListeningCostPrice ? "#d9534f" : "#007bff"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Selling Price Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("selling_price")}</Text>
              <View style={styles.inputWithIonicons}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 1200"
                  keyboardType="numeric"
                  value={sellingPricePerUnit}
                  onChangeText={setSellingPricePerUnit}
                  editable={!isAnyFieldListening} // Disable if any field is listening
                />
                <TouchableOpacity
                  style={styles.micButton}
                  onPress={() =>
                    isListeningSellingPrice
                      ? mockStopListening("sellingPricePerUnit")
                      : mockStartListening("sellingPricePerUnit")
                  }
                  disabled={isAnyFieldListening && !isListeningSellingPrice} // Disable if another field is listening
                >
                  <Ionicons
                    name={isListeningSellingPrice ? "mic-off" : "mic"}
                    size={24}
                    color={isListeningSellingPrice ? "#d9534f" : "#007bff"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSubmit}
              disabled={loading || isAnyFieldListening} // Disable if loading or any voice input is active
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>{t("save_item")}</Text>
              )}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    backgroundColor: "#ffc107", // Amber/Yellow header background
    borderBottomWidth: 1,
    borderBottomColor: "#e0a800",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  backButton: {
    position: "absolute",
    left: 20,
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
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
    flex: 1, // Take up available space
    height: 50,
    fontSize: 16,
    color: "#333",
  },
  micButton: {
    padding: 8,
    marginLeft: 10,
  },
  saveButton: {
    backgroundColor: "#007bff",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
