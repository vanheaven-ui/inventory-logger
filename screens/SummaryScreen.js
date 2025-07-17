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
} from "../storage/dataStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
          mmSellCount++;
          mmTotalTransactionValue += transaction.amount || 0;
          mmTotalCommissionEarned += transaction.commissionEarned || 0;
        } else if (transaction.type === "restock") {
          mmRestockCount++;
          mmTotalTransactionValue += transaction.amount || 0;
          mmTotalCommissionEarned += transaction.commissionEarned || 0;
        }
      } else {
        if (transaction.type === "sell") {
          genSellCount += transaction.quantity || 0;
          genTotalSalesRevenue += transaction.amount || 0;
          genNumSalesTransactions++;
        } else if (transaction.type === "restock") {
          genRestockCount += transaction.quantity || 0;
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

    await saveDailySummaryData(savedData);
    console.log(
      "SummaryScreen: Calculated and saved new combined summary:",
      savedData
    );

    return savedData;
  }, []);

  const loadData = useCallback(async () => {
    console.log("SummaryScreen: Starting loadData...");
    setLoading(true);
    try {
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
        await calculateAndSetSummary(transactionsSinceLastReset);
      }
    } catch (error) {
      console.error("SummaryScreen: Error loading summary data:", error);
      Toast.show({
        type: "error",
        text1: t("error_loading_summary"),
      });
      setGeneralSummary(DEFAULT_SUMMARY_STATE);
      setMobileMoneySummary(DEFAULT_MOBILE_MONEY_SUMMARY_STATE);
      setOverallNetProfitOrLoss(0);
      setHasCalculatedSummary(false);
    } finally {
      setLoading(false);
      console.log("SummaryScreen: Finished loadData.");
    }
  }, [t, calculateAndSetSummary]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      console.log("SummaryScreen: Focused. Loading data...");
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

              const calculatedSummary = await calculateAndSetSummary(
                relevantTransactions
              );
              console.log(
                "SummaryScreen (Close Business): Summary calculated for closing period."
              );

              let currentPhysicalCash = await getPhysicalCash();
              const profitLossForPeriod =
                calculatedSummary.overallNetProfitOrLoss;
              currentPhysicalCash += profitLossForPeriod;

              await savePhysicalCash(currentPhysicalCash);
              console.log(
                "SummaryScreen: Physical cash updated to:",
                currentPhysicalCash
              );

              await setLastSummaryResetTimestamp(Date.now());
              console.log(
                "SummaryScreen (Close Business): New summary reset timestamp set to now. New period begins."
              );

              Toast.show({
                type: "success",
                text1: t("close_business_success"),
              });
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("todays_summary")}</Text>
        <Text style={styles.lastResetText}>{lastResetDateDisplay}</Text>
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
                  {isMobileMoneyAgent && (
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
                  )}

                  {!isMobileMoneyAgent && (
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
    // Remove paddingTop here or set to 0
    paddingTop: 0, // This removes the top padding from SafeAreaView
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
  closeBusinessButton: {
    backgroundColor: "#28a745",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    marginBottom: 60,
    width: "95%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  closeBusinessButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
});
