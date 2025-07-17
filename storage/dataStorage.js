import AsyncStorage from "@react-native-async-storage/async-storage";

// --- Keys for AsyncStorage ---
const TRANSACTIONS_KEY = "app_transactions";
const GENERAL_INVENTORY_KEY = "app_general_inventory"; // Dedicated key for general shop items
const MOBILE_MONEY_FLOAT_KEY = "app_mobile_money_float"; // Dedicated key for mobile money float
const LAST_SUMMARY_RESET_TIMESTAMP_KEY = "app_last_summary_reset_timestamp";
const DAILY_SUMMARY_DATA_KEY = "app_daily_summary_data";
const PHYSICAL_CASH_KEY = "app_physical_cash"; // Dedicated key for total physical cash
const COMMISSION_EARNINGS_KEY = "app_commission_earnings"; // Dedicated key for total accumulated commission earnings

// --- Realistic Minimum Physical Cash Required (based on MTN's stated minimum for agents) ---
const MIN_PHYSICAL_CASH_REQUIRED = 100000; // UGX 100,000 minimum physical cash to operate MM business, as per MTN agent agreements.

// --- INITIAL DATA DEFINITION (Default state if no data is found in AsyncStorage) ---
// This initialData object is used by functions within dataStorage.js as fallbacks.
// Your `initialProducts` and `initialNetworks` are likely defined in a separate `initialData.js`
// file which is consumed by `initializeShopData` in your `initialization.js` file.
export const initialData = {
  [TRANSACTIONS_KEY]: [],
  [GENERAL_INVENTORY_KEY]: [], // Should be an empty array by default
  [MOBILE_MONEY_FLOAT_KEY]: [], // Should be an empty array by default
  [LAST_SUMMARY_RESET_TIMESTAMP_KEY]: 0, // Start from epoch
  [DAILY_SUMMARY_DATA_KEY]: null, // No summary data initially
  [PHYSICAL_CASH_KEY]: 0, // Agent starts with 0 cash, needs to add it
  [COMMISSION_EARNINGS_KEY]: 0, // Agent starts with 0 commission
};

/**
 * Calculates the commission for a given network, amount, and transaction type.
 * This now dynamically fetches the commission rate from the stored float entry.
 * @param {string} networkName - The name of the mobile money network (e.g., "MTN Mobile Money", "Airtel Money").
 * @param {number} amount - The transaction amount.
 * @param {'withdrawal' | 'deposit'} transactionType - The type of mobile money transaction.
 * @returns {number} The calculated commission.
 */
export const calculateCommission = async (
  networkName,
  amount,
  transactionType
) => {
  const floatEntries = await getFloatEntries(); // Fetch all float entries
  const networkEntry = floatEntries.find(
    (entry) =>
      entry &&
      entry.itemName &&
      networkName.toLowerCase().includes(entry.itemName.toLowerCase())
  );

  if (!networkEntry || !networkEntry.commissionRate) {
    console.warn(`No commission rates found for network: ${networkName}`);
    return 0; // No commission if network or its rates not found
  }

  const { commissionRate } = networkEntry;

  if (transactionType === "withdrawal") {
    return Math.round(amount * (commissionRate.withdrawal || 0));
  } else if (transactionType === "deposit") {
    return Math.round(amount * (commissionRate.deposit || 0));
  }

  return 0; // Return 0 if transaction type is not recognized
};

// --- Helper to get data ---
const getData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null && jsonValue !== "" ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error(`dataStorage: Error reading data from ${key}:`, e);
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
    console.error(`dataStorage: Error saving data to ${key}:`, e);
    return false;
  }
};

// --- INITIALIZATION FUNCTION (Internal to dataStorage for default values) ---
/**
 * Initializes app data in AsyncStorage if it doesn't already exist.
 * This is primarily for ensuring default values from `initialData` are set
 * if a specific key is accessed and found empty.
 * The main app-wide prepopulation is handled by `initializeShopData` in `initialization.js`.
 */
export const initializeAppData = async () => {
  console.log("dataStorage: Checking if app data needs initialization (internal).");
  const keysToInitialize = Object.keys(initialData);

  for (const key of keysToInitialize) {
    const existingData = await getData(key);
    // Initialize if data doesn't exist OR if it's an empty array but initialData has items (for lists)
    if (
      existingData === null ||
      (Array.isArray(existingData) &&
        existingData.length === 0 &&
        initialData[key].length > 0)
    ) {
      console.log(`dataStorage: Initializing data for key: ${key}`);
      await saveData(key, initialData[key]);
    } else {
      console.log(
        `dataStorage: Data for key: ${key} already exists. Skipping initialization.`
      );
    }
  }
  console.log("dataStorage: App data initialization (internal) complete.");
};

// --- Transaction Functions ---
export const getTransactions = async () => {
  return (await getData(TRANSACTIONS_KEY)) || initialData[TRANSACTIONS_KEY];
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
      transactions = []; // Ensure it's an array if initialData was somehow corrupted
    }

    const newTransaction = {
      id: Date.now().toString(), // Simple unique ID
      timestamp: Date.now(),
      ...transactionData,
    };

    console.log(
      "dataStorage: Constructed newTransaction in saveTransaction:",
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

      if (newTransaction.type === "deposit") {
        // Mobile Money Deposit (Agent gives physical cash, receives float)
        const commission = await calculateCommission(
          newTransaction.itemName,
          newTransaction.quantity,
          "deposit"
        );
        newTransaction.commissionEarned = commission;
        commissionEarnedForTransaction = commission;

        const costOfDeposit =
          Number(newTransaction.quantity) -
          Number(commissionEarnedForTransaction);

        if (currentPhysicalCash < costOfDeposit) {
          throw new Error(
            `Insufficient physical cash for this deposit. Available: ${currentPhysicalCash}, Required: ${costOfDeposit} (Net cash paid out).`
          );
        }

        const projectedPhysicalCashAfterDeposit =
          currentPhysicalCash - costOfDeposit;
        if (projectedPhysicalCashAfterDeposit < MIN_PHYSICAL_CASH_REQUIRED) {
          throw new Error(
            `Transaction would result in physical cash (${projectedPhysicalCashAfterDeposit} UGX) below the minimum required (${MIN_PHYSICAL_CASH_REQUIRED} UGX) to operate.`
          );
        }

        floatToUpdate.currentStock += Number(newTransaction.quantity);
        currentPhysicalCash -= Number(newTransaction.quantity);
        if (commissionEarnedForTransaction) {
          currentPhysicalCash += Number(commissionEarnedForTransaction);
        }
        console.log(
          `dataStorage: Mobile Money Deposit: Float for ${floatToUpdate.itemName} increased by ${newTransaction.quantity}. New float: ${floatToUpdate.currentStock}`
        );
        console.log(
          `dataStorage: Physical Cash after MM Deposit: Paid out ${
            newTransaction.quantity
          }, earned commission ${
            commissionEarnedForTransaction || 0
          }. New cash: ${currentPhysicalCash}`
        );
      } else if (newTransaction.type === "withdrawal") {
        // Mobile Money Withdrawal (Agent receives float, hands out physical cash)
        const commission = await calculateCommission(
          newTransaction.itemName,
          newTransaction.quantity,
          "withdrawal"
        );
        newTransaction.commissionEarned = commission;
        commissionEarnedForTransaction = commission;

        if (floatToUpdate.currentStock < Number(newTransaction.quantity)) {
          throw new Error(
            `Insufficient float (${floatToUpdate.itemName}) for this withdrawal. Available: ${floatToUpdate.currentStock}, Required: ${newTransaction.quantity}.`
          );
        }

        const projectedPhysicalCashAfterWithdrawal =
          currentPhysicalCash +
          Number(newTransaction.quantity) +
          Number(commissionEarnedForTransaction || 0);

        if (projectedPhysicalCashAfterWithdrawal < MIN_PHYSICAL_CASH_REQUIRED) {
          throw new Error(
            `Transaction would result in physical cash (${projectedPhysicalCashAfterWithdrawal} UGX) below the minimum required (${MIN_PHYSICAL_CASH_REQUIRED} UGX) to operate.`
          );
        }

        floatToUpdate.currentStock -= Number(newTransaction.quantity);
        currentPhysicalCash += Number(newTransaction.quantity);
        if (commissionEarnedForTransaction) {
          currentPhysicalCash += Number(commissionEarnedForTransaction);
        }
        console.log(
          `dataStorage: Mobile Money Withdrawal: Float for ${floatToUpdate.itemName} decreased by ${newTransaction.quantity}. New float: ${floatToUpdate.currentStock}`
        );
        console.log(
          `dataStorage: Physical Cash after MM Withdrawal: Received ${
            newTransaction.quantity
          }, earned commission ${
            commissionEarnedForTransaction || 0
          }. New cash: ${currentPhysicalCash}`
        );
      }

      floatToUpdate.lastUpdated = Date.now();
      await saveData(MOBILE_MONEY_FLOAT_KEY, updatedFloatList); // Save the entire updated list
      console.log("dataStorage: Mobile Money Float updated and saved.");

      if (commissionEarnedForTransaction > 0) {
        let totalCommissionEarnings = await getCommissionEarnings();
        totalCommissionEarnings += commissionEarnedForTransaction;
        await saveCommissionEarnings(totalCommissionEarnings);
        console.log(
          "dataStorage: Total Commission Earnings updated:",
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
          `dataStorage: Transaction for unknown general inventory item "${newTransaction.itemName}" recorded. Adding as a new item.`
        );
        const newItem = {
          id: newTransaction.id, // Use ID from transaction or generate new
          itemName: newTransaction.itemName,
          currentStock: Number(newTransaction.quantity), // Initial stock from this transaction
          costPricePerUnit: Number(newTransaction.costPrice || 0),
          sellingPricePerUnit: Number(newTransaction.sellingPrice || 0),
          unit: newTransaction.unit || "units",
          category: newTransaction.category || "Miscellaneous",
          description: newTransaction.description || "",
          voiceKeywords: newTransaction.voiceKeywords || [],
          createdAt: Date.now(),
          lastUpdated: Date.now(),
        };
        await saveGeneralInventoryItem(newItem); // Use saveGeneralInventoryItem to handle the array update logic
        console.log(
          "dataStorage: New General Inventory item created via transaction:",
          newItem
        );
      } else {
        const updatedInventory = [...currentGeneralInventory];
        const itemToUpdate = updatedInventory[existingItemIndex];

        if (newTransaction.type === "sell") {
          if (itemToUpdate.currentStock < Number(newTransaction.quantity)) {
            throw new Error(
              `Insufficient stock (${itemToUpdate.itemName}) for this sale. Available: ${itemToUpdate.currentStock}, Required: ${newTransaction.quantity}.`
            );
          }
          itemToUpdate.currentStock -= newTransaction.quantity;
          currentPhysicalCash += Number(newTransaction.amount);
        } else if (newTransaction.type === "restock") {
          itemToUpdate.currentStock += newTransaction.quantity;
          currentPhysicalCash -= Number(newTransaction.amount);
        }
        itemToUpdate.lastUpdated = Date.now();
        await saveData(GENERAL_INVENTORY_KEY, updatedInventory); // Save updated list
        console.log(
          "dataStorage: General Inventory item updated and saved (via transaction)."
        );
      }
    }

    // Save the transaction record itself (moved here after all inventory/float updates and validations)
    transactions.push(newTransaction);
    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    console.log(
      "dataStorage: Transaction saved to TRANSACTIONS_KEY:",
      newTransaction
    );

    // Save the final physical cash balance after all calculations
    await savePhysicalCash(currentPhysicalCash);
    console.log(
      "dataStorage: Physical cash updated after transaction:",
      currentPhysicalCash
    );

    return true; // Indicate success
  } catch (error) {
    console.error("dataStorage: Error saving transaction:", error);
    throw error;
  }
}

// Function for overwritting transactions in storage
export async function overwriteTransactions(newTransactionList) {
  try {
    await AsyncStorage.setItem(
      TRANSACTIONS_KEY,
      JSON.stringify(newTransactionList)
    );
    console.log("dataStorage: Transactions successfully overwritten.");
  } catch (error) {
    console.error("dataStorage: Failed to overwrite transactions:", error);
    throw error;
  }
}

export const clearTransactions = async () => {
  return await saveData(TRANSACTIONS_KEY, initialData[TRANSACTIONS_KEY]);
};

// --- Summary Functions (Existing) ---
export const setLastSummaryResetTimestamp = async (timestamp) => {
  return await saveData(LAST_SUMMARY_RESET_TIMESTAMP_KEY, timestamp);
};

export const getLastSummaryResetTimestamp = async () => {
  return (
    (await getData(LAST_SUMMARY_RESET_TIMESTAMP_KEY)) ||
    initialData[LAST_SUMMARY_RESET_TIMESTAMP_KEY]
  );
};

export const saveDailySummaryData = async (data) => {
  return await saveData(DAILY_SUMMARY_DATA_KEY, data);
};

export const getDailySummaryData = async () => {
  return (
    (await getData(DAILY_SUMMARY_DATA_KEY)) ||
    initialData[DAILY_SUMMARY_DATA_KEY]
  );
};

// --- GENERAL SHOP INVENTORY MANAGEMENT FUNCTIONS (UPDATED FOR ARRAY MANAGEMENT) ---

export const getGeneralInventoryItems = async () => {
  const items =
    (await getData(GENERAL_INVENTORY_KEY)) ||
    initialData[GENERAL_INVENTORY_KEY];
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

/**
 * Saves a general inventory item. If an item with the same name exists (case-insensitive), it updates it. Otherwise, it creates a new one.
 * Uses itemName for finding/updating.
 * @param {object} itemToSave - The item object to save/update.
 */
export const saveGeneralInventoryItem = async (itemToSave) => {
  try {
    if (
      !itemToSave ||
      typeof itemToSave.itemName !== "string" ||
      itemToSave.itemName.trim() === ""
    ) {
      throw new Error("Item name is required and must be a valid string.");
    }

    console.log(`--- saveGeneralInventoryItem: Processing "${itemToSave.itemName}" ---`);

    let currentInventory = await getGeneralInventoryItems(); // (A) Get current array
    console.log(`DEBUG: (A) currentInventory BEFORE modification for "${itemToSave.itemName}":`, JSON.stringify(currentInventory.map(item => item.itemName || 'unknown')));

    if (!Array.isArray(currentInventory)) {
        console.warn(`DEBUG: currentInventory for "${itemToSave.itemName}" was not an array, re-initializing to empty.`);
        currentInventory = []; // Fallback, though getGeneralInventoryItems should prevent this
    }

    const existingItemIndex = currentInventory.findIndex( // (B) Find if item exists
      (item) =>
        item &&
        item.itemName &&
        item.itemName.toLowerCase() === itemToSave.itemName.toLowerCase()
    );

    console.log(`DEBUG: (B) existingItemIndex for "${itemToSave.itemName}":`, existingItemIndex);

    if (existingItemIndex !== -1) {
      // Update existing item
      currentInventory[existingItemIndex] = {
        ...currentInventory[existingItemIndex],
        ...itemToSave,
        currentStock: Number(itemToSave.currentStock) || 0,
        costPricePerUnit: Number(itemToSave.costPricePerUnit) || Number(currentInventory[existingItemIndex].costPricePerUnit) || 0,
        sellingPricePerUnit: Number(itemToSave.sellingPricePerUnit) || Number(currentInventory[existingItemIndex].sellingPricePerUnit) || 0,
        unit: itemToSave.unit || currentInventory[existingItemIndex].unit || "units",
        category: itemToSave.category || currentInventory[existingItemIndex].category || "Miscellaneous",
        description: itemToSave.description || currentInventory[existingItemIndex].description || "",
        voiceKeywords: itemToSave.voiceKeywords || currentInventory[existingItemIndex].voiceKeywords || [],
        lastUpdated: Date.now(),
      };
      console.log(`dataStorage: Updating existing general inventory item: ${itemToSave.itemName}`);
    } else {
      // Add new item
      const newItem = {
        id: itemToSave.id || Date.now().toString(),
        itemName: itemToSave.itemName,
        currentStock: Number(itemToSave.currentStock) || 0,
        costPricePerUnit: Number(itemToSave.costPricePerUnit) || 0,
        sellingPricePerUnit: Number(itemToSave.sellingPricePerUnit) || 0,
        unit: itemToSave.unit || "units",
        category: itemToSave.category || "Miscellaneous",
        description: itemToSave.description || "",
        voiceKeywords: itemToSave.voiceKeywords || [],
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      };
      currentInventory.push(newItem); // (C) Push new item to the array
      console.log(`dataStorage: Adding new general inventory item: ${newItem.itemName}`);
    }

    console.log(`DEBUG: (C) currentInventory AFTER modification for "${itemToSave.itemName}":`, JSON.stringify(currentInventory.map(item => item.itemName || 'unknown')));

    await saveData(GENERAL_INVENTORY_KEY, currentInventory); // (D) Save the *entire* updated array
    console.log(`DEBUG: (D) Successfully called saveData for "${itemToSave.itemName}". Current total items in array (at this point): ${currentInventory.length}`);

    console.log(`--- saveGeneralInventoryItem: Finished processing "${itemToSave.itemName}" ---`);
    return true;
  } catch (error) {
    console.error(`dataStorage: Error saving general inventory item "${itemToSave.itemName}":`, error);
    throw error;
  }
};

// EXPORT saveInventoryItem for ManageItemScreen (alias) - remains the same
export const saveInventoryItem = saveGeneralInventoryItem;

// updateGeneralInventoryItem can largely use saveGeneralInventoryItem, or be kept separate
export const updateGeneralInventoryItem = saveGeneralInventoryItem;


export const deleteGeneralInventoryItem = async (itemName) => {
  try {
    if (typeof itemName !== "string" || itemName.trim() === "") {
      throw new Error("Item name is required for deletion.");
    }
    let currentInventory = await getGeneralInventoryItems(); // Get the entire array
    const filteredInventory = currentInventory.filter(
      (item) =>
        item.itemName && item.itemName.toLowerCase() !== itemName.toLowerCase()
    );

    if (filteredInventory.length < currentInventory.length) {
      // Check if something was actually removed
      await saveData(GENERAL_INVENTORY_KEY, filteredInventory); // Save the filtered array
      console.log(`dataStorage: General inventory item '${itemName}' deleted.`);
      return true;
    } else {
      console.warn(
        `dataStorage: General inventory item '${itemName}' not found for deletion.`
      );
      return false;
    }
  } catch (error) {
    console.error("dataStorage: Error deleting general inventory item:", error);
    throw error;
  }
};

export const clearGeneralInventory = async () => {
  return await saveData(
    GENERAL_INVENTORY_KEY,
    initialData[GENERAL_INVENTORY_KEY]
  );
};

// --- MOBILE MONEY FLOAT MANAGEMENT FUNCTIONS (UPDATED FOR ARRAY MANAGEMENT) ---

export const getFloatEntries = async () => {
  const entries =
    (await getData(MOBILE_MONEY_FLOAT_KEY)) ||
    initialData[MOBILE_MONEY_FLOAT_KEY];
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
      costPricePerUnit: Number(entry.costPricePerUnit) || 0, // Keeping for structural consistency
      sellingPricePerUnit: Number(entry.sellingPricePerUnit) || 0, // Keeping for structural consistency
    }));
};

/**
 * Saves a mobile money float entry. If an entry with the same name exists (case-insensitive), it updates it. Otherwise, it creates a new one.
 * Uses itemName for finding/updating.
 * @param {object} newFloat - The float entry object to save/update.
 */
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

    console.log(`--- saveFloatEntry: Processing "${newFloat.itemName}" ---`);

    let currentFloat = await getFloatEntries(); // (A) Get current array
    console.log(`DEBUG: (A) currentFloat BEFORE modification for "${newFloat.itemName}":`, JSON.stringify(currentFloat.map(item => item.itemName || 'unknown')));

    if (!Array.isArray(currentFloat)) {
        console.warn(`DEBUG: currentFloat for "${newFloat.itemName}" was not an array, re-initializing to empty.`);
        currentFloat = []; // Fallback
    }

    const existingFloatIndex = currentFloat.findIndex( // (B) Find if entry exists
      (entry) =>
        entry &&
        entry.itemName &&
        entry.itemName.toLowerCase() === newFloat.itemName.toLowerCase()
    );

    console.log(`DEBUG: (B) existingFloatIndex for "${newFloat.itemName}":`, existingFloatIndex);

    if (existingFloatIndex !== -1) {
      // Update existing entry
      currentFloat[existingFloatIndex] = {
        ...currentFloat[existingFloatIndex],
        ...newFloat,
        currentStock: Number(newFloat.currentStock) || 0,
        commissionRate: newFloat.commissionRate || currentFloat[existingFloatIndex].commissionRate,
        voiceKeywords: newFloat.voiceKeywords || currentFloat[existingFloatIndex].voiceKeywords || [],
        lastUpdated: Date.now(),
      };
      console.log(`dataStorage: Updating existing float entry: ${newFloat.itemName}`);
    } else {
      // Add new entry
      const floatToPush = {
        id: newFloat.id || Date.now().toString(),
        itemName: newFloat.itemName,
        currentStock: Number(newFloat.currentStock) || 0,
        costPricePerUnit: Number(newFloat.costPricePerUnit) || 0, // Keeping for structural consistency
        sellingPricePerUnit: Number(newFloat.sellingPricePerUnit) || 0, // Keeping for structural consistency
        commissionRate: newFloat.commissionRate || { deposit: 0, withdrawal: 0 },
        voiceKeywords: newFloat.voiceKeywords || [],
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      };
      currentFloat.push(floatToPush); // (C) Push new entry to the array
      console.log(`dataStorage: Adding new float entry: ${newFloat.itemName}`);
    }

    console.log(`DEBUG: (C) currentFloat AFTER modification for "${newFloat.itemName}":`, JSON.stringify(currentFloat.map(item => item.itemName || 'unknown')));

    await saveData(MOBILE_MONEY_FLOAT_KEY, currentFloat); // (D) Save the *entire* updated array
    console.log(`DEBUG: (D) Successfully called saveData for "${newFloat.itemName}". Current total entries in array (at this point): ${currentFloat.length}`);

    console.log(`--- saveFloatEntry: Finished processing "${newFloat.itemName}" ---`);
    return true;
  } catch (error) {
    console.error(`dataStorage: Error saving float entry "${newFloat.itemName}":`, error);
    throw error;
  }
};

// updateFloatEntry can largely use saveFloatEntry, or be kept separate
export const updateFloatEntry = saveFloatEntry;

export const deleteFloatEntry = async (itemName) => {
  try {
    if (typeof itemName !== "string" || itemName.trim() === "") {
      throw new Error("Float item name is required for deletion.");
    }
    let currentFloat = await getFloatEntries(); // Get the entire array
    const filteredFloat = currentFloat.filter(
      (entry) =>
        entry.itemName &&
        entry.itemName.toLowerCase() !== itemName.toLowerCase()
    );

    if (filteredFloat.length < currentFloat.length) {
      // Check if something was actually removed
      await saveData(MOBILE_MONEY_FLOAT_KEY, filteredFloat); // Save the filtered array
      console.log(`dataStorage: Float entry '${itemName}' deleted.`);
      return true;
    } else {
      console.warn(
        `dataStorage: Float entry '${itemName}' not found for deletion.`
      );
      return false;
    }
  } catch (error) {
    console.error("dataStorage: Error deleting float entry:", error);
    throw error;
  }
};

export const clearFloatEntries = async () => {
  return await saveData(
    MOBILE_MONEY_FLOAT_KEY,
    initialData[MOBILE_MONEY_FLOAT_KEY]
  );
};

// --- Dedicated Physical Cash Functions ---

export const getPhysicalCash = async () => {
  try {
    const value = await AsyncStorage.getItem(PHYSICAL_CASH_KEY);
    return value != null ? parseFloat(value) : initialData[PHYSICAL_CASH_KEY];
  } catch (e) {
    console.error("dataStorage: Failed to fetch physical cash:", e);
    return initialData[PHYSICAL_CASH_KEY];
  }
};

export const savePhysicalCash = async (amount) => {
  try {
    const stringValue = String(Number(amount));
    await AsyncStorage.setItem(PHYSICAL_CASH_KEY, stringValue);
    return true;
  } catch (e) {
    console.error("dataStorage: Failed to save physical cash:", e);
    throw e;
  }
};

export const clearPhysicalCash = async () => {
  return await savePhysicalCash(initialData[PHYSICAL_CASH_KEY]);
};

// --- Dedicated Commission Earnings Functions ---

/**
 * Retrieves the total accumulated commission earnings.
 * @returns {Promise<number>} The total commission earned.
 */
export const getCommissionEarnings = async () => {
  try {
    const value = await AsyncStorage.getItem(COMMISSION_EARNINGS_KEY);
    return value != null
      ? parseFloat(value)
      : initialData[COMMISSION_EARNINGS_KEY];
  } catch (e) {
    console.error("dataStorage: Failed to fetch commission earnings:", e);
    return initialData[COMMISSION_EARNINGS_KEY];
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
    console.error("dataStorage: Failed to save commission earnings:", e);
    throw e;
  }
};

/**
 * Resets the total commission earnings to 0.
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
export const clearCommissionEarnings = async () => {
  return await saveCommissionEarnings(initialData[COMMISSION_EARNINGS_KEY]);
};

// Optional: For complete data clearing (for development/testing)
export const clearAllStorage = async () => {
  try {
    await AsyncStorage.clear();
    console.log("dataStorage: All AsyncStorage data cleared successfully.");
    // After clearing all, re-initialize to set up default data
    // Note: If you use initializeShopData from initialization.js, you might
    // want to call that specifically here instead of initializeAppData().
    await initializeAppData(); // This calls the internal initialization for default values
  } catch (e) {
    console.error("dataStorage: Error clearing all storage:", e);
  }
};

// Exporting helpers for initialization.js to use
export {
  getData,
  saveData,
  PHYSICAL_CASH_KEY,
  COMMISSION_EARNINGS_KEY,
  TRANSACTIONS_KEY,
  GENERAL_INVENTORY_KEY, // Exporting these keys for use in initialization.js
  MOBILE_MONEY_FLOAT_KEY,
};