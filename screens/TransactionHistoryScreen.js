import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Button,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getTransactions, overwriteTransactions } from "../storage/dataStorage";
import { useLanguage } from "../context/LanguageContext";

import FocusAwareStatusBar from "../components/FocusAwareStatusBar";

const IS_AGENT_KEY = "isMobileMoneyAgent";

const TransactionHistoryScreen = ({ navigation }) => {
  const [transactions, setTransactions] = useState([]);
  const [isMobileMoneyAgent, setIsMobileMoneyAgent] = useState(false);
  const [loadingAgentStatus, setLoadingAgentStatus] = useState(true);
  const { t } = useLanguage(); // Use the language hook

  // Use a different state for refreshing when a transaction is added/deleted
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchTransactions();
      fetchAgentStatus();
    });
    return unsubscribe;
  }, [navigation]); // Depend on navigation to refetch on focus

  const fetchTransactions = async () => {
    try {
      const allTransactions = await getTransactions();
      // Ensure each transaction has an 'id' for keyExtractor, if not already
      const transactionsWithIds = allTransactions.map((tx, index) => ({
        ...tx,
        id: tx.id || `${tx.timestamp}-${index}`, // Use existing ID or create one
      }));
      setTransactions(transactionsWithIds.reverse());
    } catch (error) {
      console.error("Failed to load transactions:", error);
    }
  };

  const fetchAgentStatus = async () => {
    try {
      const status = await AsyncStorage.getItem(IS_AGENT_KEY);
      if (status !== null) {
        setIsMobileMoneyAgent(JSON.parse(status));
      }
    } catch (error) {
      console.error("Failed to load agent status:", error);
    } finally {
      setLoadingAgentStatus(false);
    }
  };

  const handleClearHistory = async () => {
    Alert.alert(t("confirm"), t("confirm_delete_history"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("yes_delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await overwriteTransactions([]);
            setTransactions([]);
            Alert.alert(t("success"), t("history_cleared_success"));
          } catch (error) {
            console.error("Failed to clear transaction history:", error);
            Alert.alert(t("error"), t("history_cleared_error"));
          }
        },
      },
    ]);
  };

  const getTransactionLabel = (item) => {
    if (item.isMobileMoney) {
      // For Mobile Money transactions:
      // 'sell' on TransactionScreen is "Withdrawal" (physical cash OUT, float IN)
      // 'restock' on TransactionScreen is "Deposit" (physical cash IN, float OUT)
      return item.type === "sell"
        ? t("mobile_money_withdrawal")
        : t("mobile_money_deposit");
    } else {
      // For general inventory transactions:
      // 'sell' is "Sale" (item OUT, physical cash IN)
      // 'restock' is "Restock" (item IN, physical cash OUT)
      return item.type === "sell" ? t("general_sale") : t("general_restock");
    }
  };

  const getTransactionColor = (item) => {
    // Determine if the transaction primarily represents 'money coming into your physical cash/profit'
    // or 'money going out of your physical cash/expense'.

    let isIncomingCashOrProfit;
    if (item.isMobileMoney) {
      // For Mobile Money:
      // 'sell' (withdrawal) means *physical cash leaves your hand*. So it's outgoing cash.
      // 'restock' (deposit) means *physical cash comes into your hand*. So it's incoming cash.
      // However, for mobile money, the 'profit' comes from commission regardless of cash flow.
      // We'll use color to indicate the direction of the *main transaction value* for clarity.
      isIncomingCashOrProfit = item.type === "restock"; // Deposit brings cash in
    } else {
      // For General Inventory:
      // 'sell' (sale) means *you get cash/revenue*. So it's incoming cash/profit.
      // 'restock' (restock) means *you pay cash for new stock*. So it's outgoing cash/expense.
      isIncomingCashOrProfit = item.type === "sell"; // Sale brings cash in
    }

    return isIncomingCashOrProfit ? styles.incoming : styles.outgoing;
  };

  const renderItem = ({ item }) => (
    <View style={[styles.transactionItem, getTransactionColor(item)]}>
      <Text style={styles.type}>{getTransactionLabel(item)}</Text>
      {item.isMobileMoney ? (
        <>
          <Text style={styles.detailText}>
            {t("amount")}: UGX {parseFloat(item.amount || 0).toLocaleString()}
          </Text>
          {/* Display Network Name for Mobile Money transactions */}
          {item.network && ( // Only display if item.network exists
            <Text style={styles.detailText}>
              {t("network")}: {item.network}
            </Text>
          )}
          {/* Display commission for Mobile Money transactions */}
          {item.commissionEarned !== undefined &&
            item.commissionEarned !== null && (
              <Text style={styles.commissionText}>
                {t("commission")}: UGX{" "}
                {parseFloat(item.commissionEarned).toLocaleString()}
              </Text>
            )}
        </>
      ) : (
        <>
          <Text style={styles.detailText}>
            {t("item")}: {item.itemName}
          </Text>
          <Text style={styles.detailText}>
            {t("quantity")}: {item.quantity}
          </Text>
          <Text style={styles.detailText}>
            {t("total_amount")}: UGX {parseFloat(item.amount).toLocaleString()}
          </Text>
        </>
      )}

      <Text style={styles.date}>
        {new Date(item.timestamp).toLocaleString("en-UG", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true, // Use 12-hour format with AM/PM
        })}
      </Text>
    </View>
  );

  if (loadingAgentStatus) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <FocusAwareStatusBar
          backgroundColor="#fdfdfd"
          barStyle="dark-content"
          animated={true}
        />
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>{t("loading_history")}</Text>
      </SafeAreaView>
    );
  }

  // Filter transactions based on the agent status, ensuring only relevant transactions are shown
  const filteredTransactions = transactions.filter(
    (t) => t.isMobileMoney === isMobileMoneyAgent
  );

  return (
    <SafeAreaView style={styles.container}>
      <FocusAwareStatusBar
        backgroundColor="#fdfdfd"
        barStyle="dark-content"
        animated={true}
      />
      <Text style={styles.screenHeader}>
        {isMobileMoneyAgent
          ? t("mobile_money_history")
          : t("general_shop_history")}
      </Text>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.noTransactions}>
            {t("no_transactions_to_show")}
          </Text>
        }
        contentContainerStyle={styles.flatListContent}
      />

      <View style={styles.clearButtonContainer}>
        <Button
          title={t("clear_all_history")}
          onPress={handleClearHistory}
          color="#dc3545" // A more "destructive" color for the button
        />
      </View>
    </SafeAreaView>
  );
};

export default TransactionHistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8", // Lighter background for the screen
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 10 : 0, // Add some top padding for Android
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#555",
  },
  screenHeader: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    marginTop: 10, // Ensure space below status bar
    color: "#333",
    textAlign: "center",
  },
  flatListContent: {
    paddingBottom: 100, // Increased padding to prevent button overlay
  },
  transactionItem: {
    padding: 15,
    marginVertical: 7,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, // Softer shadow
    shadowRadius: 4,
    elevation: 4, // For Android shadow
    backgroundColor: "#fff", // Default background, overridden by incoming/outgoing
    borderLeftWidth: 5, // Thicker border for visual impact
  },
  incoming: {
    borderLeftColor: "#28a745", // Green for positive/incoming
    backgroundColor: "#e6ffe6", // Very light green background
  },
  outgoing: {
    borderLeftColor: "#dc3545", // Red for negative/outgoing
    backgroundColor: "#ffe6e6", // Very light red background
  },
  type: {
    fontWeight: "600",
    fontSize: 17,
    marginBottom: 6,
    color: "#333",
  },
  detailText: {
    fontSize: 15,
    color: "#555",
    marginBottom: 2,
  },
  commissionText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#007bff", // Blue for commission
    marginTop: 4,
  },
  date: {
    color: "#777",
    marginTop: 8,
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "right", // Align date to the right
  },
  noTransactions: {
    textAlign: "center",
    fontStyle: "italic",
    color: "#777",
    marginTop: 50,
    fontSize: 17,
    paddingHorizontal: 20,
  },
  clearButtonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#eee", // Lighter border
    backgroundColor: "#f8f8f8", // Matches screen background
    position: "absolute", // Make it stick to the bottom
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === "ios" ? 30 : 15, // Adjusted for iOS safe area
  },
});
