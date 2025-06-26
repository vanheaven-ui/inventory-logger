// screens/TransactionHistoryScreen.js
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert, // Import Alert for confirmation dialog
} from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage"; // No longer directly used here for get
import { useLanguage } from "../context/LanguageContext";
import {
  getTransactions,
  clearTransactions,
} from "../storage/transactionStorage"; // Import clearTransactions
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Toast from "react-native-toast-message"; // For success/error messages

export default function TransactionHistoryScreen() {
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const stored = await getTransactions(); // getTransactions already handles parsing
      console.log("TransactionHistoryScreen: Loaded transactions:", stored);

      // Sort by newest first
      setTransactions(
        stored.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      );
    } catch (error) {
      console.error(
        "TransactionHistoryScreen: Error loading transactions:",
        error
      );
      Toast.show({
        type: "error",
        text1: t("history_cleared_error"), // Re-using a generic error message, could add specific one
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadTransactions(); // Reload data when screen is focused
    });
    return unsubscribe;
  }, [navigation, loadTransactions]);

  const handleClearHistory = () => {
    console.log(
      "TransactionHistoryScreen: Initiating clear all history process."
    );
    Alert.alert(
      t("confirm_clear_history_title"), // First confirmation title
      t("confirm_clear_history_message"), // First confirmation message
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            console.log("Clear history cancelled.");
            Toast.show({ type: "info", text1: t("clear_history_cancelled") });
          },
        },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              console.log(
                "TransactionHistoryScreen: User confirmed clearing all history."
              );
              await clearTransactions(); // Call the clearTransactions function
              Toast.show({
                type: "success",
                text1: t("history_cleared_success"),
              });
              loadTransactions(); // Reload transactions to show empty history
              console.log(
                "TransactionHistoryScreen: All history cleared and UI reloaded."
              );
            } catch (error) {
              console.error(
                "TransactionHistoryScreen: Error clearing all history:",
                error
              );
              Toast.show({
                type: "error",
                text1: t("history_cleared_error"),
              });
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.itemCard,
        item.type === "sell" ? styles.sellCard : styles.restockCard,
      ]}
    >
      <Text style={styles.itemName}>{item.itemName}</Text>
      <Text style={styles.details}>
        <Text style={styles.typeLabel}>
          {item.type === "sell" ? t("sold") : t("restocked")}:
        </Text>{" "}
        {item.quantity}
      </Text>
      {item.type === "sell" &&
        item.sellingPrice !== undefined && ( // Check for undefined explicitly
          <Text style={styles.priceDetails}>
            {t("selling_price")}: UGX{" "}
            {(item.sellingPrice * item.quantity).toLocaleString()} (UGX{" "}
            {item.sellingPrice.toLocaleString()} /unit)
          </Text>
        )}
      {item.type === "restock" &&
        item.costPrice !== undefined && ( // Check for undefined explicitly
          <Text style={styles.priceDetails}>
            {t("cost_price")}: UGX{" "}
            {(item.costPrice * item.quantity).toLocaleString()} (UGX{" "}
            {item.costPrice.toLocaleString()} /unit)
          </Text>
        )}
      <Text style={styles.timestamp}>
        {new Date(item.timestamp).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("transaction_history")}</Text>
      </View>
      <View style={styles.container}>
        {/* Clear All History Button - Only show if there are transactions and not loading */}
        {!loading && transactions.length > 0 && (
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={handleClearHistory}
            disabled={loading} // Disable button while loading
          >
            <Text style={styles.clearAllButtonText}>
              {t("clear_history_button")}
            </Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#007bff"
            style={styles.loadingIndicator}
          />
        ) : transactions.length === 0 ? (
          <Text style={styles.noDataText}>{t("no_transactions")}</Text>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id || Math.random().toString()} // Fallback if ID is somehow missing
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            style={styles.fullWidthList}
          />
        )}
      </View>
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
    backgroundColor: "#6c757d", // Consistent with Home screen history button
    borderBottomWidth: 1,
    borderBottomColor: "#5a6268",
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
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: "stretch",
  },
  clearAllButton: {
    // Style for the new clear all history button
    backgroundColor: "#dc3545", // Red color
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15, // Space below the button
    marginHorizontal: 5, // Consistent padding
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  clearAllButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingIndicator: {
    marginTop: 50,
  },
  fullWidthList: {
    width: "100%",
  },
  listContent: {
    flexGrow: 1,
  },
  itemCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sellCard: {
    borderLeftWidth: 5,
    borderLeftColor: "#d9534f", // Red for sales
  },
  restockCard: {
    borderLeftWidth: 5,
    borderLeftColor: "#5cb85c", // Green for restocks
  },
  itemName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  details: {
    fontSize: 15,
    color: "#555",
    marginTop: 2,
    marginBottom: 2,
  },
  typeLabel: {
    fontWeight: "bold",
  },
  priceDetails: {
    fontSize: 14,
    color: "#777",
    marginTop: 2,
  },
  timestamp: {
    fontSize: 12,
    color: "#888",
    marginTop: 8,
  },
  noDataText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 50,
  },
});
