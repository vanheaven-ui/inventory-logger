// db/database.js
import * as SQLite from "expo-sqlite";

let db; // This variable will hold our database instance

export const initDatabase = () => {
  return new Promise((resolve, reject) => {
    // Open the database; it will be created if it doesn't exist
    db = SQLite.openDatabase("shopDB.db");

    if (db) {
      console.log("Database opened successfully (Expo).");
      // Proceed to create tables
      createTables()
        .then(() => resolve(db)) // Resolve with the db instance once tables are ready
        .catch((error) => reject(error));
    } else {
      console.error("Error opening database (Expo).");
      reject(new Error("Failed to open database."));
    }
  });
};

const createTables = () => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        // 1. Inventory Table: Stores details for both general items and mobile money services
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS inventory (
          id TEXT PRIMARY KEY NOT NULL,           -- Unique ID (e.g., 'item_001_500ml', 'mtn_airtime')
          name TEXT NOT NULL,                     -- Generic product name (e.g., 'Coca-Cola', 'MTN Airtime')
          category TEXT,
          quantity INTEGER NOT NULL,              -- Current stock (for physical items), or a large number for services
          unit TEXT,                              -- 'bottle', 'sachet', 'service', etc.
          packSize REAL,                          -- e.g., 500 (for 500ml), 1 (for 1L/1kg)
          packUnit TEXT,                          -- 'ml', 'L', 'g', 'kg', 'pack', 'service'
          costPrice INTEGER NOT NULL,             -- Cost price per unit/pack
          sellingPrice INTEGER NOT NULL,          -- Selling price per unit/pack
          isMobileMoneyAgent INTEGER NOT NULL,    -- 0 for false, 1 for true (true if this item represents an MM service)
          isService INTEGER NOT NULL,             -- 0 for false, 1 for true (true if this item is a service like airtime)
          commissionEarned REAL                   -- Percentage commission for services (e.g., 0.05 for 5%)
        );`,
          [],
          () => console.log("Table inventory created or exists."),
          (_, error) => console.error("Error creating inventory table:", error)
        );

        // 2. Transactions Table: Records every sale, restock, mobile money withdrawal/deposit
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY NOT NULL,             -- Unique ID for each transaction (UUID)
          itemId TEXT NOT NULL,                     -- Reference to inventory.id
          type TEXT NOT NULL,                       -- 'sell', 'restock', 'mobile_money_withdrawal', 'mobile_money_deposit', 'airtime_sale'
          quantity INTEGER,                         -- Number of items sold/restocked (physical items) or amount for MM (e.g., 50000 for 50k withdrawal)
          amount INTEGER NOT NULL,                  -- Total money value of the transaction (e.g., total selling price, withdrawal amount)
          commissionEarned REAL,                    -- Actual commission in UGX earned for THIS specific transaction
          timestamp INTEGER NOT NULL,               -- Unix timestamp of the transaction
          isMobileMoney INTEGER NOT NULL,           -- 0/1, was this related to mobile money (used for summary filtering)
          notes TEXT,
          FOREIGN KEY (itemId) REFERENCES inventory(id)
        );`,
          [],
          () => console.log("Table transactions created or exists."),
          (_, error) =>
            console.error("Error creating transactions table:", error)
        );

        // 3. Physical Cash Table: Stores the current physical cash balance of the shop
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS physical_cash (
          id INTEGER PRIMARY KEY AUTOINCREMENT,     -- Will always have just one row (ID 1)
          amount INTEGER NOT NULL                   -- The total physical cash
        );`,
          [],
          () => {
            console.log("Table physical_cash created or exists.");
            // Ensure there's always one row for the cash amount, initialize to 0 if not present
            tx.executeSql(
              `INSERT OR IGNORE INTO physical_cash (id, amount) VALUES (1, 0);`,
              [],
              () => console.log("Physical cash row initialized or exists."),
              (_, error) =>
                console.error("Error initializing physical cash:", error)
            );
          },
          (_, error) =>
            console.error("Error creating physical_cash table:", error)
        );

        // 4. App Settings Table: Stores global application settings (e.g., last summary reset, MM agent status)
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY NOT NULL,            -- Unique setting key (e.g., 'lastSummaryResetTimestamp', 'isMobileMoneyAgent')
          value TEXT                                -- The setting's value (stored as text, parse to appropriate type)
        );`,
          [],
          () => {
            console.log("Table app_settings created or exists.");
            // Initialize global settings if they don't exist
            tx.executeSql(
              `INSERT OR IGNORE INTO app_settings (key, value) VALUES ('lastSummaryResetTimestamp', '0');`,
              [],
              () =>
                console.log("lastSummaryResetTimestamp initialized or exists."),
              (_, error) =>
                console.error(
                  "Error initializing lastSummaryResetTimestamp:",
                  error
                )
            );
            tx.executeSql(
              `INSERT OR IGNORE INTO app_settings (key, value) VALUES ('isMobileMoneyAgent', 'false');`, // Default to false
              [],
              () =>
                console.log(
                  "isMobileMoneyAgent setting initialized or exists."
                ),
              (_, error) =>
                console.error(
                  "Error initializing isMobileMoneyAgent setting:",
                  error
                )
            );
          },
          (_, error) =>
            console.error("Error creating app_settings table:", error)
        );

        // 5. Mobile Money Commission Tiers: Store the commission rates dynamically
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS commission_tiers (
          network TEXT NOT NULL,
          minAmount INTEGER NOT NULL,
          maxAmount INTEGER NOT NULL,
          withdrawalCommission INTEGER NOT NULL,
          depositCommission INTEGER NOT NULL,
          PRIMARY KEY (network, minAmount, maxAmount)
        );`,
          [],
          () => console.log("Table commission_tiers created or exists."),
          (_, error) =>
            console.error("Error creating commission_tiers table:", error)
        );

        // 6. Daily Summary Data Table: To cache the most recent daily summary calculation
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS daily_summary_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,     -- Will always have just one row (ID 1)
          generalSummary TEXT,                      -- JSON string of general shop summary
          mobileMoneySummary TEXT,                  -- JSON string of mobile money summary
          overallNetProfitOrLoss INTEGER,
          calculatedAt INTEGER                      -- Timestamp of when the summary was last calculated
        );`,
          [],
          () => console.log("Table daily_summary_data created or exists."),
          (_, error) =>
            console.error("Error creating daily_summary_data table:", error)
        );

        // Resolve the promise once all table creation commands are queued
        resolve();
      },
      (error) => {
        console.error("Transaction error creating tables:", error);
        reject(error);
      },
      () => {
        console.log("All tables creation transaction submitted (Expo).");
      }
    );
  });
};

export const getDB = () => db; // Export a way to get the database instance
