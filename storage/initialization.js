import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  initialProducts,
  initialNetworks,
  initialTransactions,
} from "../data/intialData"
import {
  saveGeneralInventoryItem,
  saveFloatEntry,
  getGeneralInventoryItems,
  getFloatEntries,
  savePhysicalCash,
  getPhysicalCash,
  saveCommissionEarnings,
  getCommissionEarnings,
  saveData,
  getData,
  PHYSICAL_CASH_KEY,
  COMMISSION_EARNINGS_KEY,
  TRANSACTIONS_KEY, // Ensure this is imported for the check
  overwriteTransactions,
} from "./dataStorage"; // <- Ensure this path is correct for your project

// A key to mark that the initial setup has been performed
const APP_FIRST_LAUNCH_KEY = "app_first_launch_done";

/**
 * Initializes the application's data in AsyncStorage on first launch.
 * This includes pre-populating initial product inventory, mobile money networks,
 * and setting initial cash and commission balances.
 */
export async function initializeShopData() {
  console.log("Attempting to initialize shop data...");
  try {
    // Fetch all relevant data states from AsyncStorage
    const existingInventory = await getGeneralInventoryItems();
    const existingFloat = await getFloatEntries();
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

    // --- Prepopulate General Inventory Items ---
    const inventoryPromises = initialProducts.map((product) =>
      saveGeneralInventoryItem({
        id: product.id,
        itemName: product.name,
        unit: product.unit,
        sellingPricePerUnit: product.sellingPrice,
        costPricePerUnit: product.costPrice,
        currentStock: product.quantity,
        category: product.category,
        description: product.description,
        voiceKeywords: product.voiceKeywords,
      })
    );
    await Promise.all(inventoryPromises);
    console.log("Initial general inventory items prepopulated successfully.");

    // --- Prepopulate Mobile Money Float Entries ---
    const floatPromises = initialNetworks.map((network) =>
      saveFloatEntry({
        id: network.id,
        itemName: network.name,
        commissionRate: network.commissionRate,
        currentStock: network.float,
        voiceKeywords: network.voiceKeywords,
      })
    );
    await Promise.all(floatPromises);
    console.log(
      "Initial mobile money float entries prepopulated successfully."
    );

    // --- Prepopulate Initial Transactions (if any) ---
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
