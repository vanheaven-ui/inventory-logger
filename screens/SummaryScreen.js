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
  getDailySummaryData, // This will now be properly utilized
  clearDailySummaryData, // NEW: function to clear saved summary
  getPhysicalCash,
  savePhysicalCash,
  saveBusinessStatus,
  getBusinessStatus,
} from "../storage/dataStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FocusAwareStatusBar from "../components/FocusAwareStatusBar";

const IS_AGENT_KEY = "isMobileMoneyAgent";
const DEFAULT_SUMMARY_STATE = {
  sellCount: 0,
  restockCount: 0,
  totalSalesRevenue: 0,
  totalCostOfRestocks: 0,
  netProfitOrLoss: 0,
  numberOfSalesTransactions: 0,
  numberOfRestockTransactions: 0,
};

const DEFAULT_MOBILE_MONEY_SUMMARY_STATE = {
  sellCount: 0,
  restockCount: 0,
  totalTransactionValue: 0,
  totalCommissionEarned: 0,
  netProfitOrLoss: 0,
  numberOfWithdrawalTransactions: 0,
  numberOfDepositTransactions: 0,
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
  const [isMobileMoneyAgent, setIsMobileMoneyAgent] = useState(false);
  const [businessStatus, setBusinessStatus] = useState("closed");
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
    (
      "calculateAndSetSummary called with",
      transactionsToProcess.length,
      "transactions."
    );
    let genSellCount = 0;
    let genRestockCount = 0;
    let genTotalSalesRevenue = 0;
    let genTotalCostOfRestocks = 0;
    let genNumSalesTransactions = 0;
    let genNumRestockTransactions = 0;
    let mmSellCount = 0;
    let mmRestockCount = 0;
    let mmTotalTransactionValue = 0;
    let mmTotalCommissionEarned = 0;

    transactionsToProcess.forEach((transaction) => {
      if (transaction.isMobileMoneyAgent) {
        if (transaction.type === "sell") {
          // Assuming 'sell' for MM means withdrawal, 'amount' is transaction value, 'commissionEarned' is agent commission
          mmSellCount++;
          mmTotalTransactionValue += transaction.amount || 0;
          mmTotalCommissionEarned += transaction.commissionEarned || 0;
        } else if (transaction.type === "restock") {
          // Assuming 'restock' for MM means deposit, 'amount' is transaction value, 'commissionEarned' is agent commission
          mmRestockCount++;
          mmTotalTransactionValue += transaction.amount || 0;
          mmTotalCommissionEarned += transaction.commissionEarned || 0;
        }
      } else {
        if (transaction.type === "sell") {
          genSellCount += transaction.quantity || 0;
          genTotalSalesRevenue += transaction.amount || 0; // Assuming 'amount' is the selling price
          genNumSalesTransactions++;
        } else if (transaction.type === "restock") {
          genRestockCount += transaction.quantity || 0;
          genTotalCostOfRestocks += transaction.amount || 0; // Assuming 'amount' is the cost price
          genNumRestockTransactions++;
        }
      }
    });

    const genNetProfitOrLoss = genTotalSalesRevenue - genTotalCostOfRestocks;
    const mmNetProfitOrLoss = mmTotalCommissionEarned; // For MM, profit is primarily commission
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
      sellCount: mmSellCount, // Number of withdrawals
      restockCount: mmRestockCount, // Number of deposits
      totalTransactionValue: mmTotalTransactionValue,
      totalCommissionEarned: mmTotalCommissionEarned,
      netProfitOrLoss: mmNetProfitOrLoss,
      numberOfWithdrawalTransactions: mmSellCount,
      numberOfDepositTransactions: mmRestockCount,
    };

    setGeneralSummary(newGeneralSummary);
    setMobileMoneySummary(newMobileMoneySummary);
    setOverallNetProfitOrLoss(combinedNetProfitOrLoss);
    setHasCalculatedSummary(true);

    const savedData = {
      generalSummary: newGeneralSummary,
      mobileMoneySummary: newMobileMoneySummary,
      overallNetProfitOrLoss: combinedNetProfitOrLoss,
      calculatedAt: Date.now(),
    };

    // Save the newly calculated summary
    await saveDailySummaryData(savedData);
    (
      "SummaryScreen: Calculated and saved new combined summary:",
      savedData
    );
    return savedData;
  }, []);

  const loadData = useCallback(async () => {
    ("SummaryScreen: Starting loadData...");
    setLoading(true);
    try {
      const storedAgentStatus = await AsyncStorage.getItem(IS_AGENT_KEY);
      const agentStatus =
        storedAgentStatus !== null ? JSON.parse(storedAgentStatus) : false;
      setIsMobileMoneyAgent(agentStatus);
      ("SummaryScreen: Loaded isMobileMoneyAgent:", agentStatus);

      // Load business status
      const storedBusinessStatus = await getBusinessStatus();
      setBusinessStatus(storedBusinessStatus);
      (
        "SummaryScreen: Loaded businessStatus:",
        storedBusinessStatus
      );

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

      // --- CRITICAL CHANGE HERE ---
      const savedSummaryData = await getDailySummaryData();
      (
        "SummaryScreen: Loaded saved summary data:",
        savedSummaryData
      );

      // Check if there's a saved summary and if it's from the current "open" period
      if (
        savedSummaryData &&
        savedSummaryData.generalSummary &&
        savedSummaryData.mobileMoneySummary &&
        savedSummaryData.calculatedAt >= lastResetTimestamp
      ) {
        // If the saved summary is current, use it
        setGeneralSummary(savedSummaryData.generalSummary);
        setMobileMoneySummary(savedSummaryData.mobileMoneySummary);
        setOverallNetProfitOrLoss(savedSummaryData.overallNetProfitOrLoss || 0);
        setHasCalculatedSummary(true);
        ("SummaryScreen: Displaying loaded summary data.");
      } else {
        // If no saved summary, or it's outdated (new business day/session), recalculate from transactions
        (
          "SummaryScreen: Saved summary outdated or not found. Recalculating from transactions since last reset."
        );
        const allTransactions = await getTransactions();
        const transactionsSinceLastReset = allTransactions.filter(
          (transaction) => {
            const transactionTimestamp = new Date(
              transaction.timestamp
            ).getTime();
            return transactionTimestamp >= lastResetTimestamp;
          }
        );
        await calculateAndSetSummary(transactionsSinceLastReset); // This will also save the new calculation
      }
    } catch (error) {
      console.error("SummaryScreen: Error loading summary data:", error);
      Toast.show({
        type: "error",
        text1: t("error_loading_summary"),
      });
      // Reset to defaults on error
      setGeneralSummary(DEFAULT_SUMMARY_STATE);
      setMobileMoneySummary(DEFAULT_MOBILE_MONEY_SUMMARY_STATE);
      setOverallNetProfitOrLoss(0);
      setHasCalculatedSummary(false);
    } finally {
      setLoading(false);
      ("SummaryScreen: Finished loadData.");
    }
  }, [t, calculateAndSetSummary]);

  const handleOpenBusiness = async () => {
    Alert.alert(
      t("confirm_open_business_title"),
      t("confirm_open_business_message"),
      [
        {
          text: t("cancel"),
          style: "cancel",
        },
        {
          text: t("open"),
          onPress: async () => {
            ("Opening business...");
            setLoading(true);
            try {
              const now = Date.now();
              await setLastSummaryResetTimestamp(now);
              await saveBusinessStatus("open");
              setBusinessStatus("open");

              // Clear the previously saved daily summary so we start fresh for the new period
              await clearDailySummaryData();
              // And then immediately calculate an empty one for display
              await calculateAndSetSummary([]);

              Toast.show({
                type: "success",
                text1: t("business_opened_success"),
              });
            } catch (error) {
              console.error("Error opening business:", error);
              Toast.show({
                type: "error",
                text1: t("business_open_error"),
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCloseBusiness = async () => {
    Alert.alert(
      t("confirm_close_business_title"),
      t("confirm_close_business_message"),
      [
        {
          text: t("cancel"),
          style: "cancel",
        },
        {
          text: t("close"),
          onPress: async () => {
            ("Closing business...");
            setLoading(true);

            try {
              const storedTransactions = await getTransactions();
              const transactionsData = storedTransactions || [];
              const lastResetTimestamp = await getLastSummaryResetTimestamp();

              const relevantTransactions = transactionsData.filter(
                (transaction) => {
                  const transactionTimestamp = new Date(
                    transaction.timestamp
                  ).getTime();
                  return transactionTimestamp >= lastResetTimestamp;
                }
              );

              // Calculate and save the final summary for the day/session
              const calculatedSummary = await calculateAndSetSummary(
                relevantTransactions
              );

              // Update physical cash (if applicable) based on the net profit/loss
              let currentPhysicalCash = await getPhysicalCash();
              currentPhysicalCash += calculatedSummary.overallNetProfitOrLoss;
              await savePhysicalCash(currentPhysicalCash);
              ("Updated Physical Cash:", currentPhysicalCash);

              await saveBusinessStatus("closed");
              setBusinessStatus("closed");

              Toast.show({
                type: "success",
                text1: t("business_closed_success"),
              });
            } catch (error) {
              console.error("Error closing business:", error);
              Toast.show({ type: "error", text1: t("close_business_error") });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // The resetSummaries function is now primarily for client-side state reset
  // and doesn't directly impact the stored daily summary.
  const resetSummaries = () => {
    setGeneralSummary(DEFAULT_SUMMARY_STATE);
    setMobileMoneySummary(DEFAULT_MOBILE_MONEY_SUMMARY_STATE);
    setOverallNetProfitOrLoss(0);
    setHasCalculatedSummary(true);
    setLastResetDateDisplay(t("since_app_start"));
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      ("SummaryScreen: Focused. Loading data...");
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  const renderValueCard = (label, amount, isProfitLoss = false) => (
    <View
      style={[
        styles.valueCard,
        isProfitLoss && amount >= 0 && styles.netProfitPositive,
        isProfitLoss && amount < 0 && styles.netProfitNegative,
      ]}
    >
      <Text style={styles.valueLabel}>{label}</Text>
      <Text style={styles.valueText}>{formatCurrency(amount)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FocusAwareStatusBar
        backgroundColor="#17a2b8"
        barStyle="light-content"
        animated={true}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("todays_summary")}</Text>
        <Text style={styles.lastResetText}>{lastResetDateDisplay}</Text>
      </View>

      <View style={styles.businessStatusContainer}>
        <Text style={styles.statusTitle}>{t("business_status")}</Text>
        <Text style={[styles.statusText, styles[`status_${businessStatus}`]]}>
          {t(`business_${businessStatus}`)}
        </Text>

        <TouchableOpacity
          style={[
            styles.businessButton,
            businessStatus === "closed"
              ? styles.button_open
              : styles.button_close,
          ]}
          onPress={
            businessStatus === "closed"
              ? handleOpenBusiness
              : handleCloseBusiness
          }
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {t(
              businessStatus === "closed"
                ? "open_business_button"
                : "close_business_button"
            )}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollViewContent}
        contentContainerStyle={styles.scrollViewContainer}
      >
        <View style={styles.container}>
          {loading ? (
            <ActivityIndicator size="large" color="#17a2b8" />
          ) : (
            <>
              {!hasCalculatedSummary &&
              generalSummary.totalSalesRevenue === 0 &&
              generalSummary.totalCostOfRestocks === 0 &&
              mobileMoneySummary.totalTransactionValue === 0 &&
              mobileMoneySummary.totalCommissionEarned === 0 &&
              overallNetProfitOrLoss === 0 ? (
                <Text style={styles.noDataText}>{t("no_summary_data")}</Text>
              ) : (
                <>
                  {isMobileMoneyAgent ? (
                    <>
                      <Text style={styles.sectionTitle}>
                        {t("mobile_money_summary_title")}
                      </Text>
                      {renderValueCard(
                        t("total_mm_transaction_value"),
                        mobileMoneySummary.totalTransactionValue
                      )}
                      {renderValueCard(
                        t("total_commission_earned"),
                        mobileMoneySummary.totalCommissionEarned
                      )}
                      {renderValueCard(
                        t("mobile_money_net_profit_loss"),
                        mobileMoneySummary.netProfitOrLoss,
                        true
                      )}
                      <View style={styles.divider} />
                    </>
                  ) : (
                    <>
                      <Text style={styles.sectionTitle}>
                        {t("general_shop_summary_title")}
                      </Text>
                      {renderValueCard(
                        t("total_sales_revenue"),
                        generalSummary.totalSalesRevenue
                      )}
                      {renderValueCard(
                        t("total_cost_of_restocks"),
                        generalSummary.totalCostOfRestocks
                      )}
                      {renderValueCard(
                        t("general_net_profit_loss"),
                        generalSummary.netProfitOrLoss,
                        true
                      )}
                      <View style={styles.divider} />
                    </>
                  )}

                  <Text style={styles.sectionTitle}>
                    {t("overall_business_summary_title")}
                  </Text>
                  {renderValueCard(
                    t("overall_net_profit_loss"),
                    overallNetProfitOrLoss,
                    true
                  )}
                </>
              )}
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
    paddingTop: 0,
  },
  header: {
    backgroundColor: "#17a2b8",
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    flexDirection: "column",
    position: "relative",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 5,
  },
  lastResetText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 10,
  },
  scrollViewContent: {
    flex: 1,
  },
  scrollViewContainer: {
    paddingBottom: 40,
  },
  container: {
    padding: 20,
    alignItems: "center",
  },
  noDataText: {
    fontSize: 18,
    color: "#888",
    textAlign: "center",
    marginTop: 80,
    paddingHorizontal: 30,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginTop: 30,
    marginBottom: 20,
    textAlign: "center",
    width: "100%",
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#cfe2ff",
  },
  valueCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 22,
    marginVertical: 10,
    width: "95%",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  valueLabel: {
    fontSize: 17,
    color: "#6c757d",
    marginBottom: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
  valueText: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#343a40",
  },
  netProfitPositive: {
    backgroundColor: "#d4edda",
    borderColor: "#28a745",
    borderWidth: 1,
  },
  netProfitNegative: {
    backgroundColor: "#f8d7da",
    borderColor: "#dc3545",
    borderWidth: 1,
  },
  divider: {
    height: 1.5,
    backgroundColor: "#ced4da",
    width: "90%",
    marginVertical: 35,
    borderRadius: 0.75,
  },
  businessStatusContainer: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 22,
    marginVertical: 10,
    width: "95%",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    alignSelf: "center",
  },
  statusTitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  statusText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
  },
  status_open: {
    color: "#28a745",
  },
  status_closed: {
    color: "#dc3545",
  },
  businessButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  button_open: {
    borderWidth: 2,
    borderColor: "#28a745",
  },
  button_close: {
    borderWidth: 2,
    borderColor: "#dc3545",
  },
  buttonText: {
    color: "#000",
    fontSize: 20,
    fontWeight: "bold",
  },
});
