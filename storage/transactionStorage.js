import AsyncStorage from "@react-native-async-storage/async-storage";

const TRANSACTIONS_KEY = "transactions";

/**
 * Save a new transaction (sell or restock)
 * @param {'sell' | 'restock'} type
 * @param {{ itemName: string, quantity: number }} data
 */
export async function saveTransaction(type, data = {}) {
  try {
    const newTransaction = {
      id: Date.now().toString(),
      type,
      itemName: data.itemName,
      quantity: data.quantity,
      timestamp: new Date().toISOString(),
    };

    const existingData = await AsyncStorage.getItem(TRANSACTIONS_KEY);
    const transactions = existingData ? JSON.parse(existingData) : [];

    transactions.push(newTransaction);
    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error("Error saving transaction:", error);
  }
}

/**
 * Get all transactions
 * @returns {Promise<Array>}
 */
export async function getTransactions() {
  try {
    const data = await AsyncStorage.getItem(TRANSACTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting transactions:", error);
    return [];
  }
}

/**
 * Clear all transactions (for dev/reset)
 */
export async function clearTransactions() {
  try {
    await AsyncStorage.removeItem(TRANSACTIONS_KEY);
  } catch (error) {
    console.error("Error clearing transactions:", error);
  }
}
