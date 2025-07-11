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
  Platform,
  StatusBar,
} from "react-native";
import { useLanguage } from "../context/LanguageContext";
import {
  getTransactions,
  saveTransaction, // Make sure this is correctly imported and available
} from "../storage/transactionStorage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Key for AsyncStorage (to get agent status)
const IS_AGENT_KEY = "isMobileMoneyAgent";

export default function TransactionHistoryScreen() {
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMobileMoneyAgent, setIsMobileMoneyAgent] = useState(false);
  const { t } = useLanguage();

  const loadAgentStatus = useCallback(async () => {
    try {
      const storedStatus = await AsyncStorage.getItem(IS_AGENT_KEY);
      if (storedStatus !== null) {
        setIsMobileMoneyAgent(JSON.parse(storedStatus));
      } else {
        setIsMobileMoneyAgent(false);
      }
    } catch (error) {
      console.error("HistoryScreen: Failed to load agent status:", error);
      Toast.show({
        type: "error",
        text1: t("error_loading_settings"),
      });
    }
  }, [t]);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const stored = await getTransactions();
      console.log("TransactionHistoryScreen: Loaded all transactions:", stored);

      const validTransactions = stored.filter(
        (item) =>
          item.quantity !== undefined &&
          item.quantity !== null &&
          item.quantity !== 0
      );

      setTransactions(
        validTransactions.sort(
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

  useFocusEffect(
    useCallback(() => {
      loadAgentStatus();
      loadTransactions();
      return () => {
        // Optional cleanup
      };
    }, [loadAgentStatus, loadTransactions])
  );

  const handleClearHistory = useCallback(() => {
    Alert.alert(
      t("confirm_clear_history_title"),
      t("confirm_clear_history_message"),
      [
        {
          text: t("cancel"),
          style: "cancel",
          onPress: () =>
            Toast.show({ type: "info", text1: t("clear_history_cancelled") }),
        },
        {
          text: t("clear_all"), // This text implies clearing 'all' of the CURRENT TYPE
          style: "destructive",
          onPress: async () => {
            try {
              const allStoredTransactions = await getTransactions();
              let transactionsToKeep = [];

              if (isMobileMoneyAgent) {
                // If agent, CLEAR mobile money history, so KEEP non-mobile money transactions
                transactionsToKeep = allStoredTransactions.filter(
                  (item) => !item.isMobileMoney
                );
                Toast.show({
                  type: "success",
                  text1: t("mobile_money_history_cleared_success"),
                });
              } else {
                // If not agent (general shop), CLEAR general shop history, so KEEP mobile money transactions
                transactionsToKeep = allStoredTransactions.filter(
                  (item) => item.isMobileMoney
                );
                Toast.show({
                  type: "success",
                  text1: t("general_shop_history_cleared_success"),
                });
              }

              // Save the filtered list (which now contains only the transactions you want to KEEP)
              await saveTransaction(transactionsToKeep);
              loadTransactions(); // Reload transactions to update the UI
            } catch (error) {
              console.error("Error clearing history:", error);
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
  }, [isMobileMoneyAgent, t, loadTransactions]); // Make sure saveTransactions is in the dependency array if it was defined outside of the component

  const renderItem = useCallback(
    ({ item }) => {
      const typeLabel = item.isMobileMoney
        ? item.type === "sell"
          ? t("withdrew_amount")
          : t("deposited_amount")
        : item.type === "sell"
        ? t("sold_quantity")
        : t("restocked_quantity");

      const nameLabel = item.isMobileMoney ? t("network") : t("item");

      const cardStyle =
        item.type === "sell" ? styles.sellCard : styles.restockCard;

      const quantity = item.quantity || 0;
      const sellingPrice = item.sellingPrice || 0;
      const costPrice = item.costPrice || 0;
      const commissionEarned = item.commissionEarned || 0;
      const amount = item.amount || 0;

      return (
        <View style={[styles.itemCard, cardStyle]}>
          <Text style={styles.itemName}>
            {nameLabel}: {item.itemName}
          </Text>

          {item.isMobileMoney ? (
            <>
              <Text style={styles.details}>
                <Text style={styles.typeLabel}>{typeLabel}:</Text>{" "}
                {amount.toLocaleString()} UGX
              </Text>
              {item.commissionEarned !== undefined &&
                item.commissionEarned !== null && (
                  <Text style={styles.commissionDetails}>
                    {t("commission_earned")}: UGX{" "}
                    {commissionEarned.toLocaleString()}
                  </Text>
                )}
            </>
          ) : (
            <>
              <Text style={styles.details}>
                <Text style={styles.typeLabel}>{typeLabel}:</Text> {quantity}{" "}
                {t("units")}
              </Text>
              {item.type === "sell" && sellingPrice > 0 && (
                <Text style={styles.priceDetails}>
                  {t("total_price")}: UGX{" "}
                  {(sellingPrice * quantity).toLocaleString()} (UGX{" "}
                  {sellingPrice.toLocaleString()} / {t("unit")})
                </Text>
              )}
              {item.type === "restock" && costPrice > 0 && (
                <Text style={styles.priceDetails}>
                  {t("total_cost")}: UGX
                  {(costPrice * quantity).toLocaleString()} (UGX{" "}
                  {costPrice.toLocaleString()} / {t("unit")})
                </Text>
              )}
            </>
          )}

          <Text style={styles.timestamp}>
            {item.timestamp
              ? new Date(item.timestamp).toLocaleString("en-UG", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })
              : t("N/A")}
          </Text>
        </View>
      );
    },
    [t]
  );

  const transactionsToDisplay = transactions.filter((item) =>
    isMobileMoneyAgent ? item.isMobileMoney : !item.isMobileMoney
  );

  const headerTitleText = isMobileMoneyAgent
    ? t("mobile_money_transactions")
    : t("general_shop_transactions");

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{headerTitleText}</Text>
      </View>

      <View style={styles.container}>
        {!loading && transactionsToDisplay.length > 0 && (
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={handleClearHistory}
            disabled={loading}
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
            keyExtractor={(item) => item.id || Math.random().toString()}
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
    paddingTop: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    backgroundColor: "#6c757d",
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
  container: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: "stretch",
  },
  clearAllButton: {
    backgroundColor: "#dc3545",
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
    borderLeftColor: "#d9534f",
  },
  restockCard: {
    borderLeftWidth: 5,
    borderLeftColor: "#5cb85c",
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
