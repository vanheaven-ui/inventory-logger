import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Toast from "react-native-root-toast"; // Ensure this is installed: npm install react-native-root-toast
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useLanguage } from "../context/LaguageContext";

export default function TransactionForm({ type }) {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [errors, setErrors] = useState({});
  const navigation = useNavigation();
  const { t } = useLanguage(); 

  const showToastAndNavigate = (message) => {
    const toast = Toast.show(message, {
      duration: Toast.durations.SHORT,
      position: Toast.positions.BOTTOM,
      shadow: true,
      animation: true,
      hideOnPress: true,
      onHidden: () => navigation.navigate("Home"),
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!itemName.trim()) newErrors.itemName = t("item_name_required");
    if (!quantity.trim()) newErrors.quantity = t("quantity_required");
    else if (isNaN(quantity) || parseInt(quantity) <= 0)
      newErrors.quantity = t("valid_quantity");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const newTransaction = {
      itemName,
      quantity: parseInt(quantity),
      type,
      timestamp: new Date().toISOString(),
    };

    try {
      const stored = await AsyncStorage.getItem("transactions");
      const transactions = stored ? JSON.parse(stored) : [];
      transactions.push(newTransaction);
      await AsyncStorage.setItem("transactions", JSON.stringify(transactions));

      setItemName("");
      setQuantity("");
      setErrors({});
      showToastAndNavigate(
        type === "sell" ? t("sale_recorded") : t("restock_recorded")
      );
    } catch (e) {
      Toast.show(t("error_saving"), {
        // Use translated error message
        duration: Toast.durations.LONG,
      });
    }
  };

  const handleQuickQuantity = (value) => {
    const current = parseInt(quantity) || 0;
    setQuantity((current + value).toString());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t("item_name")}</Text>
      <TextInput
        style={[styles.input, errors.itemName && styles.errorInput]}
        placeholder={t("item_name_placeholder")}
        value={itemName}
        onChangeText={(text) => {
          setItemName(text);
          if (errors.itemName)
            setErrors((prev) => ({ ...prev, itemName: undefined }));
        }}
      />
      {errors.itemName && (
        <Text style={styles.errorText}>{errors.itemName}</Text>
      )}

      <Text style={styles.label}>{t("quantity")}</Text>
      <TextInput
        style={[styles.input, errors.quantity && styles.errorInput]}
        placeholder={t("quantity_placeholder")}
        value={quantity}
        onChangeText={(text) => {
          setQuantity(text);
          if (errors.quantity)
            setErrors((prev) => ({ ...prev, quantity: undefined }));
        }}
        keyboardType="numeric"
      />
      {errors.quantity && (
        <Text style={styles.errorText}>{errors.quantity}</Text>
      )}

      <View style={styles.quickButtonsRow}>
        {[1, 5, 10].map((num) => (
          <TouchableOpacity
            key={num}
            style={styles.quickButton}
            onPress={() => handleQuickQuantity(num)}
          >
            <Text style={styles.quickButtonText}>+{num}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>
          {type === "sell" ? t("record_sale") : t("record_restock")}
        </Text>
      </TouchableOpacity>

      <Text style={styles.hint}>{t("tip_transaction")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1 },
  label: { fontSize: 16, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 8,
    borderRadius: 5,
  },
  errorInput: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    marginBottom: 8,
    fontSize: 13,
  },
  quickButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  quickButton: {
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 5,
    minWidth: 50,
    alignItems: "center",
  },
  quickButtonText: { fontSize: 16 },
  button: {
    backgroundColor: "green",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16 },
  hint: { marginTop: 10, color: "#555", fontSize: 13 },
});
