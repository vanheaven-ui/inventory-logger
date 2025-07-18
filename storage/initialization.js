import {
  initialProducts,
  initialNetworks,
  initialTransactions,
} from "../data/intialData"; // Ensure this path is correct

import {
  // We'll use getData and saveData directly for bulk operations here
  getData,
  saveData,
  getGeneralInventoryItems, // Still used to get the base existing array
  getFloatEntries, // Still used to get the base existing array
  savePhysicalCash,
  getPhysicalCash,
  saveCommissionEarnings,
  getCommissionEarnings,
  TRANSACTIONS_KEY,
  GENERAL_INVENTORY_KEY,
  MOBILE_MONEY_FLOAT_KEY,
  overwriteTransactions,
} from "./dataStorage"; // <- Ensure this path is correct for your project

// A key to mark that the initial setup has been performed
const APP_FIRST_LAUNCH_KEY = "app_first_launch_done";

/**
 * Initializes the application's data in AsyncStorage on first launch.
 * This includes pre-populating initial product inventory, mobile money networks,
 * and setting initial cash and commission balances.
 * This approach is efficient by reading existing data once, preparing the full
 * updated array in memory, and then writing it back once.
 */
export async function initializeShopData() {
  console.log("Attempting to initialize shop data...");
  try {
    // Fetch all relevant data states from AsyncStorage
    const existingInventory = await getGeneralInventoryItems(); // Gets the current state
    const existingFloat = await getFloatEntries(); // Gets the current state
    const existingTransactions = await getData(TRANSACTIONS_KEY);
    const isFirstLaunchDone = await getData(APP_FIRST_LAUNCH_KEY);

    // --- DEBUG LOGS: Crucial for understanding what's happening ---
    console.log(
      "DEBUG (initializeShopData): existingInventory.length:",
      existingInventory.length
    );
    console.log(
      "DEBUG (initializeShopData): existingFloat.length:",
      existingFloat.length
    );
    console.log(
      "DEBUG (initializeShopData): existingTransactions (is truthy and has length):",
      !!existingTransactions && existingTransactions.length > 0
    );
    console.log(
      "DEBUG (initializeShopData): isFirstLaunchDone flag:",
      isFirstLaunchDone
    );
    // --- END DEBUG LOGS ---

    // === THE FIXED INITIALIZATION CHECK ===
    // We consider the app already initialized and correct IF:
    // 1. The 'first launch done' flag is explicitly set to "true" (meaning a prior attempt completed) AND
    // 2. At least one critical data set (e.g., general inventory) is actually populated.
    // This logic prevents skipping if the flag was set but the data itself is somehow missing or incomplete.
    if (isFirstLaunchDone === "true" && existingInventory.length > 0) {
      console.log(
        "App data found and marked as initialized. Skipping prepopulation."
      );
      return; // Data already exists and is confirmed present, so we exit.
    }

    // If we reach here, it means either:
    //   - It's a true first launch (isFirstLaunchDone is null/false).
    //   - Or, the flag was set, but core data (like inventory) is missing, indicating an incomplete/corrupted state.
    // In both cases, we proceed with prepopulation to ensure data integrity.
    console.log(
      "No complete existing data found or first launch flag not set/incomplete. Prepopulating initial data..."
    );

    // --- Prepare General Inventory Items efficiently ---
    // Start with the existing items (which will be empty array on first run)
    const finalGeneralInventory = [...existingInventory];

    initialProducts.forEach((product) => {
      const existingItemIndex = finalGeneralInventory.findIndex(
        (item) =>
          item &&
          item.itemName &&
          item.itemName.toLowerCase() === product.name.toLowerCase()
      );

      if (existingItemIndex !== -1) {
        // Update existing item, merging new initial data properties
        finalGeneralInventory[existingItemIndex] = {
          ...finalGeneralInventory[existingItemIndex], // Keep existing properties not in initialProduct
          id: product.id,
          itemName: product.name,
          unit: product.unit,
          sellingPricePerUnit: product.sellingPrice,
          costPricePerUnit: product.costPrice,
          currentStock: product.quantity,
          category: product.category,
          description: product.description,
          voiceKeywords: product.voiceKeywords,
          lastUpdated: Date.now(),
        };
      } else {
        // Add new item
        finalGeneralInventory.push({
          id: product.id || Date.now().toString(),
          itemName: product.name,
          currentStock: Number(product.quantity) || 0,
          costPricePerUnit: Number(product.costPrice) || 0,
          sellingPricePerUnit: Number(product.sellingPrice) || 0,
          unit: product.unit || "units",
          category: product.category || "Miscellaneous",
          description: product.description || "",
          voiceKeywords: product.voiceKeywords || [],
          createdAt: Date.now(),
          lastUpdated: Date.now(),
        });
      }
    });
    // Save the entire accumulated general inventory array once
    await saveData(GENERAL_INVENTORY_KEY, finalGeneralInventory);
    console.log("Initial general inventory items prepopulated successfully.");

    // --- Prepare Mobile Money Float Entries efficiently ---
    // Start with the existing float entries
    const finalFloatEntries = [...existingFloat];

    initialNetworks.forEach((network) => {
      const existingFloatIndex = finalFloatEntries.findIndex(
        (entry) =>
          entry &&
          entry.itemName &&
          entry.itemName.toLowerCase() === network.name.toLowerCase()
      );

      if (existingFloatIndex !== -1) {
        // Update existing entry, merging new initial data properties
        finalFloatEntries[existingFloatIndex] = {
          ...finalFloatEntries[existingFloatIndex], // Keep existing properties not in initialNetwork
          id: network.id,
          itemName: network.name,
          commissionRate: network.commissionRate,
          currentStock: network.float,
          voiceKeywords: network.voiceKeywords,
          lastUpdated: Date.now(),
        };
      } else {
        // Add new entry
        finalFloatEntries.push({
          id: network.id || Date.now().toString(),
          itemName: network.name,
          currentStock: Number(network.float) || 0,
          commissionRate: network.commissionRate || {
            deposit: 0,
            withdrawal: 0,
          },
          voiceKeywords: network.voiceKeywords || [],
          createdAt: Date.now(),
          lastUpdated: Date.now(),
        });
      }
    });
    // Save the entire accumulated float array once
    await saveData(MOBILE_MONEY_FLOAT_KEY, finalFloatEntries);
    console.log(
      "Initial mobile money float entries prepopulated successfully."
    );

    // --- Prepopulate Initial Transactions (if any) ---
    // This is already efficient as overwriteTransactions saves the whole array at once.
    if (initialTransactions && initialTransactions.length > 0) {
      await overwriteTransactions(initialTransactions);
      console.log("Initial transactions prepopulated successfully.");
    } else {
      console.log("No initial transactions to prepopulate.");
    }

    // --- Initialize Physical Cash and Commission Earnings ---
    // Initialize to 0 only if they haven't been set to any value previously
    const currentPhysicalCash = await getPhysicalCash();
    if (currentPhysicalCash === null || currentPhysicalCash === undefined) {
      await savePhysicalCash(0);
      console.log("Physical cash initialized to 0.");
    } else {
      console.log("Physical cash already has a value, not initializing to 0.");
    }

    const currentCommissionEarnings = await getCommissionEarnings();
    if (
      currentCommissionEarnings === null ||
      currentCommissionEarnings === undefined
    ) {
      await saveCommissionEarnings(0);
      console.log("Commission earnings initialized to 0.");
    } else {
      console.log(
        "Commission earnings already has a value, not initializing to 0."
      );
    }

    // Set the flag to indicate that initialization has been done *successfully*
    await saveData(APP_FIRST_LAUNCH_KEY, "true");
    console.log("Shop data initialization complete.");
  } catch (error) {
    console.error("Error during shop data initialization:", error);
    // If an error occurs during prepopulation, the APP_FIRST_LAUNCH_KEY
    // will NOT be set to "true", ensuring it retries on the next launch.
  }
}

// You might also need to export APP_FIRST_LAUNCH_KEY if used elsewhere, e.g., for clearing it in dev mode.
export { APP_FIRST_LAUNCH_KEY };
