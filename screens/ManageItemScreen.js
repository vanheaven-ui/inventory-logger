import React, { useState, useEffect } from "react";
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
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { useLanguage } from "../context/LanguageContext"; // Assuming you have this
import {
  saveInventoryItem, // This function should save/update GENERAL inventory items
  // getGeneralInventoryItems, // Not directly used in this component, but good to keep in mind
} from "../storage/transactionStorage"; // Ensure saveInventoryItem is exported

export default function ManageItemScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useLanguage(); // For translations

  // Get parameters passed from the previous screen
  const {
    itemName: passedItemName,
    isNewItem: isRedirectedNewItem,
    itemToEdit,
  } = route.params || {};

  const [itemName, setItemName] = useState("");
  const [currentStock, setCurrentStock] = useState("0"); // Default to 0 for new items
  const [costPricePerUnit, setCostPricePerUnit] = useState("0"); // Default to 0 for new items
  const [sellingPricePerUnit, setSellingPricePerUnit] = useState("0"); // Default to 0 for new items
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // State to distinguish add vs. edit

  // Effect to handle pre-population and edit mode
  useEffect(() => {
    if (itemToEdit) {
      // If an item object is passed for editing
      setIsEditing(true);
      setItemName(itemToEdit.itemName);
      setCurrentStock(String(itemToEdit.currentStock));
      setCostPricePerUnit(String(itemToEdit.costPricePerUnit));
      setSellingPricePerUnit(String(itemToEdit.sellingPricePerUnit));
      // You might also store originalItemName for renames if your save function needs it
    } else if (isRedirectedNewItem && passedItemName) {
      // If redirected from TransactionForm to add a new item
      setItemName(passedItemName); // Pre-populate the item name
      // Keep default stock/prices as 0, as it's a new item
      setCurrentStock("0");
      setCostPricePerUnit("0");
      setSellingPricePerUnit("0");
      setIsEditing(false); // Ensure it's treated as an add operation
    } else {
      // For a fresh "Add Item" flow (not redirected or editing)
      setItemName("");
      setCurrentStock("0");
      setCostPricePerUnit("0");
      setSellingPricePerUnit("0");
      setIsEditing(false);
    }
  }, [passedItemName, isRedirectedNewItem, itemToEdit]);

  const handleSaveItem = async () => {
    if (!itemName.trim()) {
      Toast.show({ type: "error", text1: t("item_name_required") });
      return;
    }

    setLoading(true);
    try {
      const itemData = {
        itemName: itemName.trim(),
        currentStock: parseFloat(currentStock) || 0,
        costPricePerUnit: parseFloat(costPricePerUnit) || 0,
        sellingPricePerUnit: parseFloat(sellingPricePerUnit) || 0,
        // If you need to support renaming an item:
        // originalItemName: isEditing && itemToEdit ? itemToEdit.itemName : undefined,
      };

      // This function handles both add and update based on itemName for GENERAL INVENTORY
      await saveInventoryItem(itemData);

      Toast.show({
        type: "success",
        text1: isEditing
          ? t("item_updated_successfully")
          : t("item_added_successfully"),
      });
      navigation.goBack(); // Go back to the previous screen (e.g., Inventory List)
    } catch (error) {
      console.error("Error saving item:", error);
      Toast.show({
        type: "error",
        text1: t("error_saving_item"),
        text2: error.message || t("please_try_again"),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.form}>
        <Text style={styles.title}>
          {isEditing ? t("edit_item") : t("add_new_item")}
        </Text>

        <Text style={styles.label}>{t("item_name")}</Text>
        <TextInput
          style={styles.input}
          value={itemName}
          onChangeText={setItemName}
          placeholder={t("enter_item_name")}
          placeholderTextColor="#999"
          // If editing, you might want to prevent changing the name unless explicitly allowed
          // editable={!isEditing || isRedirectedNewItem} // Allow changing for new items, prevent for existing edits
        />

        <Text style={styles.label}>{t("current_stock")}</Text>
        <TextInput
          style={styles.input}
          value={currentStock}
          onChangeText={setCurrentStock}
          keyboardType="numeric"
          placeholder={t("enter_current_stock")}
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>{t("cost_price_per_unit")}</Text>
        <TextInput
          style={styles.input}
          value={costPricePerUnit}
          onChangeText={setCostPricePerUnit}
          keyboardType="numeric"
          placeholder={t("enter_cost_price")}
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>{t("selling_price_per_unit")}</Text>
        <TextInput
          style={styles.input}
          value={sellingPricePerUnit}
          onChangeText={setSellingPricePerUnit}
          keyboardType="numeric"
          placeholder={t("enter_selling_price")}
          placeholderTextColor="#999"
        />

        {loading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleSaveItem}>
            <Text style={styles.buttonText}>
              {isEditing ? t("update_item") : t("add_item")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f6f6",
    justifyContent: "center",
    padding: 20,
  },
  form: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#333",
    marginBottom: 15,
    backgroundColor: "#fcfcfc",
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
