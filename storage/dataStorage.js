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

// Function to generate a simple, reasonably unique ID
const generateSimpleUniqueId = () => {
  // Combine current timestamp (milliseconds) with a small random number
  // The random number adds uniqueness if multiple IDs are generated in the same millisecond.
  // Using a range up to 1000 for the random part.
  return `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
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
  // Console log statement below has been commented out or adjusted as it was causing issues with '(...)' syntax.
  // Original: ("Here: ", value);
  // Adjusted for standard console.log:
  // console.log("dataStorage: Saving data:", value);

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
 * The main app-wide prepopulation is handled by `initializeShopData` in your `initialization.js`.
 */
export const initializeAppData = async () => {
  // Console log statements below have been commented out or adjusted as they were causing issues with '(...)' syntax.
  // Original: ("dataStorage: Checking if app data needs initialization (internal).");
  // Adjusted:
  console.log(
    "dataStorage: Checking if app data needs initialization (internal)."
  );

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
      // Original: (`dataStorage: Initializing data for key: ${key}`);
      // Adjusted:
      console.log(`dataStorage: Initializing data for key: ${key}`);
      await saveData(key, initialData[key]);
    } else {
      // Original: (`dataStorage: Data for key: ${key} already exists. Skipping initialization.`);
      // Adjusted:
      console.log(
        `dataStorage: Data for key: ${key} already exists. Skipping initialization.`
      );
    }
  }
  // Original: ("dataStorage: App data initialization (internal) complete.");
  // Adjusted:
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
export const saveTransaction = async (transaction) => {
  try {
    // Load existing data
    const existingTransactions = await getTransactions();
    let currentPhysicalCash = await getPhysicalCash();
    let floatEntries = await getFloatEntries(); // This fetches the ARRAY of float entries
    let inventoryItems = await getGeneralInventoryItems(); // This fetches the ARRAY of inventory items
    let commissionEarnings = await getCommissionEarnings();

    // Add timestamp and a unique ID
    const newTransaction = {
      ...transaction,
      timestamp: Date.now(),
      id: generateSimpleUniqueId(),
    };

    // --- Core Logic for updating balances based on transaction type ---
    if (newTransaction.isMobileMoney) {
      const networkName = newTransaction.itemName; // 'itemName' holds the network name
      const mmAmount = newTransaction.amount; // 'amount' holds the transaction value
      const commission = await calculateCommission(
        networkName,
        mmAmount,
        newTransaction.type
      );
      newTransaction.commissionEarned = commission; // Attach commission to the transaction record

      if (newTransaction.type === "sell") {
        // Mobile Money Withdrawal
        // Physical cash goes OUT, Float comes IN (digitally)
        currentPhysicalCash -= mmAmount; // Cash given to customer
        floatEntries = floatEntries.map((entry) =>
          entry.itemName.toLowerCase() === networkName.toLowerCase()
            ? { ...entry, currentStock: entry.currentStock + mmAmount } // Float increases
            : entry
        );
        commissionEarnings += commission;
      } else if (newTransaction.type === "restock") {
        // Mobile Money Deposit
        // Physical cash comes IN, Float goes OUT (digitally)
        currentPhysicalCash += mmAmount; // Cash received from customer
        floatEntries = floatEntries.map((entry) =>
          entry.itemName.toLowerCase() === networkName.toLowerCase()
            ? { ...entry, currentStock: entry.currentStock - mmAmount } // Float decreases
            : entry
        );
        commissionEarnings += commission;
      }
    } else {
      // General Shop Item
      const quantity = newTransaction.quantity;
      const itemName = newTransaction.itemName;
      const productDetails = inventoryItems.find(
        (item) => item.itemName.toLowerCase() === itemName.toLowerCase()
      );

      if (productDetails) {
        if (newTransaction.type === "sell") {
          // Sale
          inventoryItems = inventoryItems.map((item) =>
            item.itemName.toLowerCase() === itemName.toLowerCase()
              ? { ...item, currentStock: item.currentStock - quantity }
              : item
          );
          currentPhysicalCash += productDetails.sellingPrice * quantity; // Cash received from sale
        } else if (newTransaction.type === "restock") {
          // Restock
          inventoryItems = inventoryItems.map((item) =>
            item.itemName.toLowerCase() === itemName.toLowerCase()
              ? { ...item, currentStock: item.currentStock + quantity }
              : item
          );
          currentPhysicalCash -= productDetails.costPrice * quantity; // Cash paid for restock
        }
      }
    }

    // Save updated data
    await overwriteTransactions([...existingTransactions, newTransaction]); // Add new transaction to history
    await savePhysicalCash(currentPhysicalCash);

    // --- CRITICAL FIX HERE ---
    // You are saving the entire arrays, so use the generic saveData helper
    // which correctly handles stringifying the array.
    await saveData(MOBILE_MONEY_FLOAT_KEY, floatEntries); // <--- CORRECTED
    await saveData(GENERAL_INVENTORY_KEY, inventoryItems); // <--- CORRECTED
    // --- END FIX ---

    await saveCommissionEarnings(commissionEarnings);

    return true; // Indicate success
  } catch (error) {
    console.error("Error in saveTransaction:", error);
    throw new Error("Failed to save transaction: " + error.message);
  }
};

// Function for overwritting transactions in storage
export async function overwriteTransactions(newTransactionList) {
  try {
    await AsyncStorage.setItem(
      TRANSACTIONS_KEY,
      JSON.stringify(newTransactionList)
    );
    // Original: ("dataStorage: Transactions successfully overwritten.");
    // Adjusted:
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

    // Original: (`--- saveGeneralInventoryItem: Processing "${itemToSave.itemName}" ---`);
    // Adjusted:
    console.log(
      `--- saveGeneralInventoryItem: Processing "${itemToSave.itemName}" ---`
    );

    let currentInventory = await getGeneralInventoryItems(); // (A) Get current array
    // Original: (currentInventory);
    // Adjusted:
    // console.log("DEBUG: currentInventory fetched:", currentInventory); // This can be very verbose, use sparingly

    // Original: (`DEBUG: (A) currentInventory BEFORE modification for "${itemToSave.itemName}":`, JSON.stringify(currentInventory.map((item) => item.itemName || "unknown")));
    // Adjusted:
    console.log(
      `DEBUG: (A) currentInventory BEFORE modification for "${itemToSave.itemName}":`,
      JSON.stringify(currentInventory.map((item) => item.itemName || "unknown"))
    );

    if (!Array.isArray(currentInventory)) {
      console.warn(
        `DEBUG: currentInventory for "${itemToSave.itemName}" was not an array, re-initializing to empty.`
      );
      currentInventory = []; // Fallback, though getGeneralInventoryItems should prevent this
    }

    const existingItemIndex = currentInventory.findIndex(
      // (B) Find if item exists
      (item) =>
        item &&
        item.itemName &&
        item.itemName.toLowerCase() === itemToSave.itemName.toLowerCase()
    );

    // Original: (`DEBUG: (B) existingItemIndex for "${itemToSave.itemName}":`, existingItemIndex);
    // Adjusted:
    console.log(
      `DEBUG: (B) existingItemIndex for "${itemToSave.itemName}":`,
      existingItemIndex
    );

    if (existingItemIndex !== -1) {
      // Update existing item
      currentInventory[existingItemIndex] = {
        ...currentInventory[existingItemIndex],
        ...itemToSave,
        currentStock: Number(itemToSave.currentStock) || 0,
        costPricePerUnit:
          Number(itemToSave.costPricePerUnit) ||
          Number(currentInventory[existingItemIndex].costPricePerUnit) ||
          0,
        sellingPricePerUnit:
          Number(itemToSave.sellingPricePerUnit) ||
          Number(currentInventory[existingItemIndex].sellingPricePerUnit) ||
          0,
        unit:
          itemToSave.unit ||
          currentInventory[existingItemIndex].unit ||
          "units",
        category:
          itemToSave.category ||
          currentInventory[existingItemIndex].category ||
          "Miscellaneous",
        description:
          itemToSave.description ||
          currentInventory[existingItemIndex].description ||
          "",
        voiceKeywords:
          itemToSave.voiceKeywords ||
          currentInventory[existingItemIndex].voiceKeywords ||
          [],
        lastUpdated: Date.now(),
      };
      // Original: (`dataStorage: Updating existing general inventory item: ${itemToSave.itemName}`);
      // Adjusted:
      console.log(
        `dataStorage: Updating existing general inventory item: ${itemToSave.itemName}`
      );
    } else {
      // Add new item
      const newItem = {
        id: itemToSave.id || generateSimpleUniqueId(), // Use generateSimpleUniqueId for new items
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
      // Original: (`dataStorage: Adding new general inventory item: ${newItem.itemName}`);
      // Adjusted:
      console.log(
        `dataStorage: Adding new general inventory item: ${newItem.itemName}`
      );
    }

    // Original: (`DEBUG: (C) currentInventory AFTER modification for "${itemToSave.itemName}":`, JSON.stringify(currentInventory.map((item) => item.itemName || "unknown")));
    // Adjusted:
    console.log(
      `DEBUG: (C) currentInventory AFTER modification for "${itemToSave.itemName}":`,
      JSON.stringify(currentInventory.map((item) => item.itemName || "unknown"))
    );

    await saveData(GENERAL_INVENTORY_KEY, currentInventory); // (D) Save the *entire* updated array
    // Original: (`DEBUG: (D) Successfully called saveData for "${itemToSave.itemName}". Current total items in array (at this point): ${currentInventory.length}`);
    // Adjusted:
    console.log(
      `DEBUG: (D) Successfully called saveData for "${itemToSave.itemName}". Current total items in array (at this point): ${currentInventory.length}`
    );

    // Original: (`--- saveGeneralInventoryItem: Finished processing "${itemToSave.itemName}" ---`);
    // Adjusted:
    console.log(
      `--- saveGeneralInventoryItem: Finished processing "${itemToSave.itemName}" ---`
    );
    return true;
  } catch (error) {
    console.error(
      `dataStorage: Error saving general inventory item "${itemToSave.itemName}":`,
      error
    );
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
      // Original: (`dataStorage: General inventory item '${itemName}' deleted.`);
      // Adjusted:
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

    // Original: (`--- saveFloatEntry: Processing "${newFloat.itemName}" ---`);
    // Adjusted:
    console.log(`--- saveFloatEntry: Processing "${newFloat.itemName}" ---`);

    let currentFloat = await getFloatEntries(); // (A) Get current array
    // Original: (`DEBUG: (A) currentFloat BEFORE modification for "${newFloat.itemName}":`, JSON.stringify(currentFloat.map((item) => item.itemName || "unknown")));
    // Adjusted:
    console.log(
      `DEBUG: (A) currentFloat BEFORE modification for "${newFloat.itemName}":`,
      JSON.stringify(currentFloat.map((item) => item.itemName || "unknown"))
    );

    if (!Array.isArray(currentFloat)) {
      console.warn(
        `DEBUG: currentFloat for "${newFloat.itemName}" was not an array, re-initializing to empty.`
      );
      currentFloat = []; // Fallback
    }

    const existingFloatIndex = currentFloat.findIndex(
      // (B) Find if entry exists
      (entry) =>
        entry &&
        entry.itemName &&
        entry.itemName.toLowerCase() === newFloat.itemName.toLowerCase()
    );

    // Original: (`DEBUG: (B) existingFloatIndex for "${newFloat.itemName}":`, existingFloatIndex);
    // Adjusted:
    console.log(
      `DEBUG: (B) existingFloatIndex for "${newFloat.itemName}":`,
      existingFloatIndex
    );

    if (existingFloatIndex !== -1) {
      // Update existing entry
      currentFloat[existingFloatIndex] = {
        ...currentFloat[existingFloatIndex],
        ...newFloat,
        currentStock: Number(newFloat.currentStock) || 0,
        commissionRate:
          newFloat.commissionRate ||
          currentFloat[existingFloatIndex].commissionRate,
        voiceKeywords:
          newFloat.voiceKeywords ||
          currentFloat[existingFloatIndex].voiceKeywords ||
          [],
        lastUpdated: Date.now(),
      };
      // Original: (`dataStorage: Updating existing float entry: ${newFloat.itemName}`);
      // Adjusted:
      console.log(
        `dataStorage: Updating existing float entry: ${newFloat.itemName}`
      );
    } else {
      // Add new entry
      const floatToPush = {
        id: newFloat.id || generateSimpleUniqueId(), // Use generateSimpleUniqueId for new items
        itemName: newFloat.itemName,
        currentStock: Number(newFloat.currentStock) || 0,
        costPricePerUnit: Number(newFloat.costPricePerUnit) || 0, // Keeping for structural consistency
        sellingPricePerUnit: Number(newFloat.sellingPricePerUnit) || 0, // Keeping for structural consistency
        commissionRate: newFloat.commissionRate || {
          deposit: 0,
          withdrawal: 0,
        },
        voiceKeywords: newFloat.voiceKeywords || [],
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      };
      currentFloat.push(floatToPush); // (C) Push new entry to the array
      // Original: (`dataStorage: Adding new float entry: ${newFloat.itemName}`);
      // Adjusted:
      console.log(`dataStorage: Adding new float entry: ${newFloat.itemName}`);
    }

    // Original: (`DEBUG: (C) currentFloat AFTER modification for "${newFloat.itemName}":`, JSON.stringify(currentFloat.map((item) => item.itemName || "unknown")));
    // Adjusted:
    console.log(
      `DEBUG: (C) currentFloat AFTER modification for "${newFloat.itemName}":`,
      JSON.stringify(currentFloat.map((item) => item.itemName || "unknown"))
    );

    await saveData(MOBILE_MONEY_FLOAT_KEY, currentFloat); // (D) Save the *entire* updated array
    // Original: (`DEBUG: (D) Successfully called saveData for "${newFloat.itemName}". Current total entries in array (at this point): ${currentFloat.length}`);
    // Adjusted:
    console.log(
      `DEBUG: (D) Successfully called saveData for "${newFloat.itemName}". Current total entries in array (at this point): ${currentFloat.length}`
    );

    // Original: (`--- saveFloatEntry: Finished processing "${newFloat.itemName}" ---`);
    // Adjusted:
    console.log(
      `--- saveFloatEntry: Finished processing "${newFloat.itemName}" ---`
    );
    return true;
  } catch (error) {
    console.error(
      `dataStorage: Error saving float entry "${newFloat.itemName}":`,
      error
    );
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
      // Original: (`dataStorage: Float entry '${itemName}' deleted.`);
      // Adjusted:
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
    // Original: (initialData[PHYSICAL_CASH_KEY]) - causing issue, likely meant for console.log
    // Adjusted:
    console.log(
      `DEBUG: getPhysicalCash - initialData[PHYSICAL_CASH_KEY] in catch block:`,
      initialData[PHYSICAL_CASH_KEY]
    );

    // Added robust parsing/validation to prevent NaN, based on previous discussion
    if (value === null || value === "") {
      console.log(
        `[getPhysicalCash] Value is null or empty string. Returning initialData[PHYSICAL_CASH_KEY] (${initialData[PHYSICAL_CASH_KEY]}).`
      );
      return initialData[PHYSICAL_CASH_KEY];
    }
    const parsedValue = parseFloat(value);
    if (isNaN(parsedValue)) {
      console.warn(
        `[getPhysicalCash] Stored physical cash value "${value}" is not a valid number. Returning initial:`,
        initialData[PHYSICAL_CASH_KEY]
      );
      return initialData[PHYSICAL_CASH_KEY];
    }
    return parsedValue;
  } catch (e) {
    console.error("dataStorage: Failed to fetch physical cash:", e);
    // Original: (initialData[PHYSICAL_CASH_KEY]) - causing issue, likely meant for console.log
    // Adjusted:
    console.log(
      `DEBUG: getPhysicalCash - Returning initialData[PHYSICAL_CASH_KEY] (${initialData[PHYSICAL_CASH_KEY]}) due to error.`
    );
    return initialData[PHYSICAL_CASH_KEY];
  }
};

export const savePhysicalCash = async (amount) => {
  try {
    // Added validation for NaN before saving, based on previous discussion
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) {
      console.error(
        `[savePhysicalCash] Invalid amount provided to savePhysicalCash: "${amount}". Must be a number.`
      );
      throw new Error(
        "Invalid amount provided to savePhysicalCash: Must be a number."
      );
    }
    const stringValue = String(numericAmount);
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
    // Original: ("dataStorage: All AsyncStorage data cleared successfully.");
    // Adjusted:
    console.log("dataStorage: All AsyncStorage data cleared successfully.");
    // After clearing all, re-initialize to set up default data
    // Note: If you use initializeShopData from initialization.js, you might
    // want to call that specifically here instead of initializeAppData().
    await initializeAppData(); // This calls the internal initialization for default values
  } catch (e) {
    console.error("dataStorage: Error clearing all storage:", e);
  }
};

const saveBusinessStatus = async (status) => {
  try {
    await AsyncStorage.setItem("businessStatus", JSON.stringify(status));
  } catch (error) {
    console.error("Error saving business status:", error);
  }
};

const getBusinessStatus = async () => {
  try {
    const status = await AsyncStorage.getItem("businessStatus");
    return status ? JSON.parse(status) : "closed"; // Default to 'closed'
  } catch (error) {
    console.error("Error getting business status:", error);
    return "closed"; // Default to 'closed' on error
  }
};

const clearDailySummaryData = async () => {
  try {
    await AsyncStorage.removeItem("dailySummaryData");
    // Original: ("Daily summary data cleared from storage.");
    // Adjusted:
    console.log("Daily summary data cleared from storage.");
  } catch (error) {
    console.error("Error clearing daily summary data:", error);
  }
};

// Exporting helpers for initialization.js to use
export {
  getData,
  saveData,
  getBusinessStatus,
  saveBusinessStatus,
  clearDailySummaryData,
  PHYSICAL_CASH_KEY,
  COMMISSION_EARNINGS_KEY,
  TRANSACTIONS_KEY,
  GENERAL_INVENTORY_KEY, // Exporting these keys for use in initialization.js
  MOBILE_MONEY_FLOAT_KEY,
};
