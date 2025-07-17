import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Button,
  Alert,
  SafeAreaView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getTransactions,
  overwriteTransactions,
} from "../storage/dataStorage";

const IS_AGENT_KEY = "isMobileMoneyAgent";

const TransactionHistoryScreen = () => {
  const [transactions, setTransactions] = useState([]);
  const [isMobileMoneyAgent, setIsMobileMoneyAgent] = useState(false);
  const [loadingAgentStatus, setLoadingAgentStatus] = useState(true);

  useEffect(() => {
    fetchTransactions();
    fetchAgentStatus();
  }, []);

  const fetchTransactions = async () => {
    try {
      const allTransactions = await getTransactions();
      setTransactions(allTransactions.reverse()); // Latest first
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
    Alert.alert(
      "Confirm",
      "Are you sure you want to delete all transaction history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await overwriteTransactions([]);
              setTransactions([]);
              Alert.alert("Success", "All transaction history cleared.");
            } catch (error) {
              console.error("Failed to clear transaction history:", error);
              Alert.alert("Error", "Could not clear transaction history.");
            }
          },
        },
      ]
    );
  };

  const getTransactionLabel = (item) => {
    if (item.isMobileMoney) {
      // For Mobile Money transactions
      return item.type === "sell" ? "Deposit" : "Withdraw";
    } else {
      // For general transactions
      return item.type === "sell" ? "Sale" : "Restock";
    }
  };

  const getTransactionColor = (item) => {
    const isMoneyIn = item.type === "sell";
    return isMoneyIn ? styles.incoming : styles.outgoing;
  };

  const renderItem = ({ item }) => (
    <View style={[styles.transactionItem, getTransactionColor(item)]}>
      <Text style={styles.type}>
        {getTransactionLabel(item)} -{" "}
        {item.isMobileMoney ? "Mobile Money" : "General"}
      </Text>
      <Text>Item: {item.itemName}</Text>
      <Text>Quantity: {item.quantity}</Text>
      <Text>Amount: {item.amount}</Text>
      {item.commissionEarned !== undefined && (
        <Text>Commission: {item.commissionEarned}</Text>
      )}
      <Text style={styles.date}>
        {new Date(item.timestamp).toLocaleString()}
      </Text>
    </View>
  );

  if (loadingAgentStatus) {
    // Optional: show loading text while fetching agent status
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.header}>Loading...</Text>
      </SafeAreaView>
    );
  }

  const filteredTransactions = transactions.filter(
    (t) => t.isMobileMoney === isMobileMoneyAgent
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Transaction History</Text>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.noTransactions}>No transactions to show.</Text>
        }
        contentContainerStyle={styles.flatListContent}
      />

      <View style={styles.clearButtonContainer}>
        <Button title="Clear All History" onPress={handleClearHistory} />
      </View>
    </SafeAreaView>
  );
};

export default TransactionHistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fdfdfd",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },
  flatListContent: {
    paddingBottom: 200, // Increase scroll space above bottom bar
  },
  transactionItem: {
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
  },
  incoming: {
    backgroundColor: "#e0f7e9",
    borderLeftWidth: 4,
    borderLeftColor: "#2e7d32",
  },
  outgoing: {
    backgroundColor: "#ffe0e0",
    borderLeftWidth: 4,
    borderLeftColor: "#c62828",
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
    textAlign: "center",
    fontStyle: "italic",
    color: "#666",
    marginTop: 40,
  },
  clearButtonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fdfdfd",
    marginBottom: Platform.OS === "ios" ? 64 : 56, // Raised higher from the bottom
  },
});
