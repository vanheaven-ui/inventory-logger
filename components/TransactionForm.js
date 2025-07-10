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
  Alert,
} from "react-native";
import Toast from "react-native-toast-message";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useLanguage } from "../context/LanguageContext";
import { Ionicons } from "@expo/vector-icons";
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

  const [networkName, setNetworkName] = useState(""); // For MM, this is network. For shop, item name.
  const [transactionAmount, setTransactionAmount] = useState(""); // For MM, this is transaction amount. For shop, quantity.
  const [customerIdentifier, setCustomerIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const nav = useNavigation();

  const [isListeningNetworkName, setIsListeningNetworkName] = useState(false);
  const [isListeningAmount, setIsListeningAmount] = useState(false);
  const [isListeningCustomerIdentifier, setIsListeningCustomerIdentifier] =
    useState(false);
  const [speechResult, setSpeechResult] = useState("");

  // MOCK VOICE RECOGNITION FUNCTIONS - Keep as is
  const mockStartListening = useCallback((field) => {
    console.log(`MOCK: Starting listening for ${field}`);
    if (field === "networkName") setIsListeningNetworkName(true);
    else if (field === "transactionAmount") setIsListeningAmount(true);
    else if (field === "customerIdentifier")
      setIsListeningCustomerIdentifier(true);
    setSpeechResult("");

    setTimeout(() => {
      let mockResult = "";
      if (field === "networkName") {
        const mockNetworks = ["MTN", "Airtel", "Africell", "Salt", "Sugar"];
        mockResult =
          mockNetworks[Math.floor(Math.random() * mockNetworks.length)];
      } else if (field === "transactionAmount") {
        mockResult = (Math.floor(Math.random() * 95000) + 5000).toString();
      } else if (field === "customerIdentifier") {
        const mockCustomers = [
          "0771234567",
          "0701987654",
          "John Doe",
          "Sarah K.",
        ];
        mockResult =
          mockCustomers[Math.floor(Math.random() * mockCustomers.length)];
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
    if (field === "networkName") setIsListeningNetworkName(false);
    else if (field === "transactionAmount") setIsListeningAmount(false);
    else if (field === "customerIdentifier")
      setIsListeningCustomerIdentifier(false);
  }, []);

  useEffect(() => {
    if (speechResult) {
      if (isListeningNetworkName) {
        setNetworkName(speechResult);
        setIsListeningNetworkName(false);
      } else if (isListeningAmount) {
        setTransactionAmount(speechResult);
        setIsListeningAmount(false);
      } else if (isListeningCustomerIdentifier) {
        setCustomerIdentifier(speechResult);
        setIsListeningCustomerIdentifier(false);
      }
      setSpeechResult("");
    }
  }, [
    speechResult,
    isListeningNetworkName,
    isListeningAmount,
    isListeningCustomerIdentifier,
  ]);

  // --- NEW: Function to determine button text dynamically ---
  const getSubmitButtonText = useCallback(() => {
    if (isMobileMoneyAgent) {
      if (type === "sell") {
        return t("record_withdrawal"); // "Record Withdrawal"
      } else {
        // type === 'restock'
        return t("record_deposit"); // "Record Deposit"
      }
    } else {
      if (type === "sell") {
        return t("record_sale"); // "Record Sale"
      } else {
        // type === 'restock'
        return t("record_restock"); // "Record Restock"
      }
    }
  }, [isMobileMoneyAgent, type, t]); // Depends on these props/state

  const handleSubmit = async () => {
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
        id: Date.now().toString(), // Add a unique ID for each transaction
        type: type, // "sell" or "restock"
        itemName: networkName, // "Salt" or "MTN" etc.
        quantity: parsedAmount, // Number of units for general, or actual amount for MM
        customer: customerIdentifier, // For MM, or general customer info
        isMobileMoneyAgent: isMobileMoneyAgent, // Pass this directly
        timestamp: new Date().toISOString(), // Add timestamp for sorting/filtering
      };

      if (!isMobileMoneyAgent) {
        let currentItems = await getGeneralInventoryItems();
        let existingItem = currentItems.find(
          (item) =>
            item.itemName &&
            item.itemName.toLowerCase() === networkName.toLowerCase()
        );

        if (existingItem) {
          transactionPayload.costPrice = existingItem.costPricePerUnit;
          transactionPayload.sellingPrice = existingItem.sellingPricePerUnit;
          // Calculate amount for general sales/restocks
          if (type === "sell") {
            transactionPayload.amount =
              parsedAmount * existingItem.sellingPricePerUnit; // Quantity * sellingPrice
          } else if (type === "restock") {
            transactionPayload.amount =
              parsedAmount * existingItem.costPricePerUnit; // Quantity * costPrice
          }
          // Update inventory quantity
          const updatedQuantity =
            type === "sell"
              ? existingItem.quantity - parsedAmount
              : existingItem.quantity + parsedAmount;
          await updateGeneralInventoryItem({
            ...existingItem,
            quantity: updatedQuantity,
          });
        } else {
          console.warn(
            `Item "${networkName}" not found in general inventory. Transaction recorded without price/cost. Consider adding it to inventory.`
          );
          transactionPayload.costPrice = 0;
          transactionPayload.sellingPrice = 0;
          transactionPayload.amount = 0; // Default amount if price is unknown
          Toast.show({
            type: "info",
            text1: t("item_not_in_inventory_warning"),
            text2: t("consider_adding_item"),
          });
        }
      } else {
        // For Mobile Money
        transactionPayload.amount = parsedAmount; // The amount transacted
        const commission = await calculateCommission(
          networkName,
          parsedAmount,
          type
        );
        transactionPayload.commissionEarned = commission;

        // Update mobile money float (assumes you have a 'networkName' for float entries)
        let currentFloatEntries = await getFloatEntries();
        let existingFloat = currentFloatEntries.find(
          (entry) => entry.network.toLowerCase() === networkName.toLowerCase()
        );

        if (existingFloat) {
          const updatedFloatValue =
            type === "sell" // withdrawal
              ? existingFloat.currentFloat - parsedAmount
              : existingFloat.currentFloat + parsedAmount; // deposit
          await updateFloatEntry({
            ...existingFloat,
            currentFloat: updatedFloatValue,
          });
        } else {
          console.warn(
            `Float entry for network "${networkName}" not found. Float not updated.`
          );
          Toast.show({
            type: "info",
            text1: t("float_not_updated_warning"),
            text2: t("consider_adding_float_entry", { network: networkName }),
          });
        }
      }

      console.log(
        "Final Transaction Payload to saveTransaction:",
        JSON.stringify(transactionPayload, null, 2)
      ); // Debug log

      await saveTransaction(transactionPayload);

      Toast.show({
        type: "success",
        text1: t("transaction_recorded"),
      });
      nav.goBack();
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.form}>
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
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            onPress={() => mockStartListening("networkName")}
            style={styles.micButton}
          >
            <Ionicons
              name={isListeningNetworkName ? "mic" : "mic-outline"}
              size={24}
              color="#007bff"
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
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            onPress={() => mockStartListening("transactionAmount")}
            style={styles.micButton}
          >
            <Ionicons
              name={isListeningAmount ? "mic" : "mic-outline"}
              size={24}
              color="#007bff"
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
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                onPress={() => mockStartListening("customerIdentifier")}
                style={styles.micButton}
              >
                <Ionicons
                  name={isListeningCustomerIdentifier ? "mic" : "mic-outline"}
                  size={24}
                  color="#007bff"
                />
              </TouchableOpacity>
            </View>
          </>
        )}

        {loading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>
              {getSubmitButtonText()} {/* Dynamic text here! */}
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
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fcfcfc",
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#333",
  },
  micButton: {
    padding: 10,
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
