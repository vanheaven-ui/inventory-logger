import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useLanguage } from "../context/LanguageContext";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  getGeneralInventoryItems, // New: For general shop inventory
  deleteGeneralInventoryItem, // New: For general shop inventory
  clearGeneralInventory, // New: For general shop inventory
  getFloatEntries, // New: For mobile money float
  deleteFloatEntry, // New: For mobile money float
  clearFloatEntries, // New: For mobile money float
} from "../storage/transactionStorage";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Key for AsyncStorage (to get agent status)
const IS_AGENT_KEY = "isMobileMoneyAgent";

export default function InventoryScreen() {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const [displayedItems, setDisplayedItems] = useState([]); // Renamed from inventoryItems
  const [totalCostValue, setTotalCostValue] = useState(0); // For shop: total cost of goods, For agent: total physical cash/initial float
  const [totalSalesValue, setTotalSalesValue] = useState(0); // For shop: total selling value, For agent: total e-value (float on phone)
  const [loading, setLoading] = useState(false);
  const [isMobileMoneyAgent, setIsMobileMoneyAgent] = useState(false); // State for agent status

  // Load agent status from AsyncStorage
  const loadAgentStatus = useCallback(async () => {
    try {
      const storedStatus = await AsyncStorage.getItem(IS_AGENT_KEY);
      if (storedStatus !== null) {
        setIsMobileMoneyAgent(JSON.parse(storedStatus));
      } else {
        setIsMobileMoneyAgent(false); // Default to false if not found
      }
    } catch (error) {
      console.error("InventoryScreen: Failed to load agent status:", error);
    }
  }, []);

  const loadData = useCallback(async () => { // Renamed from loadInventory to loadData
    console.log("InventoryScreen: Starting loadData...");
    setLoading(true);
    try {
      let items = [];
      if (isMobileMoneyAgent) {
        items = await getFloatEntries(); // Get float entries for agent
        console.log("InventoryScreen: Loaded float entries:", items);
      } else {
        items = await getGeneralInventoryItems(); // Get general inventory for shop
        console.log("InventoryScreen: Loaded general inventory items:", items);
      }

      const processedItems = items.map((item) => {
        if (!item.id) {
          const newId =
            Date.now().toString() +
            "-" +
            Math.random().toString(36).substring(2, 9);
          console.warn(
            `InventoryScreen: Item ${
              item.itemName || "unknown"
            } missing ID, assigned: ${newId}`
          );
          return { ...item, id: newId };
        }
        return item;
      });

      const sortedItems = processedItems.sort((a, b) =>
        a.itemName.localeCompare(b.itemName)
      );
      setDisplayedItems(sortedItems); // Use displayedItems
      console.log("InventoryScreen: Processed and sorted items set.");

      let calculatedTotalCost = 0;
      let calculatedTotalSales = 0;

      sortedItems.forEach((item) => {
        if (isMobileMoneyAgent) {
          // --- Logic for Mobile Money Agent Float ---
          // calculatedTotalCost: Sum of initial physical cash invested for each float network.
          // This assumes `item.costPricePerUnit` for float entries represents the *total initial physical cash*
          // that was used to acquire the float for that specific network.
          calculatedTotalCost += (item.costPricePerUnit || 0);

          // calculatedTotalSales: Sum of current E-Value (electronic money) balance across all networks.
          calculatedTotalSales += item.currentStock || 0;
        } else {
          // --- Logic for General Shop Inventory ---
          // currentStock is quantity of items
          // costPricePerUnit is cost per item
          // sellingPricePerUnit is selling price per item
          calculatedTotalCost +=
            (item.currentStock || 0) * (item.costPricePerUnit || 0);
          calculatedTotalSales +=
            (item.currentStock || 0) * (item.sellingPricePerUnit || 0);
        }
      });

      setTotalCostValue(calculatedTotalCost);
      setTotalSalesValue(calculatedTotalSales);

      console.log(
        `InventoryScreen: Total Cost Value: UGX ${calculatedTotalCost.toLocaleString()}, Total Sales Value: UGX ${calculatedTotalSales.toLocaleString()}`
      );
    } catch (error) {
      console.error("InventoryScreen: Error loading data:", error);
      Toast.show({
        type: "error",
        text1: t("error_loading_inventory"), // Use translation key
      });
    } finally {
      setLoading(false);
      console.log("InventoryScreen: Finished loadData.");
    }
  }, [t, isMobileMoneyAgent]); // Added isMobileMoneyAgent to dependencies

  // Use useFocusEffect to reload data and agent status whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadAgentStatus(); // Reload agent status first
      // loadData will automatically re-run when isMobileMoneyAgent changes due to its dependency array
      loadData();
      return () => {
        // Optional cleanup
      };
    }, [loadAgentStatus, loadData]) // Depend on memoized load functions
  );

  const handleDeleteItem = async (itemId) => { // This now handles both inventory and float deletion
    console.log(
      `InventoryScreen: Attempting to delete item with ID: ${itemId}`
    );
    Alert.alert(
      t("confirm_delete"),
      t("confirm_delete_message"),
      [
        {
          text: t("cancel"),
          style: "cancel",
          onPress: () => console.log("Delete cancelled."),
        },
        {
          text: t("delete"),
          onPress: async () => {
            try {
              console.log(
                `InventoryScreen: Confirmed delete for ID: ${itemId}`
              );
              if (isMobileMoneyAgent) {
                await deleteFloatEntry(itemId); // Delete from float storage
              } else {
                await deleteGeneralInventoryItem(itemId); // Delete from general inventory storage
              }
              Toast.show({
                type: "success",
                text1: t("item_deleted"),
              });
              loadData(); // Reload data after delete
              console.log(
                "InventoryScreen: loadData called after delete."
              );
            } catch (error) {
              console.error("InventoryScreen: Error deleting item:", error);
              Toast.show({
                type: "error",
                text1: t("error_deleting_item"),
              });
            }
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  const handleClearAll = () => { // Renamed from handleClearAllInventory
    console.log("InventoryScreen: Initiating clear all process.");
    Alert.alert(
      isMobileMoneyAgent ? t("confirm_clear_float_title") : t("confirm_clear_inventory_title"),
      isMobileMoneyAgent ? t("confirm_clear_float_message") : t("confirm_clear_inventory_message"),
      [
        {
          text: t("cancel"),
          style: "cancel",
          onPress: () => {
            console.log("Clear all cancelled.");
            Toast.show({ type: "info", text1: t("clear_cancelled") });
          },
        },
        {
          text: t("clear_all"),
          style: "destructive",
          onPress: async () => {
            try {
              console.log(
                "InventoryScreen: User confirmed clearing all."
              );
              if (isMobileMoneyAgent) {
                await clearFloatEntries(); // Clear float entries
                Toast.show({ type: "success", text1: t("float_cleared_success") });
              } else {
                await clearGeneralInventory(); // Clear general inventory
                Toast.show({ type: "success", text1: t("inventory_cleared_success") });
              }
              loadData(); // Reload to show empty list
              console.log(
                "InventoryScreen: All data cleared and UI reloaded."
              );
            } catch (error) {
              console.error(
                "InventoryScreen: Error clearing all data:",
                error
              );
              Toast.show({
                type: "error",
                text1: t("clear_error"),
              });
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemDetails}>
        {/* Dynamic Item/Network Name */}
        <Text style={styles.itemName}>
          {isMobileMoneyAgent ? t("network_name") : t("item_name")}:{" "}
          {item.itemName}
        </Text>
        {/* Dynamic Stock/Float */}
        <Text style={styles.itemStock}>
          {isMobileMoneyAgent ? t("current_float") : t("current_stock")}:{" "}
          {item.currentStock.toLocaleString()} {/* Format number */}
        </Text>
        {/* Dynamic Cost Price/Initial Float Value */}
        <Text style={styles.itemPrice}>
          {isMobileMoneyAgent ? t("initial_float_value") : t("cost_price")}: UGX{" "}
          {(item.costPricePerUnit || 0).toLocaleString()}
        </Text>
        {/* Dynamic Selling Price/Fee Per Transaction */}
        <Text style={styles.itemPrice}>
          {isMobileMoneyAgent ? t("fee_per_transaction") : t("selling_price")}:
          UGX{" "}
          {(item.sellingPricePerUnit || 0).toLocaleString()}
        </Text>
        {/* Dynamic Calculated Values for each item/network - REMOVED FOR AGENT FOR CLARITY */}
        {!isMobileMoneyAgent && ( // Only show for general shop
          <>
            <Text style={styles.itemCalculatedValue}>
              {t("item_total_cost_value")}: UGX{" "}
              {(
                (item.currentStock || 0) * (item.costPricePerUnit || 0)
              ).toLocaleString()}
            </Text>
            <Text style={styles.itemCalculatedValue}>
              {t("item_total_selling_value")}: UGX{" "}
              {(
                (item.currentStock || 0) * (item.sellingPricePerUnit || 0)
              ).toLocaleString()}
            </Text>
          </>
        )}
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() =>
            navigation.navigate(
              isMobileMoneyAgent ? "ManageFloat" : "ManageItem", // Navigate to correct management screen
              { item: item }
            )
          }
        >
          <Icon name="pencil" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteItem(item.itemName)} 
        >
          <Icon name="delete" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        {/* Dynamic Header Title */}
        <Text style={styles.headerTitle}>
          {isMobileMoneyAgent ? t("mobile_money_float") : t("inventory_title")}
        </Text>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate(isMobileMoneyAgent ? "ManageFloat" : "ManageItem")
          }
          style={styles.addButton}
        >
          <Icon name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        {/* Display Total Inventory Values for the Entire Shop/Agent */}
        <View style={styles.totalValueContainer}>
          <View style={styles.totalValueCard}>
            <Text style={styles.totalValueLabel}>
              {isMobileMoneyAgent
                ? t("total_physical_cash") // For Agent
                : t("inventory_value_cost") // For Shop
              }
            </Text>
            <Text style={styles.totalValueText}>
              UGX {totalCostValue.toLocaleString()}
            </Text>
          </View>
          <View style={styles.totalValueCard}>
            <Text style={styles.totalValueLabel}>
              {isMobileMoneyAgent
                ? t("total_e_value_float") // For Agent
                : t("inventory_value_sales") // For Shop
              }
            </Text>
            <Text style={styles.totalValueText}>
              UGX {totalSalesValue.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Clear All History Button - Only show if there are items and not loading */}
        {!loading && displayedItems.length > 0 && (
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={handleClearAll} // Renamed to handleClearAll
          >
            <Text style={styles.clearAllButtonText}>
              {isMobileMoneyAgent
                ? t("clear_float_history")
                : t("clear_inventory_button")}
            </Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#007bff"
            style={styles.loadingIndicator}
          />
        ) : displayedItems.length === 0 ? (
          <Text style={styles.noDataText}>
            {isMobileMoneyAgent
              ? t("no_networks_added")
              : t("no_inventory_items")}
          </Text>
        ) : (
          <FlatList
            data={displayedItems} // Use displayedItems
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            style={styles.fullWidthList}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6f6f6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    backgroundColor: "#ffc107",
    borderBottomWidth: 1,
    borderBottomColor: "#e0a800",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  backButton: {
    position: "absolute",
    left: 20,
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  addButton: {
    position: "absolute",
    right: 20,
    padding: 5,
  },
  container: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: "stretch",
  },
  totalValueContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 15,
    marginTop: 5,
  },
  totalValueCard: {
    backgroundColor: "#d1ecf1",
    borderRadius: 10,
    padding: 15,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  totalValueLabel: {
    fontSize: 14,
    color: "#0c5460",
    marginBottom: 5,
    fontWeight: "bold",
  },
  totalValueText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007bff",
  },
  clearAllButton: {
    backgroundColor: "#dc3545",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  clearAllButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingIndicator: {
    marginTop: 50,
  },
  fullWidthList: {
    width: "100%",
  },
  listContent: {
    flexGrow: 1,
  },
  itemCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  itemDetails: {
    flex: 1,
    paddingRight: 10,
  },
  itemName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  itemStock: {
    fontSize: 15,
    color: "#555",
    marginTop: 2,
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 14,
    color: "#777",
    marginTop: 2,
  },
  itemCalculatedValue: {
    fontSize: 14,
    color: "#343a40",
    marginTop: 4,
    fontWeight: "500",
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 15,
  },
  editButton: {
    backgroundColor: "#28a745",
    padding: 8,
    borderRadius: 5,
    marginLeft: 10,
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    padding: 8,
    borderRadius: 5,
    marginLeft: 10,
  },
  noDataText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 50,
  },
});
