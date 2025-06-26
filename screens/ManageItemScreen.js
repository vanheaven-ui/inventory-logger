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
import { Ionicons } from "@expo/vector-icons"; // Import Ionicons for mic icons
import { saveInventoryItem } from "../storage/transactionStorage";
import Toast from "react-native-toast-message";

export default function ManageItemScreen({ route }) {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const existingItem = route.params?.item || null; // Item passed for editing

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
  const mockStartListening = useCallback((field) => {
    console.log(`MOCK: Starting listening for ${field}`);
    setActiveVoiceField(field); // Set active field
    setSpeechResult("");

    // Reset all listening states
    setIsListeningItemName(false);
    setIsListeningCurrentStock(false);
    setIsListeningCostPrice(false);
    setIsListeningSellingPrice(false);

    // Set the specific field to listening
    if (field === "itemName") setIsListeningItemName(true);
    else if (field === "currentStock") setIsListeningCurrentStock(true);
    else if (field === "costPricePerUnit") setIsListeningCostPrice(true);
    else if (field === "sellingPricePerUnit") setIsListeningSellingPrice(true);

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
      setSpeechResult(mockResult);
      Toast.show({
        type: "info",
        text1: `Voice Input (${field}): ${mockResult}`,
        visibilityTime: 2000,
      });
      console.log(`MOCK: Received speech result for ${field}: ${mockResult}`);
    }, 2000); // Simulate 2 seconds of listening
  }, []);

  const mockStopListening = useCallback((field) => {
    console.log(`MOCK: Stopping listening for ${field}`);
    setActiveVoiceField(null); // Clear active field
    if (field === "itemName") setIsListeningItemName(false);
    else if (field === "currentStock") setIsListeningCurrentStock(false);
    else if (field === "costPricePerUnit") setIsListeningCostPrice(false);
    else if (field === "sellingPricePerUnit") setIsListeningSellingPrice(false);
  }, []);

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
      // Also stop all listening flags
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
        text1: "Please wait for voice input to complete.",
      });
      return;
    }

    if (!itemName.trim()) {
      Toast.show({ type: "error", text1: t("item_name_required") });
      return;
    }
    const parsedStock = parseInt(currentStock);
    if (isNaN(parsedStock) || parsedStock < 0) {
      Toast.show({ type: "error", text1: t("valid_quantity") }); // Reusing valid_quantity for stock
      return;
    }
    const parsedCostPrice = parseFloat(costPricePerUnit);
    if (isNaN(parsedCostPrice) || parsedCostPrice < 0) {
      Toast.show({
        type: "error",
        text1: t("valid_cost_price") || "Please enter a valid cost price.",
      });
      return;
    }
    const parsedSellingPrice = parseFloat(sellingPricePerUnit);
    if (isNaN(parsedSellingPrice) || parsedSellingPrice < 0) {
      Toast.show({
        type: "error",
        text1:
          t("valid_selling_price") || "Please enter a valid selling price.",
      });
      return;
    }

    setLoading(true);
    try {
      const itemToSave = {
        id: existingItem ? existingItem.id : null, // Use existing ID for updates
        itemName: itemName.trim(),
        currentStock: parsedStock,
        costPricePerUnit: parsedCostPrice,
        sellingPricePerUnit: parsedSellingPrice,
      };
      await saveInventoryItem(itemToSave);
      Toast.show({ type: "success", text1: t("item_saved") });
      navigation.goBack(); // Go back to Inventory screen
    } catch (error) {
      console.error("Error saving item:", error);
      Toast.show({
        type: "error",
        text1: "Error saving item. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

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
                  editable={!existingItem && !isAnyFieldListening} // Disable if editing existing or listening
                />
                <TouchableOpacity
                  style={styles.micButton}
                  onPress={() =>
                    isListeningItemName
                      ? mockStopListening("itemName")
                      : mockStartListening("itemName")
                  }
                  disabled={
                    existingItem
                      ? true
                      : isAnyFieldListening && !isListeningItemName
                  } // Disable if editing existing or another field is listening
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
                  editable={!isAnyFieldListening} // Disable if listening
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
                  editable={!isAnyFieldListening} // Disable if listening
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
                  editable={!isAnyFieldListening} // Disable if listening
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
              disabled={loading || isAnyFieldListening}
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
    // New style for input with icon
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
    // Removed direct borderWidth, borderRadius, paddingHorizontal to use inputWithIonicons
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
