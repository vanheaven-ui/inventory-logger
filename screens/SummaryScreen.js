// SummaryScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLanguage } from "../context/LanguageContext"; // Corrected typo

export default function SummaryScreen({ navigation }) {
  const [summary, setSummary] = useState({ sell: 0, restock: 0 });
  const { t } = useLanguage();

  useEffect(() => {
    async function loadData() {
      const stored = await AsyncStorage.getItem("transactions");
      const data = stored ? JSON.parse(stored) : [];
      // Filter transactions for today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of today

      const todayTransactions = data.filter((transaction) => {
        const transactionDate = new Date(transaction.timestamp);
        return transactionDate.toDateString() === today.toDateString();
      });

      const sellCount = todayTransactions.filter(
        (transaction) => transaction.type === "sell"
      ).length;
      const restockCount = todayTransactions.filter(
        (transaction) => transaction.type === "restock"
      ).length;
      setSummary({ sell: sellCount, restock: restockCount });
    }

    const unsubscribe = navigation.addListener("focus", () => {
      loadData(); // Reload data when screen is focused
    });

    return unsubscribe;
  }, []); // Added navigation as dependency for better re-fetch on focus, if navigation context is available

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("todays_summary")}</Text>
      </View>
      <View style={styles.container}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t("sales")}</Text>
          <Text style={styles.summaryValue}>{summary.sell}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t("restocks")}</Text>
          <Text style={styles.summaryValue}>{summary.restock}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#eef2f5", // Light background for overall screen
  },
  header: {
    backgroundColor: "#17a2b8", // Header background color
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
});
