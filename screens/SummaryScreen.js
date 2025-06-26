// screens/SummaryScreen.js
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import Toast from "react-native-toast-message";
import { useLanguage } from "../context/LanguageContext";
import {
  getTransactions,
  setLastSummaryResetTimestamp,
  getLastSummaryResetTimestamp,
  saveDailySummaryData, // New import
  getDailySummaryData, // New import
} from "../storage/transactionStorage";

export default function SummaryScreen({ navigation }) {
  const [summary, setSummary] = useState({ sellCount: 0, restockCount: 0 });
  const [transactionTotals, setTransactionTotals] = useState({
    totalSalesRevenue: 0,
    totalCostOfRestocks: 0,
  });
  const [loading, setLoading] = useState(false);
  const [hasCalculatedSummary, setHasCalculatedSummary] = useState(false); // New state to track if a summary has been calculated for the current period
  const { t } = useLanguage();

  const loadData = useCallback(async () => {
    console.log("SummaryScreen: Starting loadData...");
    setLoading(true);
    try {
      // First, try to load the previously saved daily summary data
      const savedSummaryData = await getDailySummaryData();
      if (savedSummaryData) {
        setSummary({
          sellCount: savedSummaryData.sellCount,
          restockCount: savedSummaryData.restockCount,
        });
        setTransactionTotals({
          totalSalesRevenue: savedSummaryData.totalSalesRevenue,
          totalCostOfRestocks: savedSummaryData.totalCostOfRestocks,
        });
        setHasCalculatedSummary(true); // Indicate that a summary is available
        console.log("SummaryScreen: Loaded saved summary data.");
      } else {
        // If no saved summary, reset to default empty values and indicate no summary calculated yet
        setSummary({ sellCount: 0, restockCount: 0 });
        setTransactionTotals({ totalSalesRevenue: 0, totalCostOfRestocks: 0 });
        setHasCalculatedSummary(false);
        console.log("SummaryScreen: No saved summary data found.");
      }
    } catch (error) {
      console.error("SummaryScreen: Error loading saved summary data:", error);
      Toast.show({
        type: "error",
        text1: t("error_loading_summary"),
      });
      // Ensure states are reset on error
      setSummary({ sellCount: 0, restockCount: 0 });
      setTransactionTotals({ totalSalesRevenue: 0, totalCostOfRestocks: 0 });
      setHasCalculatedSummary(false);
    } finally {
      setLoading(false);
      console.log("SummaryScreen: Finished loadData.");
    }
  }, [t]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadData();
    });

    return unsubscribe;
  }, [navigation, loadData]);

  const handleCloseBusiness = () => {
    console.log("SummaryScreen: Initiating Close Business process.");
    Alert.alert(
      t("confirm_close_business_title"),
      t("confirm_close_business_message"),
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            console.log("Close Business cancelled.");
            Toast.show({ type: "info", text1: t("close_business_cancelled") });
          },
        },
        {
          text: "Close Business",
          style: "destructive",
          onPress: async () => {
            setLoading(true); // Start loading when calculating
            try {
              const storedTransactions = await getTransactions();
              const transactionsData = storedTransactions || [];

              const lastResetTimestamp = await getLastSummaryResetTimestamp();
              const resetDate = new Date(lastResetTimestamp);
              console.log(
                "SummaryScreen (Close Business): Transactions since timestamp:",
                lastResetTimestamp,
                " (",
                resetDate.toLocaleString(),
                ")"
              );

              const relevantTransactions = transactionsData.filter(
                (transaction) => {
                  const transactionTimestamp = new Date(
                    transaction.timestamp
                  ).getTime();
                  return transactionTimestamp >= lastResetTimestamp;
                }
              );
              console.log(
                "SummaryScreen (Close Business): Relevant transactions count:",
                relevantTransactions.length
              );

              let currentPeriodSellCount = 0;
              let currentPeriodRestockCount = 0;
              let currentPeriodSalesRevenue = 0;
              let currentPeriodCostOfRestocks = 0;

              relevantTransactions.forEach((transaction) => {
                if (transaction.type === "sell") {
                  currentPeriodSellCount++;
                  currentPeriodSalesRevenue +=
                    (transaction.quantity || 0) *
                    (parseFloat(transaction.sellingPrice) || 0);
                } else if (transaction.type === "restock") {
                  currentPeriodRestockCount++;
                  currentPeriodCostOfRestocks +=
                    (transaction.quantity || 0) *
                    (parseFloat(transaction.costPrice) || 0);
                }
              });

              // Update state with newly calculated values
              setSummary({
                sellCount: currentPeriodSellCount,
                restockCount: currentPeriodRestockCount,
              });
              setTransactionTotals({
                totalSalesRevenue: currentPeriodSalesRevenue,
                totalCostOfRestocks: currentPeriodCostOfRestocks,
              });
              setHasCalculatedSummary(true); // Now we have a summary calculated

              // Save the calculated summary data for persistence
              const newDailySummaryData = {
                sellCount: currentPeriodSellCount,
                restockCount: currentPeriodRestockCount,
                totalSalesRevenue: currentPeriodSalesRevenue,
                totalCostOfRestocks: currentPeriodCostOfRestocks,
                calculatedAt: Date.now(), // Store when it was calculated
              };
              await saveDailySummaryData(newDailySummaryData);
              console.log(
                "SummaryScreen (Close Business): Saved new daily summary data."
              );

              // Set new reset timestamp for the next period
              await setLastSummaryResetTimestamp(Date.now());
              console.log(
                "SummaryScreen (Close Business): New summary reset timestamp set."
              );

              Toast.show({
                type: "success",
                text1: t("close_business_success"),
              });

              // Optionally, you might want to automatically navigate to another screen
              // or refresh some other part of the app here.
            } catch (error) {
              console.error(
                "SummaryScreen: Error during Close Business process:",
                error
              );
              Toast.show({ type: "error", text1: t("close_business_error") });
            } finally {
              setLoading(false);
              console.log("SummaryScreen: Finished Close Business process.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("todays_summary")}</Text>
      </View>
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="#007bff" />
        ) : (
          <>
            {!hasCalculatedSummary ? (
              <Text style={styles.noDataText}>{t("no_summary_data")}</Text>
            ) : transactionTotals.totalSalesRevenue === 0 &&
              transactionTotals.totalCostOfRestocks === 0 &&
              summary.sellCount === 0 &&
              summary.restockCount === 0 ? (
              <Text style={styles.noDataText}>
                {t("no_transactions_for_period")}
              </Text>
            ) : (
              <>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>{t("sales")}</Text>
                  <Text style={styles.summaryValue}>{summary.sellCount}</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>{t("restocks")}</Text>
                  <Text style={styles.summaryValue}>
                    {summary.restockCount}
                  </Text>
                </View>

                <View style={styles.transactionValueCard}>
                  <Text style={styles.transactionValueLabel}>
                    {t("total_sales_revenue")}
                  </Text>
                  <Text style={styles.transactionValueText}>
                    UGX {transactionTotals.totalSalesRevenue.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.transactionValueCard}>
                  <Text style={styles.transactionValueLabel}>
                    {t("total_cost_of_restocks")}
                  </Text>
                  <Text style={styles.transactionValueText}>
                    UGX {transactionTotals.totalCostOfRestocks.toLocaleString()}
                  </Text>
                </View>
              </>
            )}

            {/* Close Business Button */}
            <TouchableOpacity
              style={styles.closeBusinessButton}
              onPress={handleCloseBusiness}
              disabled={loading}
            >
              <Text style={styles.closeBusinessButtonText}>
                {t("close_business")}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#eef2f5",
  },
  header: {
    backgroundColor: "#17a2b8",
    paddingVertical: 30,
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 25,
    marginBottom: 20,
    width: "90%",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  summaryLabel: {
    fontSize: 18,
    color: "#555",
    marginBottom: 10,
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#333",
  },
  transactionValueCard: {
    backgroundColor: "#f8d7da",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    width: "90%",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  transactionValueLabel: {
    fontSize: 16,
    color: "#721c24",
    marginBottom: 8,
    fontWeight: "bold",
  },
  transactionValueText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#dc3545",
  },
  closeBusinessButton: {
    // Style for the new close business button
    backgroundColor: "#007bff", // Blue color
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30, // More space above
    width: "90%",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  closeBusinessButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  noDataText: {
    // Style for informational messages
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 50,
    paddingHorizontal: 20,
  },
});
