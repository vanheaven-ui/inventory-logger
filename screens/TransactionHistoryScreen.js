import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLanguage } from "../context/LanguageContext";
import {
  getTransactions,
  clearTransactions,
} from "../storage/transactionStorage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Key for AsyncStorage (to get agent status)
const IS_AGENT_KEY = "isMobileMoneyAgent";

export default function TransactionHistoryScreen() {
  const navigation = useNavigation();
  // State to hold transactions for each category internally
  const [mobileMoneyTransactions, setMobileMoneyTransactions] = useState([]);
  const [generalShopTransactions, setGeneralShopTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  // This state is now the single source of truth for the active mode
  const [isMobileMoneyAgent, setIsMobileMoneyAgent] = useState(false);
  const { t } = useLanguage();

  // Load agent status from AsyncStorage
  // This function sets the global mode for the app
  const loadAgentStatus = useCallback(async () => {
    try {
      const storedStatus = await AsyncStorage.getItem(IS_AGENT_KEY);
      if (storedStatus !== null) {
        setIsMobileMoneyAgent(JSON.parse(storedStatus));
      } else {
        setIsMobileMoneyAgent(false); // Default to false if not found
      }
    } catch (error) {
      console.error("HistoryScreen: Failed to load agent status:", error);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const stored = await getTransactions();
      console.log("TransactionHistoryScreen: Loaded all transactions:", stored);

      // Filter out transactions where quantity is 0 or undefined/null
      const validTransactions = stored.filter(
        (item) =>
          item.quantity !== undefined &&
          item.quantity !== null &&
          item.quantity !== 0
      );

      // Separate transactions into two categories
      const mobileMoneyTxns = validTransactions.filter(
        (item) => item.isMobileMoney
      );
      const generalShopTxns = validTransactions.filter(
        (item) => !item.isMobileMoney
      );

      // Sort by newest first for both categories
      setMobileMoneyTransactions(
        mobileMoneyTxns.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        )
      );
      setGeneralShopTransactions(
        generalShopTxns.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        )
      );
    } catch (error) {
      console.error(
        "TransactionHistoryScreen: Error loading transactions:",
        error
      );
      Toast.show({
        type: "error",
        text1: t("error_loading_history"),
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Use useFocusEffect to reload data and agent status whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadAgentStatus(); // This sets the isMobileMoneyAgent status
      loadTransactions(); // This loads and separates all transactions
      return () => {
        // Optional: Perform actions when the screen is unfocused
      };
    }, [loadAgentStatus, loadTransactions])
  );

  const handleClearHistory = () => {
    console.log(
      "TransactionHistoryScreen: Initiating clear all history process."
    );
    Alert.alert(
      t("confirm_clear_history_title"),
      t("confirm_clear_history_message"),
      [
        {
          text: t("cancel"),
          style: "cancel",
          onPress: () => {
            console.log("Clear history cancelled.");
            Toast.show({ type: "info", text1: t("clear_history_cancelled") });
          },
        },
        {
          text: t("clear_all"),
          style: "destructive",
          onPress: async () => {
            try {
              console.log(
                "TransactionHistoryScreen: User confirmed clearing all history."
              );
              await clearTransactions(); // Clears ALL transactions
              Toast.show({
                type: "success",
                text1: t("history_cleared_success"),
              });
              loadTransactions(); // Reload transactions to show empty history for both categories
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

  const renderItem = ({ item }) => {
    // Determine the transaction type label based on whether THIS ITEM is Mobile Money
    const typeLabel = item.isMobileMoney
      ? item.type === "sell"
        ? t("withdrew_amount") // For agent: Withdrawal
        : t("deposited_amount") // For agent: Deposit
      : item.type === "sell"
      ? t("sold_quantity") // For shop: Sold
      : t("restocked_quantity"); // For shop: Restocked

    // Determine the item/network name label based on whether THIS ITEM is Mobile Money
    const nameLabel = item.isMobileMoney ? t("network") : t("item");

    // Determine the amount/price/fee label based on whether THIS ITEM is Mobile Money
    const amountLabel = item.isMobileMoney
      ? item.type === "sell"
        ? t("withdrawal_amount") // Specific for withdrawal amount
        : t("deposit_amount") // Specific for deposit amount
      : t("total_price"); // General shop item total price

    // Determine the unit label based on whether THIS ITEM is Mobile Money
    const unitLabel = item.isMobileMoney ? t("UGX") : t("unit");

    // Conditional styling based on transaction type
    const cardStyle =
      item.type === "sell" ? styles.sellCard : styles.restockCard;

    // Ensure numeric values are numbers before formatting
    const quantity = item.quantity || 0;
    const sellingPrice = item.sellingPrice || 0;
    const costPrice = item.costPrice || 0;
    const commissionEarned = item.commissionEarned || 0;

    return (
      <View style={[styles.itemCard, cardStyle]}>
        <Text style={styles.itemName}>
          {nameLabel}: {item.itemName}
        </Text>

        {item.isMobileMoney ? ( // Render Mobile Money specific details if the item is Mobile Money
          <>
            <Text style={styles.details}>
              <Text style={styles.typeLabel}>{typeLabel}:</Text>{" "}
              {quantity.toLocaleString()} UGX
            </Text>
            {item.commissionEarned !== undefined && (
              <Text style={styles.commissionDetails}>
                {t("commission_earned")}: UGX{" "}
                {commissionEarned.toLocaleString()}
              </Text>
            )}
          </>
        ) : (
          // Render General Shop specific details if the item is General Shop
          <>
            <Text style={styles.details}>
              <Text style={styles.typeLabel}>{typeLabel}:</Text> {quantity}{" "}
              {t("units")}
            </Text>
            {item.type === "sell" && item.sellingPrice !== undefined && (
              <Text style={styles.priceDetails}>
                {amountLabel}: UGX {(sellingPrice * quantity).toLocaleString()}{" "}
                (UGX {sellingPrice.toLocaleString()} / {unitLabel})
              </Text>
            )}
            {item.type === "restock" && item.costPrice !== undefined && (
              <Text style={styles.priceDetails}>
                {amountLabel}: UGX {(costPrice * quantity).toLocaleString()}{" "}
                (UGX {costPrice.toLocaleString()} / {unitLabel})
              </Text>
            )}
          </>
        )}

        <Text style={styles.timestamp}>
          {item.timestamp
            ? new Date(item.timestamp).toLocaleString()
            : t("N/A")}
        </Text>
      </View>
    );
  };

  // Determine which set of transactions to display based on the global isMobileMoneyAgent status
  const transactionsToDisplay = isMobileMoneyAgent
    ? mobileMoneyTransactions
    : generalShopTransactions;

  // Determine the header title based on the global isMobileMoneyAgent status
  const headerTitleText = isMobileMoneyAgent
    ? t("mobile_money_transactions")
    : t("transaction_history"); // Assuming 'transaction_history' is for general shop

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{headerTitleText}</Text>
      </View>

      {/* REMOVED: The category toggle button/segmented control */}

      <View style={styles.container}>
        {/* Clear All History Button - Only show if there are transactions and not loading */}
        {!loading && transactionsToDisplay.length > 0 && (
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
        ) : transactionsToDisplay.length === 0 ? (
          <Text style={styles.noDataText}>
            {isMobileMoneyAgent
              ? t("no_mobile_money_transactions")
              : t("no_general_shop_transactions")}
          </Text>
        ) : (
          <FlatList
            data={transactionsToDisplay}
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
  headerTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  // REMOVED categoryToggle styles as the component is removed
  container: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: "stretch",
  },
  clearAllButton: {
    backgroundColor: "#dc3545", // Red color
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    marginHorizontal: 5,
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
    borderLeftColor: "#d9534f", // Red for sales/withdrawals
  },
  restockCard: {
    borderLeftWidth: 5,
    borderLeftColor: "#5cb85c", // Green for restocks/deposits
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
  commissionDetails: {
    fontSize: 14,
    color: "#007bff",
    fontWeight: "bold",
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
