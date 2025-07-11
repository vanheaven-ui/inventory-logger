import AsyncStorage from "@react-native-async-storage/async-storage";

// --- Keys for AsyncStorage ---
const TRANSACTIONS_KEY = "app_transactions";
const GENERAL_INVENTORY_KEY = "app_general_inventory"; // Dedicated key for general shop items
const MOBILE_MONEY_FLOAT_KEY = "app_mobile_money_float"; // Dedicated key for mobile money float
const LAST_SUMMARY_RESET_TIMESTAMP_KEY = "app_last_summary_reset_timestamp";
const DAILY_SUMMARY_DATA_KEY = "app_daily_summary_data";
const PHYSICAL_CASH_KEY = "app_physical_cash"; // Dedicated key for total physical cash
const COMMISSION_EARNINGS_KEY = "app_commission_earnings"; // Dedicated key for total accumulated commission earnings

// --- UPDATED: Realistic Minimum Physical Cash Required (based on MTN's stated minimum for agents) ---
const MIN_PHYSICAL_CASH_REQUIRED = 100000; // UGX 100,000 minimum physical cash to operate MM business, as per MTN agent agreements.

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
    return jsonValue != null && jsonValue !== "" ? JSON.parse(jsonValue) : null;
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
 * Includes validation for sufficient stock/cash/float.
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
    );

    let commissionEarnedForTransaction = 0;

    // Fetch current balances for validation BEFORE potential updates
    let currentPhysicalCash = await getPhysicalCash();
    const currentFloatEntries = await getFloatEntries(); // Get all float entries
    const currentGeneralInventory = await getGeneralInventoryItems(); // Get all general inventory items

    // --- Mobile Money Specific Logic & Validation ---
    if (newTransaction.isMobileMoney) {
      const existingFloatIndex = currentFloatEntries.findIndex(
        (item) =>
          item &&
          item.itemName &&
          newTransaction.itemName &&
          item.itemName.toLowerCase() === newTransaction.itemName.toLowerCase()
      );

      // Prevent transaction if the mobile money network is not configured
      if (existingFloatIndex === -1) {
        throw new Error(
          `Mobile money network '${newTransaction.itemName}' not configured. Please add it via Manage Float.`
        );
      }

      // Create a mutable copy of the float list for updates
      const updatedFloatList = [...currentFloatEntries];
      const floatToUpdate = updatedFloatList[existingFloatIndex]; // Reference the object within the mutable list

      if (newTransaction.type === "restock") {
        // Mobile Money Deposit (Agent gives float, receives cash)
        // Commission calculation for deposit
        const commission = calculateCommission(
          newTransaction.itemName,
          newTransaction.quantity,
          "deposit"
        );
        newTransaction.commissionEarned = commission;
        commissionEarnedForTransaction = commission;

        // --- VALIDATION: Insufficient Float for Deposit ---
        if (floatToUpdate.currentStock < Number(newTransaction.quantity)) {
          throw new Error(
            `Insufficient float (${floatToUpdate.itemName}) for this deposit. Available: ${floatToUpdate.currentStock}, Required: ${newTransaction.quantity}.`
          );
        }
        // --- END VALIDATION ---

        // Update float (agent gives out float)
        floatToUpdate.currentStock -= Number(newTransaction.quantity);
        console.log(
          `Mobile Money Deposit: Float for ${floatToUpdate.itemName} decreased by ${newTransaction.quantity}. New float: ${floatToUpdate.currentStock}`
        );

        // Update physical cash (as per latest instruction: deposit decrements cash)
        currentPhysicalCash -= Number(newTransaction.quantity);
        if (commissionEarnedForTransaction) {
          currentPhysicalCash += Number(commissionEarnedForTransaction); // Add commission to cash
        }
        console.log(
          `Physical Cash after MM Deposit (User's Rule): Paid out ${
            newTransaction.quantity
          }, earned commission ${
            commissionEarnedForTransaction || 0
          }. New cash: ${currentPhysicalCash}`
        );
      } else if (newTransaction.type === "sell") {
        // Mobile Money Withdrawal (Agent receives float, hands out cash)
        // Commission calculation for withdrawal
        const commission = calculateCommission(
          newTransaction.itemName,
          newTransaction.quantity,
          "withdrawal"
        );
        newTransaction.commissionEarned = commission;
        commissionEarnedForTransaction = commission;

        // --- VALIDATION: Insufficient Physical Cash for Withdrawal ---
        if (currentPhysicalCash < Number(newTransaction.quantity)) {
          throw new Error(
            `Insufficient physical cash for this withdrawal. Available: ${currentPhysicalCash}, Required: ${newTransaction.quantity}.`
          );
        }
        // --- NEW VALIDATION: Minimum Physical Cash Enforcement ---
        // Calculate projected cash *after* this withdrawal and commission
        // Assuming withdrawal INCREMENTS cash and commission INCREMENTS cash (as per your last direct instruction)
        const projectedPhysicalCashAfterWithdrawal =
          currentPhysicalCash +
          Number(newTransaction.quantity) +
          Number(commissionEarnedForTransaction || 0);
        if (projectedPhysicalCashAfterWithdrawal < MIN_PHYSICAL_CASH_REQUIRED) {
          throw new Error(
            `Transaction would result in physical cash (${projectedPhysicalCashAfterWithdrawal} UGX) below the minimum required (${MIN_PHYSICAL_CASH_REQUIRED} UGX) to operate.`
          );
        }
        // --- END NEW VALIDATION ---

        // Update float (agent receives float)
        floatToUpdate.currentStock += Number(newTransaction.quantity);
        console.log(
          `Mobile Money Withdrawal: Float for ${floatToUpdate.itemName} increased by ${newTransaction.quantity}. New float: ${floatToUpdate.currentStock}`
        );

        // Update physical cash (as per latest instruction: withdrawal increments cash)
        currentPhysicalCash += Number(newTransaction.quantity);
        if (commissionEarnedForTransaction) {
          currentPhysicalCash += Number(commissionEarnedForTransaction); // Add commission to cash
        }
        console.log(
          `Physical Cash after MM Withdrawal (User's Rule): Received ${
            newTransaction.quantity
          }, earned commission ${
            commissionEarnedForTransaction || 0
          }. New cash: ${currentPhysicalCash}`
        );
      }

      floatToUpdate.lastUpdated = Date.now();
      await saveData(MOBILE_MONEY_FLOAT_KEY, updatedFloatList); // Save the entire updated list
      console.log("Mobile Money Float updated and saved.");

      // Update total commission earnings (this logic remains the same)
      if (commissionEarnedForTransaction > 0) {
        let totalCommissionEarnings = await getCommissionEarnings();
        totalCommissionEarnings += commissionEarnedForTransaction;
        await saveCommissionEarnings(totalCommissionEarnings);
        console.log(
          "Total Commission Earnings updated:",
          totalCommissionEarnings
        );
      }
    } else {
      // --- General Shop Inventory Logic & Validation ---
      const existingItemIndex = currentGeneralInventory.findIndex(
        (item) =>
          item &&
          item.itemName &&
          newTransaction.itemName &&
          item.itemName.toLowerCase() === newTransaction.itemName.toLowerCase()
      );

      // If item not found in inventory, warn but proceed to add new item
      if (existingItemIndex === -1) {
        console.warn(
          `Transaction for unknown general inventory item "${newTransaction.itemName}" recorded. Adding as a new item.`
        );
        const newItem = {
          itemName: newTransaction.itemName,
          currentStock: Number(newTransaction.quantity), // Initial stock from this transaction
          costPricePerUnit: Number(newTransaction.costPrice || 0),
          sellingPricePerUnit: Number(newTransaction.sellingPrice || 0),
          createdAt: Date.now(),
          lastUpdated: Date.now(),
        };
        await saveData(GENERAL_INVENTORY_KEY, [
          ...currentGeneralInventory,
          newItem,
        ]);
        console.log("New General Inventory item created:", newItem);
        // Note: For newly created items from a 'sell' transaction, stock might become negative
        // immediately if quantity > 0. This might require further business logic depending on
        // whether negative stock is allowed for new items on sale. For now, it proceeds.
      } else {
        const updatedInventory = [...currentGeneralInventory]; // Create mutable copy
        const itemToUpdate = updatedInventory[existingItemIndex]; // Reference object in mutable copy

        if (newTransaction.type === "sell") {
          // --- VALIDATION: Insufficient Stock for Sale ---
          if (itemToUpdate.currentStock < Number(newTransaction.quantity)) {
            throw new Error(
              `Insufficient stock (${itemToUpdate.itemName}) for this sale. Available: ${itemToUpdate.currentStock}, Required: ${newTransaction.quantity}.`
            );
          }
          // --- END VALIDATION ---
          itemToUpdate.currentStock -= newTransaction.quantity;
          currentPhysicalCash += Number(newTransaction.amount); // General item sale increases cash
        } else if (newTransaction.type === "restock") {
          itemToUpdate.currentStock += newTransaction.quantity;
          currentPhysicalCash -= Number(newTransaction.amount); // General item restock decreases cash (money paid out)
        }
        itemToUpdate.lastUpdated = Date.now();
        await saveData(GENERAL_INVENTORY_KEY, updatedInventory); // Save updated list
        console.log("General Inventory item updated and saved.");
      }
    }

    // Save the transaction record itself (moved here after all inventory/float updates and validations)
    transactions.push(newTransaction);
    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    console.log("Transaction saved to TRANSACTIONS_KEY:", newTransaction);

    // Save the final physical cash balance after all calculations
    await savePhysicalCash(currentPhysicalCash);
    console.log(
      "Physical cash updated after transaction:",
      currentPhysicalCash
    );

    return true; // Indicate success
  } catch (error) {
    console.error("Error saving transaction:", error);
    // Re-throw the error so UI can catch it and display a message to the user
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

// --- GENERAL SHOP INVENTORY MANAGEMENT FUNCTIONS ---

export const getGeneralInventoryItems = async () => {
  const items = (await getData(GENERAL_INVENTORY_KEY)) || [];
  return items
    .filter(
      (item) =>
        item && typeof item.itemName === "string" && item.itemName.trim() !== ""
    )
    .map((item) => ({
      ...item,
      currentStock: Number(item.currentStock) || 0,
      costPricePerUnit: Number(item.costPricePerUnit) || 0,
      sellingPricePerUnit: Number(item.sellingPricePerUnit) || 0,
    }));
};

export const saveGeneralInventoryItem = async (itemToSave) => {
  try {
    if (
      !itemToSave ||
      typeof itemToSave.itemName !== "string" ||
      itemToSave.itemName.trim() === ""
    ) {
      throw new Error("Item name is required and must be a valid string.");
    }

    let currentInventory = await getGeneralInventoryItems();

    let updatedInventory;
    const existingItemIndex = currentInventory.findIndex(
      (item) =>
        (item.itemName &&
          item.itemName.toLowerCase() === itemToSave.itemName.toLowerCase()) ||
        (itemToSave.originalItemName &&
          item.itemName &&
          item.itemName.toLowerCase() ===
            itemToSave.originalItemName.toLowerCase())
    );

    if (existingItemIndex !== -1) {
      updatedInventory = currentInventory.map((item, index) =>
        index === existingItemIndex
          ? {
              ...item,
              itemName: itemToSave.itemName,
              currentStock: Number(itemToSave.currentStock) || 0,
              costPricePerUnit:
                Number(item.costPricePerUnit) ||
                Number(itemToSave.costPricePerUnit) ||
                0,
              sellingPricePerUnit:
                Number(item.sellingPricePerUnit) ||
                Number(itemToSave.sellingPricePerUnit) ||
                0,
              lastUpdated: Date.now(),
            }
          : item
      );
      console.log(
        "Updating existing general inventory item:",
        itemToSave.itemName
      );
    } else {
      const newItem = {
        id: Date.now().toString(),
        itemName: itemToSave.itemName,
        currentStock: Number(itemToSave.currentStock) || 0,
        costPricePerUnit: Number(itemToSave.costPricePerUnit) || 0,
        sellingPricePerUnit: Number(itemToSave.sellingPricePerUnit) || 0,
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
    throw error;
  }
};

// EXPORT saveInventoryItem for ManageItemScreen (alias)
export const saveInventoryItem = saveGeneralInventoryItem;

export const updateGeneralInventoryItem = async (updatedItem) => {
  try {
    if (
      !updatedItem ||
      typeof updatedItem.itemName !== "string" ||
      updatedItem.itemName.trim() === ""
    ) {
      throw new Error("Item name is required for update.");
    }

    const currentInventory = await getGeneralInventoryItems();
    const itemIndex = currentInventory.findIndex(
      (item) =>
        item.itemName &&
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
      currentStock: Number(updatedItem.currentStock) || 0,
      costPricePerUnit: Number(updatedItem.costPricePerUnit) || 0,
      sellingPricePerUnit: Number(updatedItem.sellingPricePerUnit) || 0,
      lastUpdated: Date.now(),
    };
    await saveData(GENERAL_INVENTORY_KEY, newInventory);
    console.log(`General inventory item '${updatedItem.itemName}' updated.`);
    return true;
  } catch (error) {
    console.error("Error updating general inventory item:", error);
    throw error;
  }
};

export const deleteGeneralInventoryItem = async (itemName) => {
  try {
    if (typeof itemName !== "string" || itemName.trim() === "") {
      throw new Error("Item name is required for deletion.");
    }
    const currentInventory = await getGeneralInventoryItems();
    const filteredInventory = currentInventory.filter(
      (item) =>
        item.itemName && item.itemName.toLowerCase() !== itemName.toLowerCase()
    );
    await saveData(GENERAL_INVENTORY_KEY, filteredInventory);
    console.log(`General inventory item '${itemName}' deleted.`);
    return true;
  } catch (error) {
    console.error("Error deleting general inventory item:", error);
    throw error;
  }
};

export const clearGeneralInventory = async () => {
  return await saveData(GENERAL_INVENTORY_KEY, []);
};

// --- MOBILE MONEY FLOAT MANAGEMENT FUNCTIONS ---

export const getFloatEntries = async () => {
  const entries = (await getData(MOBILE_MONEY_FLOAT_KEY)) || [];
  return entries
    .filter(
      (entry) =>
        entry &&
        typeof entry.itemName === "string" &&
        entry.itemName.trim() !== ""
    )
    .map((entry) => ({
      ...entry,
      currentStock: Number(entry.currentStock) || 0,
      costPricePerUnit: Number(entry.costPricePerUnit) || 0,
      sellingPricePerUnit: Number(entry.sellingPricePerUnit) || 0,
    }));
};

export const saveFloatEntry = async (newFloat) => {
  try {
    if (
      !newFloat ||
      typeof newFloat.itemName !== "string" ||
      newFloat.itemName.trim() === ""
    ) {
      throw new Error(
        "Float item name is required and must be a valid string."
      );
    }

    const currentFloat = await getFloatEntries();
    const existingFloatIndex = currentFloat.findIndex(
      (entry) =>
        entry.itemName &&
        entry.itemName.toLowerCase() === newFloat.itemName.toLowerCase()
    );

    if (existingFloatIndex !== -1) {
      const updatedFloat = [...currentFloat];
      updatedFloat[existingFloatIndex] = {
        ...updatedFloat[existingFloatIndex],
        ...newFloat,
        currentStock: Number(newFloat.currentStock) || 0,
        costPricePerUnit: Number(newFloat.costPricePerUnit) || 0,
        sellingPricePerUnit: Number(newFloat.sellingPricePerUnit) || 0,
        lastUpdated: Date.now(),
      };
      await saveData(MOBILE_MONEY_FLOAT_KEY, updatedFloat);
      console.log(`Float entry '${newFloat.itemName}' updated.`);
      return true;
    } else {
      const floatToSave = [
        ...currentFloat,
        {
          ...newFloat,
          id: Date.now().toString(),
          currentStock: Number(newFloat.currentStock) || 0,
          costPricePerUnit: Number(newFloat.costPricePerUnit) || 0,
          sellingPricePerUnit: Number(newFloat.sellingPricePerUnit) || 0,
          lastUpdated: Date.now(),
        },
      ];
      await saveData(MOBILE_MONEY_FLOAT_KEY, floatToSave);
      console.log(`Float entry '${newFloat.itemName}' added.`);
      return true;
    }
  } catch (error) {
    console.error("Error saving float entry:", error);
    throw error;
  }
};

export const updateFloatEntry = async (updatedFloat) => {
  try {
    if (
      !updatedFloat ||
      typeof updatedFloat.itemName !== "string" ||
      updatedFloat.itemName.trim() === ""
    ) {
      throw new Error("Float item name is required for update.");
    }

    const currentFloat = await getFloatEntries();
    const floatIndex = currentFloat.findIndex(
      (entry) =>
        entry.itemName &&
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
      currentStock: Number(updatedFloat.currentStock) || 0,
      costPricePerUnit: Number(updatedFloat.costPricePerUnit) || 0,
      sellingPricePerUnit: Number(updatedFloat.sellingPricePerUnit) || 0,
      lastUpdated: Date.now(),
    };
    await saveData(MOBILE_MONEY_FLOAT_KEY, newFloat);
    console.log(`Float entry '${updatedFloat.itemName}' updated.`);
    return true;
  } catch (error) {
    console.error("Error updating float entry:", error);
    throw error;
  }
};

export const deleteFloatEntry = async (itemName) => {
  try {
    if (typeof itemName !== "string" || itemName.trim() === "") {
      throw new Error("Float item name is required for deletion.");
    }
    const currentFloat = await getFloatEntries();
    const filteredFloat = currentFloat.filter(
      (entry) =>
        entry.itemName &&
        entry.itemName.toLowerCase() !== itemName.toLowerCase()
    );
    await saveData(MOBILE_MONEY_FLOAT_KEY, filteredFloat);
    console.log(`Float entry '${itemName}' deleted.`);
    return true;
  } catch (error) {
    console.error("Error deleting float entry:", error);
    throw error;
  }
};

export const clearFloatEntries = async () => {
  return await saveData(MOBILE_MONEY_FLOAT_KEY, []);
};

// --- Dedicated Physical Cash Functions ---

export const getPhysicalCash = async () => {
  try {
    const value = await AsyncStorage.getItem(PHYSICAL_CASH_KEY);
    return value != null ? parseFloat(value) : 0;
  } catch (e) {
    console.error("Failed to fetch physical cash:", e);
    return 0;
  }
};

export const savePhysicalCash = async (amount) => {
  try {
    const stringValue = String(Number(amount));
    await AsyncStorage.setItem(PHYSICAL_CASH_KEY, stringValue);
    return true;
  } catch (e) {
    console.error("Failed to save physical cash:", e);
    throw e;
  }
};

export const clearPhysicalCash = async () => {
  return await savePhysicalCash(0);
};

// --- Dedicated Commission Earnings Functions ---

/**
 * Retrieves the total accumulated commission earnings.
 * @returns {Promise<number>} The total commission earned.
 */
export const getCommissionEarnings = async () => {
  try {
    const value = await AsyncStorage.getItem(COMMISSION_EARNINGS_KEY);
    return value != null ? parseFloat(value) : 0;
  } catch (e) {
    console.error("Failed to fetch commission earnings:", e);
    return 0;
  }
};

/**
 * Saves the total accumulated commission earnings.
 * @param {number} amount - The total commission amount to save.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
export const saveCommissionEarnings = async (amount) => {
  try {
    const stringValue = String(Number(amount));
    await AsyncStorage.setItem(COMMISSION_EARNINGS_KEY, stringValue);
    return true;
  } catch (e) {
    console.error("Failed to save commission earnings:", e);
    throw e;
  }
};

/**
 * Resets the total commission earnings to 0.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
export const clearCommissionEarnings = async () => {
  return await saveCommissionEarnings(0);
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
