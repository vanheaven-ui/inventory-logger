import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Button, Alert } from "react-native";
import {
  getTransactions,
  overwriteTransactions,
} from "../storage/transactionStorage"; // Make sure both are exported from this file
import { formatDateTime } from "../utils/formatUtils"; // Optional: format timestamp
import { SafeAreaView } from "react-native-safe-area-context";

const TransactionHistoryScreen = () => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const allTransactions = await getTransactions();
      setTransactions(allTransactions.reverse()); // Show latest first
    } catch (error) {
      console.error("Failed to load transactions:", error);
    }
  };

  const handleClearHistory = async () => {
    try {
      const allTransactions = await getTransactions();

      const today = new Date().toDateString();
      const transactionsToKeep = allTransactions.filter((transaction) => {
        const transactionDate = new Date(transaction.timestamp).toDateString();
        return transactionDate === today; // Keep only today's
      });

      await overwriteTransactions(transactionsToKeep);
      setTransactions(transactionsToKeep.reverse()); // Ensure newest first

      Alert.alert("Success", "All past transactions cleared (today's kept).");
    } catch (error) {
      console.error("Failed to clear transaction history:", error);
      Alert.alert("Error", "Could not clear transaction history.");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.transactionItem}>
      <Text style={styles.type}>
        {item.type === "sell" ? "Sale" : "Restock"} -{" "}
        {item.isMobileMoney ? "Mobile Money" : "General"}
      </Text>
      <Text>Item: {item.itemName}</Text>
      <Text>Quantity: {item.quantity}</Text>
      <Text>Amount: {item.amount}</Text>
      {item.commissionEarned !== undefined && (
        <Text>Commission: {item.commissionEarned}</Text>
      )}
      <Text style={styles.date}>{formatDateTime(item.timestamp)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Transaction History</Text>
      {transactions.length === 0 ? (
        <Text style={styles.noTransactions}>No transactions to show.</Text>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      )}
      <View style={styles.clearButtonContainer}>
        <Button
          title="Clear History (Keep Today's)"
          onPress={handleClearHistory}
        />
      </View>
    </SafeAreaView>
  );
};

export default TransactionHistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fdfdfd",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },
  transactionItem: {
    padding: 12,
    marginVertical: 8,
    backgroundColor: "#f1f1f1",
    borderRadius: 8,
  },
  type: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  date: {
    color: "#555",
    marginTop: 4,
  },
  noTransactions: {
    marginTop: 20,
    textAlign: "center",
    fontStyle: "italic",
    color: "#666",
  },
  clearButtonContainer: {
    marginTop: 20,
  },
});
