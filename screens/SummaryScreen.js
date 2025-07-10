import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  ScrollView,
} from "react-native";
import Toast from "react-native-toast-message";
import { useLanguage } from "../context/LanguageContext";
import {
  getTransactions,
  setLastSummaryResetTimestamp,
  getLastSummaryResetTimestamp,
  saveDailySummaryData,
  getDailySummaryData,
  getPhysicalCash,
  savePhysicalCash,
} from "../storage/transactionStorage";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage

// Key for AsyncStorage (ensure this is consistent with HomeScreen)
const IS_AGENT_KEY = "isMobileMoneyAgent";

// Define a default empty summary object for clarity and consistency
const DEFAULT_SUMMARY_STATE = {
  sellCount: 0,
  restockCount: 0,
  totalSalesRevenue: 0,
  totalCostOfRestocks: 0,
  netProfitOrLoss: 0,
  numberOfSalesTransactions: 0, // New: General sales count
  numberOfRestockTransactions: 0, // New: General restock count
};

const DEFAULT_MOBILE_MONEY_SUMMARY_STATE = {
  sellCount: 0, // Withdrawals count
  restockCount: 0, // Deposits count
  totalTransactionValue: 0,
  totalCommissionEarned: 0,
  netProfitOrLoss: 0,
  numberOfWithdrawalTransactions: 0, // New: Mobile Money withdrawal count
  numberOfDepositTransactions: 0, // New: Mobile Money deposit count
};

export default function SummaryScreen({ navigation }) {
  const [generalSummary, setGeneralSummary] = useState(DEFAULT_SUMMARY_STATE);
  const [mobileMoneySummary, setMobileMoneySummary] = useState(
    DEFAULT_MOBILE_MONEY_SUMMARY_STATE
  );
  const [overallNetProfitOrLoss, setOverallNetProfitOrLoss] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasCalculatedSummary, setHasCalculatedSummary] = useState(false);
  const [lastResetDateDisplay, setLastResetDateDisplay] = useState("");
  const [isMobileMoneyAgent, setIsMobileMoneyAgent] = useState(false); // New state for agent status
  const { t } = useLanguage();

  const formatCurrency = useCallback((amount) => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      return `UGX 0`;
    }
    return `UGX ${numericAmount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }, []);

  const calculateAndSetSummary = useCallback(async (transactionsToProcess) => {
    console.log(
      "calculateAndSetSummary called with",
      transactionsToProcess.length,
      "transactions."
    );
    let genSellCount = 0; // Total quantity sold for general items
    let genRestockCount = 0; // Total quantity restocked for general items
    let genTotalSalesRevenue = 0;
    let genTotalCostOfRestocks = 0;
    let genNumSalesTransactions = 0; // New: Number of distinct sales transactions
    let genNumRestockTransactions = 0; // New: Number of distinct restock transactions

    let mmSellCount = 0; // Withdrawals count (represents quantity of withdrawals if applicable or just count)
    let mmRestockCount = 0; // Deposits count (represents quantity of deposits if applicable or just count)
    let mmTotalTransactionValue = 0;
    let mmTotalCommissionEarned = 0;
    let mmNumWithdrawalTransactions = 0; // New: Number of distinct withdrawal transactions
    let mmNumDepositTransactions = 0; // New: Number of distinct deposit transactions

    transactionsToProcess.forEach((transaction) => {
      if (transaction.isMobileMoneyAgent) {
        if (transaction.type === "sell") {
          mmSellCount++; // Increment count for each mobile money withdrawal transaction
          mmTotalTransactionValue += transaction.amount || 0;
          mmTotalCommissionEarned += transaction.commissionEarned || 0;
          mmNumWithdrawalTransactions++;
        } else if (transaction.type === "restock") {
          mmRestockCount++; // Increment count for each mobile money deposit transaction
          mmTotalTransactionValue += transaction.amount || 0;
          mmTotalCommissionEarned += transaction.commissionEarned || 0;
          mmNumDepositTransactions++;
        }
      } else {
        // General Shop Transactions
        if (transaction.type === "sell") {
          genSellCount += transaction.quantity || 1; // Sum quantities for general sales
          genTotalSalesRevenue += transaction.amount || 0;
          genNumSalesTransactions++;
        } else if (transaction.type === "restock") {
          genRestockCount += transaction.quantity || 1; // Sum quantities for general restocks
          genTotalCostOfRestocks += transaction.amount || 0;
          genNumRestockTransactions++;
        }
      }
    });

    const genNetProfitOrLoss = genTotalSalesRevenue - genTotalCostOfRestocks;
    const mmNetProfitOrLoss = mmTotalCommissionEarned;
    const combinedNetProfitOrLoss = genNetProfitOrLoss + mmNetProfitOrLoss;

    const newGeneralSummary = {
      sellCount: genSellCount,
      restockCount: genRestockCount,
      totalSalesRevenue: genTotalSalesRevenue,
      totalCostOfRestocks: genTotalCostOfRestocks,
      netProfitOrLoss: genNetProfitOrLoss,
      numberOfSalesTransactions: genNumSalesTransactions,
      numberOfRestockTransactions: genNumRestockTransactions,
    };

    const newMobileMoneySummary = {
      sellCount: mmSellCount,
      restockCount: mmRestockCount,
      totalTransactionValue: mmTotalTransactionValue,
      totalCommissionEarned: mmTotalCommissionEarned,
      netProfitOrLoss: mmNetProfitOrLoss,
      numberOfWithdrawalTransactions: mmNumWithdrawalTransactions,
      numberOfDepositTransactions: mmNumDepositTransactions,
    };

    // Set state variables
    setGeneralSummary(newGeneralSummary);
    setMobileMoneySummary(newMobileMoneySummary);
    setOverallNetProfitOrLoss(combinedNetProfitOrLoss);
    setHasCalculatedSummary(true);

    // Construct the data to be saved
    const savedData = {
      generalSummary: newGeneralSummary,
      mobileMoneySummary: newMobileMoneySummary,
      overallNetProfitOrLoss: combinedNetProfitOrLoss,
      calculatedAt: Date.now(),
    };

    // Explicitly save the data here!
    await saveDailySummaryData(savedData);
    console.log(
      "SummaryScreen: Calculated and saved new combined summary:",
      savedData
    );

    return savedData; // Return the calculated data for immediate use by caller
  }, []);

  const loadData = useCallback(async () => {
    console.log("SummaryScreen: Starting loadData...");
    setLoading(true);
    try {
      // Load agent status first
      const storedAgentStatus = await AsyncStorage.getItem(IS_AGENT_KEY);
      const agentStatus =
        storedAgentStatus !== null ? JSON.parse(storedAgentStatus) : false;
      setIsMobileMoneyAgent(agentStatus);
      console.log("SummaryScreen: Loaded isMobileMoneyAgent:", agentStatus);

      const savedSummaryData = await getDailySummaryData();
      const lastResetTimestamp = await getLastSummaryResetTimestamp();

      if (lastResetTimestamp === 0) {
        setLastResetDateDisplay(t("since_app_start"));
      } else {
        const resetDate = new Date(lastResetTimestamp);
        setLastResetDateDisplay(
          `${t("since")} ${resetDate.toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}`
        );
      }

      if (
        savedSummaryData &&
        savedSummaryData.generalSummary &&
        savedSummaryData.mobileMoneySummary
      ) {
        // Ensure that nested objects exist before setting state
        setGeneralSummary(savedSummaryData.generalSummary);
        setMobileMoneySummary(savedSummaryData.mobileMoneySummary);
        setOverallNetProfitOrLoss(savedSummaryData.overallNetProfitOrLoss || 0);
        setHasCalculatedSummary(true);
        console.log(
          "SummaryScreen: Loaded saved summary data.",
          savedSummaryData
        );
      } else {
        console.log(
          "SummaryScreen: No saved summary data found or incomplete. Recalculating from transactions."
        );
        // If no saved summary, calculate from all transactions since last reset
        const allTransactions = await getTransactions();
        const transactionsSinceLastReset = allTransactions.filter(
          (transaction) => {
            const transactionTimestamp = new Date(
              transaction.timestamp
            ).getTime();
            return transactionTimestamp >= lastResetTimestamp;
          }
        );
        console.log(
          "SummaryScreen: Calculating from relevant transactions (count: " +
            transactionsSinceLastReset.length +
            ")."
        );
        // Call calculateAndSetSummary which will also save the data
        await calculateAndSetSummary(transactionsSinceLastReset);
      }
    } catch (error) {
      console.error("SummaryScreen: Error loading summary data:", error);
      Toast.show({
        type: "error",
        text1: t("error_loading_summary"),
      });
      // Reset all summaries on error or if no data
      setGeneralSummary(DEFAULT_SUMMARY_STATE);
      setMobileMoneySummary(DEFAULT_MOBILE_MONEY_SUMMARY_STATE);
      setOverallNetProfitOrLoss(0);
      setHasCalculatedSummary(false); // Make sure this is false if there's an error or no data
    } finally {
      setLoading(false);
      console.log("SummaryScreen: Finished loadData.");
    }
  }, [t, calculateAndSetSummary]); // calculateAndSetSummary is a dependency as it's called here

  useEffect(() => {
    // This listener ensures loadData runs every time the screen comes into focus
    const unsubscribe = navigation.addListener("focus", () => {
      console.log("SummaryScreen: Focused. Loading data...");
      loadData();
    });

    // Cleanup function
    return unsubscribe;
  }, [navigation, loadData]);

  const handleCloseBusiness = () => {
    console.log("SummaryScreen: Initiating Close Business process.");
    Alert.alert(
      t("confirm_close_business_title"),
      t("confirm_close_business_message"),
      [
        {
          text: t("cancel"),
          style: "cancel",
          onPress: () => {
            console.log("Close Business cancelled.");
            Toast.show({ type: "info", text1: t("close_business_cancelled") });
          },
        },
        {
          text: t("close_business_button"),
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const storedTransactions = await getTransactions();
              const transactionsData = storedTransactions || [];

              const lastResetTimestamp = await getLastSummaryResetTimestamp();

              // Filter transactions for the current period *before* resetting the timestamp
              const relevantTransactions = transactionsData.filter(
                (transaction) => {
                  const transactionTimestamp = new Date(
                    transaction.timestamp
                  ).getTime();
                  return transactionTimestamp >= lastResetTimestamp;
                }
              );
              console.log(
                "SummaryScreen (Close Business): Relevant transactions count for calculation:",
                relevantTransactions.length
              );

              // Calculate the summary for the period that is about to close.
              // This also updates the component's state and saves the data.
              const calculatedSummary = await calculateAndSetSummary(
                relevantTransactions
              );
              console.log(
                "SummaryScreen (Close Business): Summary calculated for closing period."
              );

              // Update the physical cash with the net profit/loss from the *just calculated* period.
              let currentPhysicalCash = await getPhysicalCash();
              const profitLossForPeriod =
                calculatedSummary.overallNetProfitOrLoss;
              currentPhysicalCash += profitLossForPeriod;

              await savePhysicalCash(currentPhysicalCash);
              console.log(
                "SummaryScreen: Physical cash updated to:",
                currentPhysicalCash
              );

              // Now, set the new summary reset timestamp to mark the beginning of the next period.
              await setLastSummaryResetTimestamp(Date.now());
              console.log(
                "SummaryScreen (Close Business): New summary reset timestamp set to now. New period begins."
              );

              Toast.show({
                type: "success",
                text1: t("close_business_success"),
              });

              // After "closing business," the current screen should display the summary
              // of the period that was just closed. The `calculateAndSetSummary` call above
              // already updated the state, so the UI should reflect this.
              // When the user next navigates to this screen, `loadData` will then pick up
              // the *new* reset timestamp and show an empty summary for the new period.
              // No explicit loadData() call needed here, as the state is already updated.
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

  const handleResetSummary = () => {
    console.log("SummaryScreen: Initiating Reset Summary process.");
    Alert.alert(
      t("confirm_reset_summary_title"),
      t("confirm_reset_summary_message"),
      [
        {
          text: t("cancel"),
          style: "cancel",
          onPress: () => {
            console.log("Reset Summary cancelled.");
            Toast.show({ type: "info", text1: t("reset_summary_cancelled") });
          },
        },
        {
          text: t("reset"),
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await setLastSummaryResetTimestamp(0); // Reset to epoch, meaning calculate from all transactions
              await saveDailySummaryData(null); // Clear saved summary
              console.log(
                "SummaryScreen: Summary reset timestamp and saved data cleared."
              );

              Toast.show({
                type: "success",
                text1: t("summary_reset_success"),
              });
              // After resetting, we want to load all transactions from the beginning
              loadData();
            } catch (error) {
              console.error("SummaryScreen: Error resetting summary:", error);
              Toast.show({
                type: "error",
                text1: t("summary_reset_error"),
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderSummaryCard = (label, value) => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );

  const renderTransactionValueCard = (label, amount) => (
    <View style={styles.transactionValueCard}>
      <Text style={styles.transactionValueLabel}>{label}</Text>
      <Text style={styles.transactionValueText}>{formatCurrency(amount)}</Text>
    </View>
  );

  const renderNetProfitCard = (label, amount) => (
    <View
      style={[
        styles.netProfitCard,
        amount >= 0 ? styles.netProfitPositive : styles.netProfitNegative,
      ]}
    >
      <Text style={styles.netProfitLabel}>{label}</Text>
      <Text style={styles.netProfitValue}>{formatCurrency(amount)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("todays_summary")}</Text>
        <Text style={styles.lastResetText}>{lastResetDateDisplay}</Text>
        {/* Only show reset button if a summary has been calculated (or loaded) */}
        {hasCalculatedSummary && (
          <TouchableOpacity
            style={styles.headerResetButton}
            onPress={handleResetSummary}
            disabled={loading}
          >
            <Text style={styles.headerResetButtonText}>
              {t("reset_summary_short")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView style={styles.scrollViewContent}>
        <View style={styles.container}>
          {loading ? (
            <ActivityIndicator size="large" color="#007bff" />
          ) : (
            <>
              {/* Check if a summary exists at all or if all counts are zero to display "no data" */}
              {!hasCalculatedSummary ||
              (generalSummary.sellCount === 0 &&
                generalSummary.restockCount === 0 &&
                mobileMoneySummary.sellCount === 0 &&
                mobileMoneySummary.restockCount === 0 &&
                overallNetProfitOrLoss === 0) ? (
                <Text style={styles.noDataText}>{t("no_summary_data")}</Text>
              ) : (
                <>
                  {isMobileMoneyAgent ? ( // Conditional rendering based on agent status
                    <>
                      {/* Mobile Money Summary Section */}
                      <Text style={styles.sectionTitle}>
                        {t("mobile_money_summary")}
                      </Text>
                      <View style={styles.summaryRow}>
                        {renderSummaryCard(
                          t("withdrawals_count"),
                          mobileMoneySummary.sellCount
                        )}
                        {renderSummaryCard(
                          t("deposits_count"),
                          mobileMoneySummary.restockCount
                        )}
                      </View>
                      <View style={styles.summaryRow}>
                        {renderSummaryCard(
                          t("withdrawal_transactions"),
                          mobileMoneySummary.numberOfWithdrawalTransactions
                        )}
                        {renderSummaryCard(
                          t("deposit_transactions"),
                          mobileMoneySummary.numberOfDepositTransactions
                        )}
                      </View>
                      {renderTransactionValueCard(
                        t("total_mm_transaction_value"),
                        mobileMoneySummary.totalTransactionValue
                      )}
                      {renderTransactionValueCard(
                        t("total_commission_earned"),
                        mobileMoneySummary.totalCommissionEarned
                      )}
                      {renderNetProfitCard(
                        t("mobile_money_net_profit_loss"),
                        mobileMoneySummary.netProfitOrLoss
                      )}
                    </>
                  ) : (
                    <>
                      {/* General Shop Summary Section */}
                      <Text style={styles.sectionTitle}>
                        {t("general_shop_summary")}
                      </Text>
                      <View style={styles.summaryRow}>
                        {renderSummaryCard(
                          t("items_sold"),
                          generalSummary.sellCount
                        )}
                        {renderSummaryCard(
                          t("items_restocked"),
                          generalSummary.restockCount
                        )}
                      </View>
                      <View style={styles.summaryRow}>
                        {renderSummaryCard(
                          t("sales_transactions"),
                          generalSummary.numberOfSalesTransactions
                        )}
                        {renderSummaryCard(
                          t("restock_transactions"),
                          generalSummary.numberOfRestockTransactions
                        )}
                      </View>
                      {renderTransactionValueCard(
                        t("total_sales_revenue"),
                        generalSummary.totalSalesRevenue
                      )}
                      {renderTransactionValueCard(
                        t("total_cost_of_restocks"),
                        generalSummary.totalCostOfRestocks
                      )}
                      {renderNetProfitCard(
                        t("general_net_profit_loss"),
                        generalSummary.netProfitOrLoss
                      )}
                    </>
                  )}

                  <View style={styles.divider} />

                  {/* Overall Business Summary (Always shown) */}
                  <Text style={styles.sectionTitle}>
                    {t("overall_business_summary")}
                  </Text>
                  {renderNetProfitCard(
                    t("overall_net_profit_loss"),
                    overallNetProfitOrLoss
                  )}
                </>
              )}

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
      </ScrollView>
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
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    flexDirection: "column",
    position: "relative",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 5,
  },
  lastResetText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 10,
  },
  headerResetButton: {
    position: "absolute",
    right: 15,
    top: Platform.OS === "ios" ? 45 : StatusBar.currentHeight + 10,
    backgroundColor: "#6c757d",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  headerResetButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  scrollViewContent: {
    flex: 1,
  },
  container: {
    padding: 20,
    alignItems: "center",
  },
  noDataText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 50,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 25,
    marginBottom: 15,
    textAlign: "center",
    width: "100%",
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 10,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    width: "45%",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: "#555",
    marginBottom: 8,
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#333",
  },
  transactionValueCard: {
    backgroundColor: "#e0f7fa",
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
    color: "#007bff",
    marginBottom: 8,
    fontWeight: "bold",
  },
  transactionValueText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0056b3",
  },
  netProfitCard: {
    borderRadius: 15,
    padding: 20,
    marginTop: 10,
    marginBottom: 20,
    width: "90%",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  netProfitPositive: {
    backgroundColor: "#d4edda",
  },
  netProfitNegative: {
    backgroundColor: "#f8d7da",
  },
  netProfitLabel: {
    fontSize: 18,
    marginBottom: 8,
    fontWeight: "bold",
    color: "#333",
  },
  netProfitValue: {
    fontSize: 36,
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#ccc",
    width: "80%",
    marginVertical: 30,
  },
  closeBusinessButton: {
    backgroundColor: "#28a745",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    marginBottom: 50,
    width: "90%",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  closeBusinessButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
