import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage"; 
import { useLanguage } from "../context/LaguageContext";

export default function SummaryScreen() {
  const [summary, setSummary] = useState({ sell: 0, restock: 0 });
  const { t } = useLanguage();

  useEffect(() => {
    async function loadData() {
      const stored = await AsyncStorage.getItem("transactions");
      const data = stored ? JSON.parse(stored) : [];
      // Filter transactions for today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of today

      const todayTransactions = data.filter((t) => {
        const transactionDate = new Date(t.timestamp);
        return transactionDate.toDateString() === today.toDateString();
      });

      const sell = todayTransactions.filter((t) => t.type === "sell").length;
      const restock = todayTransactions.filter(
        (t) => t.type === "restock"
      ).length;
      setSummary({ sell, restock });
    }

    loadData();
  }, []); // Empty dependency array means this runs once on mount

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("todays_summary")}</Text>
      <Text style={styles.text}>
        {t("sales")}: {summary.sell}
      </Text>
      <Text style={styles.text}>
        {t("restocks")}: {summary.restock}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f6f6f6",
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#333" },
  text: { fontSize: 18, marginVertical: 5, color: "#555" },
});
