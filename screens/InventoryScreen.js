// screens/InventoryScreen.js
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
import { useNavigation } from "@react-navigation/native";
import { useLanguage } from "../context/LanguageContext";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  getInventory,
  deleteInventoryItem,
  clearInventory,
} from "../storage/transactionStorage"; // Import clearInventory
import Toast from "react-native-toast-message";

export default function InventoryScreen() {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const [inventoryItems, setInventoryItems] = useState([]);
  const [totalCostValue, setTotalCostValue] = useState(0);
  const [totalSalesValue, setTotalSalesValue] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadInventory = useCallback(async () => {
    console.log("InventoryScreen: Starting loadInventory...");
    setLoading(true);
    try {
      const items = await getInventory();
      console.log("InventoryScreen: Raw items loaded:", items);

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
      setInventoryItems(sortedItems);
      console.log("InventoryScreen: Processed and sorted items set.");

      let currentTotalCost = 0;
      let currentTotalSales = 0;
      sortedItems.forEach((item) => {
        currentTotalCost +=
          (item.currentStock || 0) * (item.costPricePerUnit || 0);
        currentTotalSales +=
          (item.currentStock || 0) * (item.sellingPricePerUnit || 0);
      });
      setTotalCostValue(currentTotalCost);
      setTotalSalesValue(currentTotalSales);
      console.log(
        `InventoryScreen: Total Shop Cost: UGX ${currentTotalCost.toLocaleString()}, Total Shop Sales: UGX ${currentTotalSales.toLocaleString()}`
      );
    } catch (error) {
      console.error("InventoryScreen: Error loading inventory:", error);
      Toast.show({
        type: "error",
        text1: "Error loading inventory.",
      });
    } finally {
      setLoading(false);
      console.log("InventoryScreen: Finished loadInventory.");
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      console.log(
        "InventoryScreen: Focus event detected, reloading inventory."
      );
      loadInventory();
    });

    return unsubscribe;
  }, [navigation, loadInventory]);

  const handleDeleteItem = async (itemId) => {
    console.log(
      `InventoryScreen: Attempting to delete item with ID: ${itemId}`
    );
    Alert.alert(
      t("confirm_delete"),
      "",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => console.log("Delete cancelled."),
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              console.log(
                `InventoryScreen: Confirmed delete for ID: ${itemId}`
              );
              await deleteInventoryItem(itemId);
              Toast.show({
                type: "success",
                text1: t("item_deleted"),
              });
              loadInventory();
              console.log(
                "InventoryScreen: loadInventory called after delete."
              );
            } catch (error) {
              console.error("InventoryScreen: Error deleting item:", error);
              Toast.show({
                type: "error",
                text1: "Error deleting item.",
              });
            }
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  const handleClearAllInventory = () => {
    console.log("InventoryScreen: Initiating clear all inventory process.");
    Alert.alert(
      t("confirm_clear_inventory_title"),
      t("confirm_clear_inventory_message"),
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            console.log("Clear all inventory cancelled.");
            Toast.show({ type: "info", text1: t("clear_inventory_cancelled") });
          },
        },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              console.log(
                "InventoryScreen: User confirmed clearing all inventory."
              );
              await clearInventory(); // Call the clearInventory function
              Toast.show({
                type: "success",
                text1: t("inventory_cleared_success"),
              });
              loadInventory(); // Reload to show empty inventory
              console.log(
                "InventoryScreen: All inventory cleared and UI reloaded."
              );
            } catch (error) {
              console.error(
                "InventoryScreen: Error clearing all inventory:",
                error
              );
              Toast.show({
                type: "error",
                text1: t("inventory_cleared_error"),
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
        <Text style={styles.itemName}>{item.itemName}</Text>
        <Text style={styles.itemStock}>
          {t("current_stock")}: {item.currentStock}
        </Text>
        <Text style={styles.itemPrice}>
          {t("cost_price")}: UGX{" "}
          {item.costPricePerUnit ? item.costPricePerUnit.toLocaleString() : "0"}
        </Text>
        <Text style={styles.itemPrice}>
          {t("selling_price")}: UGX{" "}
          {item.sellingPricePerUnit
            ? item.sellingPricePerUnit.toLocaleString()
            : "0"}
        </Text>
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
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate("ManageItem", { item: item })}
        >
          <Icon name="pencil" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteItem(item.id)}
        >
          <Icon name="delete" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("inventory_title")}</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("ManageItem")}
          style={styles.addButton}
        >
          <Icon name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        {/* Display Total Inventory Values for the Entire Shop */}
        <View style={styles.totalValueContainer}>
          <View style={styles.totalValueCard}>
            <Text style={styles.totalValueLabel}>
              {t("inventory_value_cost")}
            </Text>
            <Text style={styles.totalValueText}>
              UGX {totalCostValue.toLocaleString()}
            </Text>
          </View>
          <View style={styles.totalValueCard}>
            <Text style={styles.totalValueLabel}>
              {t("inventory_value_sales")}
            </Text>
            <Text style={styles.totalValueText}>
              UGX {totalSalesValue.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Clear All Inventory Button - Only show if there are items and not loading */}
        {!loading && inventoryItems.length > 0 && (
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={handleClearAllInventory}
          >
            <Text style={styles.clearAllButtonText}>
              {t("clear_inventory_button")}
            </Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#007bff"
            style={styles.loadingIndicator}
          />
        ) : inventoryItems.length === 0 ? (
          <Text style={styles.noDataText}>{t("no_inventory_items")}</Text>
        ) : (
          <FlatList
            data={inventoryItems}
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
