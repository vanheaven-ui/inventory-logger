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
  // Add StatusBar here for direct use, or rely on FocusAwareStatusBar
  // StatusBar, // You don't need to import StatusBar directly if you're using FocusAwareStatusBar
  Platform, // Import Platform for Android-specific status bar background
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useLanguage } from "../context/LanguageContext";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  getGeneralInventoryItems,
  deleteGeneralInventoryItem,
  clearGeneralInventory,
  getFloatEntries,
  deleteFloatEntry,
  clearFloatEntries,
  getPhysicalCash,
} from "../storage/dataStorage";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";

import FocusAwareStatusBar from "../components/FocusAwareStatusBar"; 

// Key for AsyncStorage (to get agent status)
const IS_AGENT_KEY = "isMobileMoneyAgent";

export default function InventoryScreen() {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const [displayedItems, setDisplayedItems] = useState([]);
  const [totalCostValue, setTotalCostValue] = useState(0);
  const [totalSalesValue, setTotalSalesValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isMobileMoneyAgent, setIsMobileMoneyAgent] = useState(false);

  // Load agent status from AsyncStorage
  const loadAgentStatus = useCallback(async () => {
    try {
      const storedStatus = await AsyncStorage.getItem(IS_AGENT_KEY);
      if (storedStatus !== null) {
        setIsMobileMoneyAgent(JSON.parse(storedStatus));
      } else {
        setIsMobileMoneyAgent(false);
      }
    } catch (error) {
      console.error("InventoryScreen: Failed to load agent status:", error);
    }
  }, []);

  const loadData = useCallback(async () => {
    console.log("InventoryScreen: Starting loadData...");
    setLoading(true);
    try {
      let items = [];
      let calculatedTotalSales = 0;
      let calculatedTotalCost = 0;

      if (isMobileMoneyAgent) {
        items = await getFloatEntries();
        const physicalCash = await getPhysicalCash();
        setTotalCostValue(physicalCash);
        calculatedTotalCost = physicalCash;
        console.log("InventoryScreen: Loaded float entries:", items);
        console.log("InventoryScreen: Loaded Physical Cash:", physicalCash);

        items.forEach((item) => {
          calculatedTotalSales += item.currentStock || 0;
        });
        setTotalSalesValue(calculatedTotalSales);
      } else {
        items = await getGeneralInventoryItems();
        console.log("InventoryScreen: Loaded general inventory items:", items);

        items.forEach((item) => {
          calculatedTotalCost +=
            (item.currentStock || 0) * (item.costPricePerUnit || 0);
          calculatedTotalSales +=
            (item.currentStock || 0) * (item.sellingPricePerUnit || 0);
        });
        setTotalCostValue(calculatedTotalCost);
        setTotalSalesValue(calculatedTotalSales);
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
      setDisplayedItems(sortedItems);
      console.log("InventoryScreen: Processed and sorted items set.");

      console.log(
        `InventoryScreen: Total Cost Value: UGX ${calculatedTotalCost.toLocaleString()}, Total Sales Value: UGX ${calculatedTotalSales.toLocaleString()}`
      );
    } catch (error) {
      console.error("InventoryScreen: Error loading data:", error);
      Toast.show({
        type: "error",
        text1: t("error_loading_inventory"),
      });
    } finally {
      setLoading(false);
      console.log("InventoryScreen: Finished loadData.");
    }
  }, [t, isMobileMoneyAgent]);

  useFocusEffect(
    useCallback(() => {
      loadAgentStatus();
      loadData();
      return () => {};
    }, [loadAgentStatus, loadData])
  );

  const handleDeleteItem = async (itemName) => {
    console.log(
      `InventoryScreen: Attempting to delete item with Name: ${itemName}`
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
                `InventoryScreen: Confirmed delete for Name: ${itemName}`
              );
              if (isMobileMoneyAgent) {
                await deleteFloatEntry(itemName);
              } else {
                await deleteGeneralInventoryItem(itemName);
              }
              Toast.show({
                type: "success",
                text1: t("item_deleted"),
              });
              loadData();
              console.log("InventoryScreen: loadData called after delete.");
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

  const handleClearAll = () => {
    console.log("InventoryScreen: Initiating clear all process.");
    Alert.alert(
      isMobileMoneyAgent
        ? t("confirm_clear_float_title")
        : t("confirm_clear_inventory_title"),
      isMobileMoneyAgent
        ? t("confirm_clear_float_message")
        : t("confirm_clear_inventory_message"),
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
              console.log("InventoryScreen: User confirmed clearing all.");
              if (isMobileMoneyAgent) {
                await clearFloatEntries();
                Toast.show({
                  type: "success",
                  text1: t("float_cleared_success"),
                });
              } else {
                await clearGeneralInventory();
                Toast.show({
                  type: "success",
                  text1: t("inventory_cleared_success"),
                });
              }
              loadData();
              console.log("InventoryScreen: All data cleared and UI reloaded.");
            } catch (error) {
              console.error("InventoryScreen: Error clearing all data:", error);
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
        <Text style={styles.itemName}>
          {isMobileMoneyAgent ? t("network_name") : t("item_name")}:{" "}
          {item.itemName}
        </Text>
        <Text style={styles.itemStock}>
          {isMobileMoneyAgent ? t("current_float") : t("current_stock")}:{" "}
          {item.currentStock.toLocaleString()}
        </Text>
        <Text style={styles.itemPrice}>
          {isMobileMoneyAgent
            ? t("physical_cash_allocated_to_float")
            : t("cost_price")}
          : UGX {(item.costPricePerUnit || 0).toLocaleString()}
        </Text>
        <Text style={styles.itemPrice}>
          {isMobileMoneyAgent ? t("fee_per_transaction") : t("selling_price")}:
          UGX {(item.sellingPricePerUnit || 0).toLocaleString()}
        </Text>
        {!isMobileMoneyAgent && (
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
              isMobileMoneyAgent ? "ManageFloat" : "ManageItem",
              { itemToEdit: item }
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

  // Determine header color based on agent status
  const headerBackgroundColor = isMobileMoneyAgent ? "#17a2b8" : "#ffc107"; // Blue for agent, orange for shop

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: headerBackgroundColor }]}
    >
      {/* Conditionally set StatusBar based on header color */}
      <FocusAwareStatusBar
        backgroundColor={headerBackgroundColor} // Set background color to match header
        barStyle="light-content" // Set content (text, icons) to white
        animated={true}
      />

      <View style={[styles.header, { backgroundColor: headerBackgroundColor }]}>
        <Text style={styles.headerTitle}>
          {isMobileMoneyAgent ? t("mobile_money_float") : t("inventory_title")}
        </Text>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate(
              isMobileMoneyAgent ? "ManageFloat" : "ManageItem"
            )
          }
          style={styles.addButton}
        >
          <Icon name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <View style={styles.totalValueContainer}>
          <View style={styles.totalValueCard}>
            <Text style={styles.totalValueLabel}>
              {isMobileMoneyAgent
                ? t("total_physical_cash")
                : t("inventory_value_cost")}
            </Text>
            <Text style={styles.totalValueText}>
              UGX {totalCostValue.toLocaleString()}
            </Text>
          </View>
          <View style={styles.totalValueCard}>
            <Text style={styles.totalValueLabel}>
              {isMobileMoneyAgent
                ? t("total_e_value_float")
                : t("inventory_value_sales")}
            </Text>
            <Text style={styles.totalValueText}>
              UGX {totalSalesValue.toLocaleString()}
            </Text>
          </View>
        </View>

        {!loading && displayedItems.length > 0 && (
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={handleClearAll}
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
            data={displayedItems}
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
    backgroundColor: "#f6f6f6", // This will be overridden by the inline style in JSX for the header background
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    backgroundColor: "#ffc107", // Default, will be overridden by inline style based on agent status
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
