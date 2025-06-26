// storage/transactionStorage.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const TRANSACTIONS_KEY = "transactions";
const INVENTORY_KEY = "inventory";
const LAST_SUMMARY_RESET_KEY = "lastSummaryResetTimestamp"; // Key for tracking summary reset point
const DAILY_SUMMARY_DATA_KEY = "dailySummaryData"; // New key for storing computed daily summary

/**
 * Save a new transaction (sell or restock)
 * This function also updates the inventory.
 * @param {'sell' | 'restock'} type
 * @param {{ itemName: string, quantity: number, costPrice?: number, sellingPrice?: number }} data
 * @returns {Promise<boolean>} True if transaction saved and inventory updated, false otherwise.
 */
export async function saveTransaction(type, data = {}) {
  try {
    const newTransaction = {
      id: Date.now().toString(),
      type,
      itemName: data.itemName,
      quantity: data.quantity,
      timestamp: new Date().toISOString(),
      costPrice: data.costPrice !== undefined ? data.costPrice : 0,
      sellingPrice: data.sellingPrice !== undefined ? data.sellingPrice : 0,
    };

    const existingTransactionsData = await AsyncStorage.getItem(
      TRANSACTIONS_KEY
    );
    let transactions = [];
    try {
      transactions = existingTransactionsData
        ? JSON.parse(existingTransactionsData)
        : [];
    } catch (parseError) {
      console.warn(
        "Failed to parse existing transactions, resetting data:",
        parseError
      );
      await AsyncStorage.removeItem(TRANSACTIONS_KEY);
      transactions = [];
    }

    transactions.push(newTransaction);
    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));

    let inventory = await getInventory();

    const existingItemIndex = inventory.findIndex(
      (item) => item.itemName.toLowerCase() === data.itemName.toLowerCase()
    );

    if (type === "restock") {
      if (existingItemIndex > -1) {
        inventory[existingItemIndex].currentStock =
          (inventory[existingItemIndex].currentStock || 0) + data.quantity;
      } else {
        inventory.push({
          id:
            Date.now().toString() +
            "-inv-" +
            Math.random().toString(36).substring(2, 9),
          itemName: data.itemName,
          currentStock: data.quantity,
          costPricePerUnit: data.costPrice || 0,
          sellingPricePerUnit: data.sellingPrice || 0,
        });
      }
    } else if (type === "sell") {
      if (existingItemIndex > -1) {
        if (inventory[existingItemIndex].currentStock >= data.quantity) {
          inventory[existingItemIndex].currentStock -= data.quantity;
        } else {
          console.warn("Insufficient stock for sale:", data.itemName);
          return false;
        }
      } else {
        console.warn("Item not found in inventory for sale:", data.itemName);
        return false;
      }
    }

    await AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
    return true;
  } catch (error) {
    console.error("Critical error in saveTransaction:", error);
    return false;
  }
}

/**
 * Get all transactions
 * @returns {Promise<Array>}
 */
export async function getTransactions() {
  try {
    const data = await AsyncStorage.getItem(TRANSACTIONS_KEY);
    if (!data) {
      return [];
    }
    let parsedData = [];
    try {
      parsedData = JSON.parse(data);
    } catch (parseError) {
      console.error(
        "JSON Parse error in getTransactions, clearing corrupted data:",
        parseError
      );
      await AsyncStorage.removeItem(TRANSACTIONS_KEY);
      return [];
    }
    return parsedData;
  } catch (error) {
    console.error("Error getting transactions from AsyncStorage:", error);
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

/**
 * Save or update an inventory item.
 * If item has an id, it updates an existing item. Otherwise, it adds a new one.
 * @param {object} item - The inventory item to save/update
 * @param {string} item.itemName - Name of the item
 * @param {number} item.currentStock - Current stock quantity
 * @param {number} item.costPricePerUnit - Cost price per unit
 * @param {number} item.sellingPricePerUnit - Selling price per unit
 * @param {string} [item.id] - Optional ID for existing items
 */
export async function saveInventoryItem(item) {
  try {
    let inventory = await getInventory();
    if (item.id) {
      const index = inventory.findIndex((invItem) => invItem.id === item.id);
      if (index > -1) {
        inventory[index] = { ...inventory[index], ...item };
      } else {
        console.warn("Attempted to update item not found:", item.itemName);
        const newItem = {
          id:
            Date.now().toString() +
            "-inv-" +
            Math.random().toString(36).substring(2, 9),
          ...item,
        };
        delete newItem.id;
        inventory.push(newItem);
      }
    } else {
      const newItem = {
        id:
          Date.now().toString() +
          "-inv-" +
          Math.random().toString(36).substring(2, 9),
        ...item,
      };
      inventory.push(newItem);
    }
    await AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
  } catch (error) {
    console.error("Error saving inventory item:", error);
  }
}

/**
 * Get all inventory items.
 * @returns {Promise<Array>}
 */
export async function getInventory() {
  try {
    const data = await AsyncStorage.getItem(INVENTORY_KEY);
    if (!data) {
      return [];
    }
    let parsedData = [];
    try {
      parsedData = JSON.parse(data);
    } catch (parseError) {
      console.error(
        "JSON Parse error in getInventory, clearing corrupted data:",
        parseError
      );
      await AsyncStorage.removeItem(INVENTORY_KEY);
      return [];
    }
    return parsedData;
  } catch (error) {
    console.error("Error getting inventory from AsyncStorage:", error);
    return [];
  }
}

/**
 * Delete an inventory item by ID.
 * @param {string} id - The ID of the item to delete.
 */
export async function deleteInventoryItem(id) {
  try {
    let inventory = await getInventory();
    inventory = inventory.filter((item) => item.id !== id);
    await AsyncStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
  } catch (error) {
    console.error("Error deleting inventory item:", error);
  }
}

/**
 * Clear all inventory items (for dev/reset).
 */
export async function clearInventory() {
  try {
    await AsyncStorage.removeItem(INVENTORY_KEY);
  } catch (error) {
    console.error("Error clearing inventory:", error);
  }
}

/**
 * Sets the timestamp for the last summary reset.
 * @param {number} timestamp - The timestamp to save (e.g., Date.now()).
 */
export async function setLastSummaryResetTimestamp(timestamp) {
  try {
    await AsyncStorage.setItem(LAST_SUMMARY_RESET_KEY, timestamp.toString());
  } catch (error) {
    console.error("Error setting last summary reset timestamp:", error);
  }
}

/**
 * Gets the timestamp for the last summary reset.
 * @returns {Promise<number>} The timestamp, or 0 if never set.
 */
export async function getLastSummaryResetTimestamp() {
  try {
    const timestamp = await AsyncStorage.getItem(LAST_SUMMARY_RESET_KEY);
    return timestamp ? parseInt(timestamp) : 0;
  } catch (error) {
    console.error("Error getting last summary reset timestamp:", error);
    return 0;
  }
}

/**
 * Saves the computed daily summary data.
 * @param {object} summaryData - The summary object to save.
 */
export async function saveDailySummaryData(summaryData) {
  try {
    await AsyncStorage.setItem(
      DAILY_SUMMARY_DATA_KEY,
      JSON.stringify(summaryData)
    );
  } catch (error) {
    console.error("Error saving daily summary data:", error);
  }
}

/**
 * Gets the computed daily summary data.
 * @returns {Promise<object | null>} The summary object, or null if not found.
 */
export async function getDailySummaryData() {
  try {
    const data = await AsyncStorage.getItem(DAILY_SUMMARY_DATA_KEY);
    if (!data) {
      return null;
    }
    try {
      return JSON.parse(data);
    } catch (parseError) {
      console.error(
        "JSON Parse error in getDailySummaryData, clearing corrupted data:",
        parseError
      );
      await AsyncStorage.removeItem(DAILY_SUMMARY_DATA_KEY);
      return null;
    }
  } catch (error) {
    console.error("Error getting daily summary data:", error);
    return null;
  }
}
