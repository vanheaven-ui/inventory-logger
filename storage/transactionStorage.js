import AsyncStorage from "@react-native-async-storage/async-storage";

// --- Keys for AsyncStorage ---
const TRANSACTIONS_KEY = "app_transactions";
const GENERAL_INVENTORY_KEY = "app_general_inventory"; // Dedicated key for general shop items
const MOBILE_MONEY_FLOAT_KEY = "app_mobile_money_float"; // Dedicated key for mobile money float
const LAST_SUMMARY_RESET_TIMESTAMP_KEY = "app_last_summary_reset_timestamp";
const DAILY_SUMMARY_DATA_KEY = "app_daily_summary_data";
const PHYSICAL_CASH_KEY = "app_physical_cash"; // NEW: Dedicated key for total physical cash

// MOCK UGANDAN MOBILE MONEY COMMISSION TIERS
// IMPORTANT: These are example values. Replace with actual, up-to-date rates for MTN/Airtel Uganda.
const UGANDA_COMMISSION_TIERS = {
  MTN: [
    // Example MTN (replace with actual)
    {
      minAmount: 0,
      maxAmount: 500,
      withdrawalCommission: 100,
      depositCommission: 50,
    },
    {
      minAmount: 501,
      maxAmount: 2500,
      withdrawalCommission: 200,
      depositCommission: 100,
    },
    {
      minAmount: 2501,
      maxAmount: 5000,
      withdrawalCommission: 300,
      depositCommission: 150,
    },
    {
      minAmount: 5001,
      maxAmount: 10000,
      withdrawalCommission: 500,
      depositCommission: 200,
    },
    {
      minAmount: 10001,
      maxAmount: 20000,
      withdrawalCommission: 700,
      depositCommission: 250,
    },
    {
      minAmount: 20001,
      maxAmount: 30000,
      withdrawalCommission: 900,
      depositCommission: 300,
    },
    {
      minAmount: 30001,
      maxAmount: 40000,
      withdrawalCommission: 1100,
      depositCommission: 350,
    },
    {
      minAmount: 40001,
      maxAmount: 50000,
      withdrawalCommission: 1300,
      depositCommission: 400,
    },
    {
      minAmount: 50001,
      maxAmount: 100000,
      withdrawalCommission: 1500,
      depositCommission: 500,
    },
    {
      minAmount: 100001,
      maxAmount: 200000,
      withdrawalCommission: 2000,
      depositCommission: 700,
    },
    {
      minAmount: 200001,
      maxAmount: 500000,
      withdrawalCommission: 2500,
      depositCommission: 900,
    },
    {
      minAmount: 500001,
      maxAmount: 1000000,
      withdrawalCommission: 3000,
      depositCommission: 1200,
    },
    {
      minAmount: 1000001,
      maxAmount: Infinity,
      withdrawalCommission: 3500,
      depositCommission: 1500,
    }, // Max tier
  ],
  Airtel: [
    // Example Airtel (replace with actual)
    {
      minAmount: 0,
      maxAmount: 500,
      withdrawalCommission: 90,
      depositCommission: 45,
    },
    {
      minAmount: 501,
      maxAmount: 2500,
      withdrawalCommission: 180,
      depositCommission: 90,
    },
    {
      minAmount: 2501,
      maxAmount: 5000,
      withdrawalCommission: 270,
      depositCommission: 135,
    },
    {
      minAmount: 5001,
      maxAmount: 10000,
      withdrawalCommission: 450,
      depositCommission: 180,
    },
    {
      minAmount: 10001,
      maxAmount: 20000,
      withdrawalCommission: 630,
      depositCommission: 225,
    },
    {
      minAmount: 20001,
      maxAmount: 30000,
      withdrawalCommission: 810,
      depositCommission: 270,
    },
    {
      minAmount: 30001,
      maxAmount: 40000,
      withdrawalCommission: 990,
      depositCommission: 315,
    },
    {
      minAmount: 40001,
      maxAmount: 50000,
      withdrawalCommission: 1170,
      depositCommission: 360,
    },
    {
      minAmount: 50001,
      maxAmount: 100000,
      withdrawalCommission: 1350,
      depositCommission: 450,
    },
    {
      minAmount: 100001,
      maxAmount: 200000,
      withdrawalCommission: 1800,
      depositCommission: 630,
    },
    {
      minAmount: 200001,
      maxAmount: 500000,
      withdrawalCommission: 2250,
      depositCommission: 810,
    },
    {
      minAmount: 500001,
      maxAmount: 1000000,
      withdrawalCommission: 2700,
      depositCommission: 1080,
    },
    {
      minAmount: 1000001,
      maxAmount: Infinity,
      withdrawalCommission: 3150,
      depositCommission: 1350,
    },
  ],
  Africell: [
    // Define Africell tiers here (placeholder for now)
    {
      minAmount: 0,
      maxAmount: Infinity,
      withdrawalCommission: 0,
      depositCommission: 0,
    },
  ],
};

/**
 * Calculates the commission for a given network, amount, and transaction type.
 * @param {string} networkName - The name of the mobile money network (e.g., "MTN", "Airtel").
 * @param {number} amount - The transaction amount.
 * @param {'withdrawal' | 'deposit'} transactionType - The type of mobile money transaction.
 * @returns {number} The calculated commission.
 */
export const calculateCommission = (networkName, amount, transactionType) => {
  // Normalize networkName to match keys if necessary (e.g., "mtn mobile money" -> "MTN")
  const normalizedNetworkName =
    Object.keys(UGANDA_COMMISSION_TIERS).find((key) =>
      networkName.toLowerCase().includes(key.toLowerCase())
    ) || networkName.trim(); // Fallback to trimmed name if no match

  const specificTiers = UGANDA_COMMISSION_TIERS[normalizedNetworkName] || [];

  if (specificTiers.length === 0) {
    console.warn(`No commission tiers found for network: ${networkName}`);
    return 0; // No commission if network not found
  }

  for (const tier of specificTiers) {
    if (amount >= tier.minAmount && amount <= tier.maxAmount) {
      if (transactionType === "withdrawal") {
        return tier.withdrawalCommission || 0;
      } else if (transactionType === "deposit") {
        return tier.depositCommission || 0;
      }
    }
  }

  return 0; // Return 0 if no tier matches (shouldn't happen with Infinity tier)
};

// --- Helper to get data ---
const getData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error(`Error reading data from ${key}:`, e);
    return null;
  }
};

// --- Helper to save data ---
const saveData = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    return true;
  } catch (e) {
    console.error(`Error saving data to ${key}:`, e);
    return false;
  }
};

// --- Transaction Functions ---
export const getTransactions = async () => {
  return (await getData(TRANSACTIONS_KEY)) || [];
};

/**
 * Saves a transaction and updates the relevant inventory/float.
 * @param {object} transactionData - Details of the transaction (type, itemName, quantity, customer, etc.)
 */
export async function saveTransaction(transactionData) {
  try {
    let transactions = await getTransactions();
    if (!Array.isArray(transactions)) {
      transactions = [];
    }

    const newTransaction = {
      id: Date.now().toString(), // Simple unique ID
      timestamp: Date.now(),
      ...transactionData,
    };

    console.log(
      "Constructed newTransaction in saveTransaction:",
      newTransaction
    ); // Debug log

    // --- ADDITION FOR MOBILE MONEY COMMISSION ---
    if (newTransaction.isMobileMoney && newTransaction.type === "sell") {
      // Assuming itemName here refers to the network (e.g., "MTN", "Airtel")
      const commission = calculateCommission(
        newTransaction.itemName,
        newTransaction.quantity,
        "withdrawal" // Explicitly pass transaction type for calculation
      );
      newTransaction.commissionEarned = commission;
    } else if (
      newTransaction.isMobileMoney &&
      newTransaction.type === "restock"
    ) {
      const commission = calculateCommission(
        newTransaction.itemName,
        newTransaction.quantity,
        "deposit" // Explicitly pass transaction type for calculation
      );
      newTransaction.commissionEarned = commission;
    }
    // --- END ADDITION ---

    console.log("Transactions array BEFORE push:", transactions); // Debug log
    transactions.push(newTransaction);
    console.log("Transactions array AFTER push:", transactions); // Debug log

    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    console.log(
      "Stringified transactions for saving:",
      JSON.stringify(transactions)
    ); // Debug log
    console.log("Transaction saved to TRANSACTIONS_KEY:", newTransaction);

    // --- Update Inventory/Float based on business type ---
    if (newTransaction.isMobileMoney) {
      const currentFloat = await getFloatEntries();
      const existingFloatIndex = currentFloat.findIndex(
        (item) =>
          item && // ADDED: Ensure item is not null/undefined
          item.itemName && // ADDED: Ensure item.itemName exists
          newTransaction.itemName && // ADDED: Ensure newTransaction.itemName exists
          item.itemName.toLowerCase() === newTransaction.itemName.toLowerCase()
      );

      if (existingFloatIndex !== -1) {
        const updatedFloat = [...currentFloat];
        const floatToUpdate = { ...updatedFloat[existingFloatIndex] };

        if (newTransaction.type === "sell") {
          // Withdrawal
          floatToUpdate.currentStock -= newTransaction.quantity; // Subtract transaction amount from float
        } else if (newTransaction.type === "restock") {
          // Deposit
          floatToUpdate.currentStock += newTransaction.quantity; // Add transaction amount to float
        }
        floatToUpdate.lastUpdated = Date.now();
        updatedFloat[existingFloatIndex] = floatToUpdate;
        await saveData(MOBILE_MONEY_FLOAT_KEY, updatedFloat);
        console.log("Mobile Money Float updated:", floatToUpdate);
      } else {
        console.warn(
          `Transaction for unknown float network "${newTransaction.itemName}" recorded. Please ensure it's added via ManageFloat.`
        );
        const newFloatEntry = {
          itemName: newTransaction.itemName,
          currentStock:
            newTransaction.type === "sell"
              ? -newTransaction.quantity
              : newTransaction.quantity, // Initial stock change
          costPricePerUnit: 0,
          sellingPricePerUnit: 0,
          lastUpdated: Date.now(),
        };
        await saveData(MOBILE_MONEY_FLOAT_KEY, [
          ...currentFloat,
          newFloatEntry,
        ]);
        console.log("New Float Entry created:", newFloatEntry);
      }
    } else {
      // General Shop Inventory
      const currentInventory = await getGeneralInventoryItems();
      const existingItemIndex = currentInventory.findIndex(
        (item) =>
          item && // ADDED: Ensure item is not null/undefined
          item.itemName && // ADDED: Ensure item.itemName exists
          newTransaction.itemName && // ADDED: Ensure newTransaction.itemName exists
          item.itemName.toLowerCase() === newTransaction.itemName.toLowerCase()
      );

      if (existingItemIndex !== -1) {
        const updatedInventory = [...currentInventory];
        const itemToUpdate = { ...updatedInventory[existingItemIndex] };

        if (newTransaction.type === "sell") {
          itemToUpdate.currentStock -= newTransaction.quantity; // 'quantity' is amount of items sold
        } else if (newTransaction.type === "restock") {
          itemToUpdate.currentStock += newTransaction.quantity; // 'quantity' is amount of items restocked
        }
        itemToUpdate.lastUpdated = Date.now();
        updatedInventory[existingItemIndex] = itemToUpdate;
        await saveData(GENERAL_INVENTORY_KEY, updatedInventory);
        console.log("General Inventory item updated:", itemToUpdate);
      } else {
        console.warn(
          `Transaction for unknown general inventory item "${newTransaction.itemName}" recorded. Please ensure it's added via ManageItem.`
        );
        const newItem = {
          itemName: newTransaction.itemName,
          currentStock: newTransaction.quantity, // Initial stock is the quantity from this transaction
          costPricePerUnit: newTransaction.costPrice || 0, // Use costPrice from transaction, or 0
          sellingPricePerUnit: newTransaction.sellingPrice || 0, // Use sellingPrice from transaction, or 0
          createdAt: Date.now(), // Added for consistency
          lastUpdated: Date.now(),
        };
        await saveData(GENERAL_INVENTORY_KEY, [...currentInventory, newItem]);
        console.log("New General Inventory item created:", newItem);
      }
    }

    // --- NEW: Update Physical Cash based on transaction type ---
    let currentPhysicalCash = await getPhysicalCash();
    if (newTransaction.type === "sell") {
      // Selling (either general item or mobile money withdrawal)
      currentPhysicalCash += newTransaction.amount; // Cash increases by transaction amount
      // If mobile money withdrawal, also add the commission earned to physical cash
      if (newTransaction.isMobileMoney && newTransaction.commissionEarned) {
        currentPhysicalCash += newTransaction.commissionEarned;
      }
    } else if (newTransaction.type === "restock") {
      // Restocking (either general item or mobile money deposit)
      currentPhysicalCash -= newTransaction.amount; // Cash decreases by amount spent on restock
      // If mobile money deposit, also add the commission earned to physical cash
      // NOTE: For deposits, the user *receives* commission, so their physical cash increases.
      if (newTransaction.isMobileMoney && newTransaction.commissionEarned) {
        currentPhysicalCash += newTransaction.commissionEarned;
      }
    }
    // Handle cases where amount might be calculated differently (e.g., profit for general items)
    // For general item 'sell', newTransaction.amount is usually the sellingPrice * quantity
    // For general item 'restock', newTransaction.amount is usually the costPrice * quantity
    await savePhysicalCash(currentPhysicalCash);
    console.log(
      "Physical cash updated after transaction:",
      currentPhysicalCash
    );
    // --- END NEW PHYSICAL CASH UPDATE ---
  } catch (error) {
    console.error("Error saving transaction:", error);
    throw error;
  }
}

export const clearTransactions = async () => {
  return await saveData(TRANSACTIONS_KEY, []);
};

// --- Summary Functions (Existing) ---
export const setLastSummaryResetTimestamp = async (timestamp) => {
  return await saveData(LAST_SUMMARY_RESET_TIMESTAMP_KEY, timestamp);
};

export const getLastSummaryResetTimestamp = async () => {
  return (await getData(LAST_SUMMARY_RESET_TIMESTAMP_KEY)) || 0; // Default to 0 (epoch)
};

export const saveDailySummaryData = async (data) => {
  return await saveData(DAILY_SUMMARY_DATA_KEY, data);
};

export const getDailySummaryData = async () => {
  return await getData(DAILY_SUMMARY_DATA_KEY);
};

// --- GENERAL SHOP INVENTORY MANAGEMENT FUNCTIONS (Renamed/New) ---

export const getGeneralInventoryItems = async () => {
  return (await getData(GENERAL_INVENTORY_KEY)) || [];
};

export const saveGeneralInventoryItem = async (itemToSave) => {
  try {
    let currentInventory = await getGeneralInventoryItems(); // Get existing items

    let updatedInventory;
    if (
      itemToSave.itemName &&
      currentInventory.find(
        (item) =>
          item.itemName.toLowerCase() === itemToSave.itemName.toLowerCase()
      )
    ) {
      // If itemToSave has an itemName and an item with that name already exists, it's an update
      updatedInventory = currentInventory.map((item) =>
        item.itemName.toLowerCase() === itemToSave.itemName.toLowerCase()
          ? { ...item, ...itemToSave, lastUpdated: Date.now() }
          : item
      );
      console.log(
        "Updating existing general inventory item:",
        itemToSave.itemName
      );
    } else {
      // Otherwise, it's a new item
      const newItem = {
        id: Date.now().toString(), // Simple unique ID for new items
        itemName: itemToSave.itemName,
        currentStock: itemToSave.currentStock || 0, // Default to 0 if not provided
        costPricePerUnit: itemToSave.costPricePerUnit || 0,
        sellingPricePerUnit: itemToSave.sellingPricePerUnit || 0,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      };
      updatedInventory = [...currentInventory, newItem];
      console.log("Adding new general inventory item:", newItem.itemName);
    }

    await saveData(GENERAL_INVENTORY_KEY, updatedInventory);
    console.log("General inventory item saved successfully!");
    return true;
  } catch (error) {
    console.error("Error saving general inventory item:", error);
    throw error; // Re-throw the error for the calling screen to handle
  }
};

// EXPORT saveInventoryItem for ManageItemScreen
// This function now acts as an alias or a direct call to saveGeneralInventoryItem
export const saveInventoryItem = saveGeneralInventoryItem;

export const updateGeneralInventoryItem = async (updatedItem) => {
  try {
    const currentInventory = await getGeneralInventoryItems();
    const itemIndex = currentInventory.findIndex(
      (item) =>
        item.itemName.toLowerCase() === updatedItem.itemName.toLowerCase()
    );

    if (itemIndex === -1) {
      console.warn(
        `Attempted to update non-existent general inventory item: ${updatedItem.itemName}`
      );
      return false;
    }

    const newInventory = [...currentInventory];
    newInventory[itemIndex] = {
      ...newInventory[itemIndex],
      ...updatedItem,
      lastUpdated: Date.now(),
    };
    await saveData(GENERAL_INVENTORY_KEY, newInventory);
    console.log(`General inventory item '${updatedItem.itemName}' updated.`);
    return true;
  } catch (error) {
    console.error("Error updating general inventory item:", error);
    return false;
  }
};

export const deleteGeneralInventoryItem = async (itemName) => {
  try {
    const currentInventory = await getGeneralInventoryItems();
    const filteredInventory = currentInventory.filter(
      (item) => item.itemName.toLowerCase() !== itemName.toLowerCase()
    );
    await saveData(GENERAL_INVENTORY_KEY, filteredInventory);
    console.log(`General inventory item '${itemName}' deleted.`);
    return true;
  } catch (error) {
    console.error("Error deleting general inventory item:", error);
    return false;
  }
};

export const clearGeneralInventory = async () => {
  return await saveData(GENERAL_INVENTORY_KEY, []);
};

// --- MOBILE MONEY FLOAT MANAGEMENT FUNCTIONS (These were already for E-Value) ---

export const getFloatEntries = async () => {
  return (await getData(MOBILE_MONEY_FLOAT_KEY)) || [];
};

export const saveFloatEntry = async (newFloat) => {
  try {
    const currentFloat = await getFloatEntries();
    const existingFloatIndex = currentFloat.findIndex(
      (entry) =>
        entry.itemName.toLowerCase() === newFloat.itemName.toLowerCase()
    );

    if (existingFloatIndex !== -1) {
      const updatedFloat = [...currentFloat];
      updatedFloat[existingFloatIndex] = {
        ...updatedFloat[existingFloatIndex],
        ...newFloat,
        lastUpdated: Date.now(),
      };
      await saveData(MOBILE_MONEY_FLOAT_KEY, updatedFloat);
      console.log(`Float entry '${newFloat.itemName}' updated.`);
      return true;
    } else {
      const floatToSave = [
        ...currentFloat,
        { ...newFloat, id: Date.now().toString(), lastUpdated: Date.now() }, // Add ID for new entries
      ];
      await saveData(MOBILE_MONEY_FLOAT_KEY, floatToSave);
      console.log(`Float entry '${newFloat.itemName}' added.`);
      return true;
    }
  } catch (error) {
    console.error("Error saving float entry:", error);
    return false;
  }
};

export const updateFloatEntry = async (updatedFloat) => {
  try {
    const currentFloat = await getFloatEntries();
    const floatIndex = currentFloat.findIndex(
      (entry) =>
        entry.itemName.toLowerCase() === updatedFloat.itemName.toLowerCase()
    );

    if (floatIndex === -1) {
      console.warn(
        `Attempted to update non-existent float entry: ${updatedFloat.itemName}`
      );
      return false;
    }

    const newFloat = [...currentFloat];
    newFloat[floatIndex] = {
      ...newFloat[floatIndex],
      ...updatedFloat,
      lastUpdated: Date.now(),
    };
    await saveData(MOBILE_MONEY_FLOAT_KEY, newFloat);
    console.log(`Float entry '${updatedFloat.itemName}' updated.`);
    return true;
  } catch (error) {
    console.error("Error updating float entry:", error);
    return false;
  }
};

export const deleteFloatEntry = async (itemName) => {
  try {
    const currentFloat = await getFloatEntries();
    const filteredFloat = currentFloat.filter(
      (entry) => entry.itemName.toLowerCase() !== itemName.toLowerCase()
    );
    await saveData(MOBILE_MONEY_FLOAT_KEY, filteredFloat);
    console.log(`Float entry '${itemName}' deleted.`);
    return true;
  } catch (error) {
    console.error("Error deleting float entry:", error);
    return false;
  }
};

export const clearFloatEntries = async () => {
  return await saveData(MOBILE_MONEY_FLOAT_KEY, []);
};

// --- NEW: Dedicated Physical Cash Functions ---

export const getPhysicalCash = async () => {
  try {
    const value = await AsyncStorage.getItem(PHYSICAL_CASH_KEY);
    // Parse as float, default to 0 if null or invalid
    return value != null ? parseFloat(value) : 0;
  } catch (e) {
    console.error("Failed to fetch physical cash:", e);
    return 0; // Return 0 on error
  }
};

export const savePhysicalCash = async (amount) => {
  try {
    const stringValue = amount.toString();
    await AsyncStorage.setItem(PHYSICAL_CASH_KEY, stringValue);
    return true;
  } catch (e) {
    console.error("Failed to save physical cash:", e);
    throw e; // Re-throw to be handled by calling component
  }
};

export const clearPhysicalCash = async () => {
  return await savePhysicalCash(0); // Set physical cash to 0
};

// Optional: For complete data clearing (for development/testing)
export const clearAllStorage = async () => {
  try {
    await AsyncStorage.clear();
    console.log("All AsyncStorage data cleared successfully.");
  } catch (e) {
    console.error("Error clearing all storage:", e);
  }
};
