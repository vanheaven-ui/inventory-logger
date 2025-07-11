import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useLanguage } from "../context/LanguageContext";
import {
  getFloatEntries,
  saveFloatEntry,
  updateFloatEntry,
  deleteFloatEntry,
  getPhysicalCash,
  savePhysicalCash,
  // NEW: Import the MIN_PHYSICAL_CASH_REQUIRED for display purposes
  MIN_PHYSICAL_CASH_REQUIRED,
  // MIN_FLOAT_REQUIRED_PER_NETWORK, // You might want to import this if you plan to display it
  // clearAllStorage // <-- For testing purposes, uncomment if needed
} from "../storage/transactionStorage";

export default function ManageFloatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useLanguage();

  const [floatEntries, setFloatEntries] = useState([]); // This will be for E-Value/Mobile Money floats
  const [totalPhysicalCash, setTotalPhysicalCash] = useState(0); // Dedicated state for physical cash
  const [totalEValueFloat, setTotalEValueFloat] = useState(0); // Calculated total for mobile money floats

  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false); // For adding/editing E-Value floats

  // State for the dedicated physical cash input modal
  const [isPhysicalCashModalVisible, setIsPhysicalCashModalVisible] =
    useState(false);
  const [physicalCashInput, setPhysicalCashInput] = useState("");

  const [currentItem, setCurrentItem] = useState(null); // Null for new, object for edit E-Value float

  // Form states for general E-Value float modal
  const [networkName, setNetworkName] = useState("");
  const [currentFloatAmount, setCurrentFloatAmount] = useState("");

  // This effect runs when navigating from TransactionForm to pre-fill network name
  // This is specifically for E-Value floats now.
  React.useEffect(() => {
    if (route.params?.item?.itemName) {
      setNetworkName(route.params.item.itemName);
      setCurrentFloatAmount(route.params.item.currentStock?.toString() || "");
      setIsModalVisible(true); // Open general float modal
      navigation.setParams({ item: undefined }); // Clear params after use
    }
  }, [
    route.params?.item?.itemName,
    route.params?.item?.currentStock,
    navigation,
  ]);

  const loadAllFloatData = useCallback(async () => {
    setLoading(true);
    try {
      // Load E-Value Float Entries
      const storedEntries = await getFloatEntries();
      setFloatEntries(storedEntries || []);

      // Calculate Total E-Value Float
      const calculatedEValueFloat = storedEntries.reduce(
        (sum, entry) => sum + (entry.currentStock || 0),
        0
      );
      setTotalEValueFloat(calculatedEValueFloat);
      console.log(
        "ManageFloatScreen: Loaded E-Value float entries:",
        storedEntries
      );

      // Load Physical Cash
      const storedPhysicalCash = await getPhysicalCash();
      setTotalPhysicalCash(storedPhysicalCash);
      console.log(
        "ManageFloatScreen: Loaded Physical Cash:",
        storedPhysicalCash
      );

      // --- MODIFIED LOGIC FOR PHYSICAL CASH ---
      // Show modal if physical cash is zero or below the minimum required
      if (storedPhysicalCash < MIN_PHYSICAL_CASH_REQUIRED) {
        setIsPhysicalCashModalVisible(true);
        // Pre-fill input if there's some cash, otherwise keep it empty for new entry
        setPhysicalCashInput(
          storedPhysicalCash > 0 ? storedPhysicalCash.toString() : ""
        );
        Toast.show({
          type: "info",
          text1: t("physical_cash_low_title"), // New translation key
          text2: t("physical_cash_low_message", {
            minCash: MIN_PHYSICAL_CASH_REQUIRED.toLocaleString(),
          }), // New translation key
          visibilityTime: 6000,
        });
      } else {
        setIsPhysicalCashModalVisible(false); // Ensure modal is closed if cash meets requirement
      }
      // --- END MODIFIED LOGIC ---
    } catch (error) {
      console.error("ManageFloatScreen: Error loading all float data:", error);
      Toast.show({
        type: "error",
        text1: t("error_loading_float_data"),
      });
    } finally {
      setLoading(false);
    }
  }, [t]); // Added t as a dependency for useCallback

  useFocusEffect(
    useCallback(() => {
      // Uncomment for testing to clear all data
      // clearAllStorage();
      loadAllFloatData();
      return () => {
        // Optional cleanup
      };
    }, [loadAllFloatData])
  );

  // --- Handlers for E-Value (Mobile Money) Floats ---
  const handleAddEditFloat = (item = null) => {
    setCurrentItem(item);
    if (item) {
      setNetworkName(item.itemName);
      setCurrentFloatAmount(item.currentStock.toString());
    } else {
      setNetworkName("");
      setCurrentFloatAmount("");
    }
    setIsModalVisible(true);
  };

  const handleSaveEValueFloat = async () => {
    if (!networkName.trim()) {
      Toast.show({ type: "error", text1: t("float_network_name_required") });
      return;
    }
    const parsedFloatAmount = parseFloat(currentFloatAmount);
    if (isNaN(parsedFloatAmount) || parsedFloatAmount < 0) {
      Toast.show({ type: "error", text1: t("valid_float_amount_required") });
      return;
    }

    setLoading(true);
    try {
      const floatData = {
        itemName: networkName.trim(),
        currentStock: parsedFloatAmount,
      };

      if (currentItem) {
        await updateFloatEntry(floatData);
        Toast.show({
          type: "success",
          text1: t("e_value_float_updated_success"),
        });
      } else {
        await saveFloatEntry(floatData);
        Toast.show({
          type: "success",
          text1: t("e_value_float_added_success"),
        });
      }
      setIsModalVisible(false);
      loadAllFloatData(); // Reload all data to update totals
    } catch (error) {
      console.error(
        "ManageFloatScreen: Error saving E-Value float entry:",
        error
      );
      Toast.show({
        type: "error",
        text1: t("error_saving_e_value_float_entry"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEValueFloat = (itemToDelete) => {
    Alert.alert(
      t("confirm_delete_float_title"),
      t("confirm_delete_float_message", { itemName: itemToDelete.itemName }),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await deleteFloatEntry(itemToDelete.itemName);
              Toast.show({
                type: "success",
                text1: t("e_value_float_deleted_success"),
              });
              loadAllFloatData(); // Reload all data to update totals
            } catch (error) {
              console.error(
                "ManageFloatScreen: Error deleting E-Value float entry:",
                error
              );
              Toast.show({
                type: "error",
                text1: t("error_deleting_e_value_float_entry"),
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // --- Handlers for Physical Cash ---
  const handleSavePhysicalCash = async () => {
    const parsedCash = parseFloat(physicalCashInput);
    if (isNaN(parsedCash) || parsedCash < 0) {
      Toast.show({ type: "error", text1: t("valid_cash_amount_required") });
      return;
    }

    setLoading(true);
    try {
      await savePhysicalCash(parsedCash);
      Toast.show({
        type: "success",
        text1: t("physical_cash_updated_success"),
      });
      setIsPhysicalCashModalVisible(false);
      loadAllFloatData(); // Reload to update displayed physical cash and re-evaluate minimum
    } catch (error) {
      console.error("ManageFloatScreen: Error saving physical cash:", error);
      Toast.show({
        type: "error",
        text1: t("error_saving_physical_cash"),
      });
    } finally {
      setLoading(false);
    }
  };

  const renderFloatItem = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>
          {t("network")}: {item.itemName}
        </Text>
        <Text style={styles.itemStock}>
          {t("current_e_value_float")}: {item.currentStock.toLocaleString()} UGX
        </Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleAddEditFloat(item)}
        >
          <Ionicons name="pencil" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteEValueFloat(item)}
        >
          <Ionicons name="trash" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("manage_float")}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleAddEditFloat()}
        >
          <Ionicons name="add-circle" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        {/* Display Total Values */}
        <View style={styles.totalValueContainer}>
          <View style={styles.totalValueCard}>
            <Text style={styles.totalValueLabel}>
              {t("total_physical_cash")}
            </Text>
            <Text style={styles.totalValueText}>
              UGX {totalPhysicalCash.toLocaleString()}
            </Text>
            {/* Display warning if physical cash is below minimum */}
            {totalPhysicalCash < MIN_PHYSICAL_CASH_REQUIRED && (
              <Text style={styles.warningText}>
                {t("below_minimum_cash", {
                  minCash: MIN_PHYSICAL_CASH_REQUIRED.toLocaleString(),
                })}
              </Text>
            )}
            <TouchableOpacity
              onPress={() => {
                setPhysicalCashInput(totalPhysicalCash.toString()); // Pre-fill with current cash
                setIsPhysicalCashModalVisible(true);
              }}
              style={styles.editCashButton}
            >
              <Ionicons name="cash-outline" size={20} color="#007bff" />
              <Text style={styles.editCashButtonText}>{t("edit_cash")}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.totalValueCard}>
            <Text style={styles.totalValueLabel}>
              {t("total_e_value_float")}
            </Text>
            <Text style={styles.totalValueText}>
              UGX {totalEValueFloat.toLocaleString()}
            </Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#007bff"
            style={styles.loadingIndicator}
          />
        ) : floatEntries.length === 0 ? (
          <Text style={styles.noDataText}>{t("no_float_networks_added")}</Text>
        ) : (
          <FlatList
            data={floatEntries}
            keyExtractor={(item) => item.itemName} // Using itemName as key, assuming it's unique
            renderItem={renderFloatItem}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* Modal for adding/editing E-Value float */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {currentItem ? t("edit_e_value_float") : t("add_e_value_float")}
            </Text>
            <Text style={styles.label}>{t("network_name")}</Text>
            <TextInput
              style={styles.input}
              placeholder={t("enter_network_name")}
              value={networkName}
              onChangeText={setNetworkName}
              editable={!currentItem} // Prevent editing network name if editing existing float
            />
            <Text style={styles.label}>{t("current_float_amount")}</Text>
            <TextInput
              style={styles.input}
              placeholder={t("enter_current_float_amount")}
              keyboardType="numeric"
              value={currentFloatAmount}
              onChangeText={setCurrentFloatAmount}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.buttonText}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveEValueFloat}
              >
                <Text style={styles.buttonText}>{t("save")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal for editing Physical Cash */}
      <Modal
        visible={isPhysicalCashModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPhysicalCashModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t("set_physical_cash")}</Text>
            <Text style={styles.label}>{t("current_physical_cash")}</Text>
            <TextInput
              style={styles.input}
              placeholder={t("enter_physical_cash_amount")}
              keyboardType="numeric"
              value={physicalCashInput}
              onChangeText={setPhysicalCashInput}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsPhysicalCashModalVisible(false)}
              >
                <Text style={styles.buttonText}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSavePhysicalCash}
              >
                <Text style={styles.buttonText}>{t("save")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: "#ffc107",
    borderBottomWidth: 1,
    borderBottomColor: "#e0a800",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
  },
  addButton: {
    padding: 5,
  },
  container: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  totalValueContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
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
  warningText: {
    fontSize: 12,
    color: "#dc3545", // Red color for warning
    marginTop: 5,
    textAlign: "center",
    fontWeight: "bold",
  },
  editCashButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#e2f0f4",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  editCashButtonText: {
    color: "#007bff",
    marginLeft: 5,
    fontWeight: "bold",
  },
  loadingIndicator: {
    marginTop: 50,
  },
  noDataText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 50,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 25,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#333",
    marginBottom: 15,
    backgroundColor: "#fcfcfc",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: "#007bff",
  },
  cancelButton: {
    backgroundColor: "#6c757d",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 20, // Add some padding to the bottom of the list
  },
});
