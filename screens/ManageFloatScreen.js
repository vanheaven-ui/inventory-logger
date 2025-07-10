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
  // NEW: Import physical cash functions
  getPhysicalCash,
  savePhysicalCash,
  // clearAllStorage // <-- For testing purposes, uncomment if needed
} from "../storage/transactionStorage";

// Removed PHYSICAL_CASH_ITEM_NAME constant as it's no longer a 'float entry' type

export default function ManageFloatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useLanguage();

  const [floatEntries, setFloatEntries] = useState([]); // This will be for E-Value/Mobile Money floats
  const [totalPhysicalCash, setTotalPhysicalCash] = useState(0); // NEW: Dedicated state for physical cash
  const [totalEValueFloat, setTotalEValueFloat] = useState(0); // NEW: Calculated total for mobile money floats

  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false); // For adding/editing E-Value floats

  // NEW: State for the dedicated physical cash input modal
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

      // --- PROMPT LOGIC FOR PHYSICAL CASH ---
      if (storedPhysicalCash === 0) {
        setIsPhysicalCashModalVisible(true);
        setPhysicalCashInput(""); // Clear input field if previously typed
        Toast.show({
          type: "info",
          text1: t("physical_cash_zero_title"),
          text2: t("physical_cash_zero_message"),
          visibilityTime: 6000,
        });
      } else {
        setIsPhysicalCashModalVisible(false); // Ensure modal is closed if cash > 0
      }
      // --- END PROMPT LOGIC ---
    } catch (error) {
      console.error("ManageFloatScreen: Error loading all float data:", error);
      Toast.show({
        type: "error",
        text1: t("error_loading_float_data"),
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

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
      ],
      { cancelable: true }
    );
  };

  // --- Handlers for Physical Cash ---
  const handleSavePhysicalCash = async () => {
    const parsedAmount = parseFloat(physicalCashInput);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      Toast.show({ type: "error", text1: t("valid_cash_amount_required") });
      return;
    }

    setLoading(true);
    try {
      await savePhysicalCash(parsedAmount);
      Toast.show({
        type: "success",
        text1: t("physical_cash_updated_success"),
      });
      setIsPhysicalCashModalVisible(false);
      loadAllFloatData(); // Reload all data to update the display
    } catch (error) {
      console.error("Error saving physical cash:", error);
      Toast.show({ type: "error", text1: t("error_saving_physical_cash") });
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.itemName}</Text>
        <Text style={styles.itemStock}>
          {t("current_float")}: UGX {item.currentStock.toLocaleString()}
        </Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleAddEditFloat(item)}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteEValueFloat(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
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
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("manage_float")}</Text>
      </View>

      <View style={styles.container}>
        {/* NEW: Display Total Physical Cash & Total E-Value Float */}
        <View style={styles.totalSummaryContainer}>
          <View style={styles.totalSummaryCard}>
            <Text style={styles.totalSummaryLabel}>
              {t("total_physical_cash")}
            </Text>
            <Text style={styles.totalSummaryValue}>
              UGX {totalPhysicalCash.toLocaleString()}
            </Text>
            <TouchableOpacity
              style={styles.editPhysicalCashButton}
              onPress={() => {
                setPhysicalCashInput(totalPhysicalCash.toString());
                setIsPhysicalCashModalVisible(true);
              }}
            >
              <Ionicons name="pencil-outline" size={18} color="#007bff" />
            </TouchableOpacity>
          </View>
          <View style={styles.totalSummaryCard}>
            <Text style={styles.totalSummaryLabel}>
              {t("total_e_value_float")}
            </Text>
            <Text style={styles.totalSummaryValue}>
              UGX {totalEValueFloat.toLocaleString()}
            </Text>
          </View>
        </View>
        {/* END NEW DISPLAY */}

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#007bff"
            style={styles.loadingIndicator}
          />
        ) : floatEntries.length === 0 ? (
          <Text style={styles.noDataText}>{t("no_e_value_float_entries")}</Text>
        ) : (
          <FlatList
            data={floatEntries}
            keyExtractor={(item) => item.itemName}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            style={styles.fullWidthList}
          />
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleAddEditFloat()}
          disabled={loading}
        >
          <Ionicons name="add-circle" size={28} color="#fff" />
          <Text style={styles.addButtonText}>
            {t("add_e_value_float_entry")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add/Edit E-Value Float Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {currentItem
                ? t("edit_e_value_float_entry")
                : t("add_new_e_value_float_entry")}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("network_name")}</Text>
              <TextInput
                style={styles.input}
                placeholder={t("enter_network_name")}
                value={networkName}
                onChangeText={setNetworkName}
                editable={!currentItem}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("current_float_amount")}</Text>
              <TextInput
                style={styles.input}
                placeholder={t("enter_current_float_amount")}
                keyboardType="numeric"
                value={currentFloatAmount}
                onChangeText={setCurrentFloatAmount}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsModalVisible(false)}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveEValueFloat} // Renamed handler
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>{t("save")}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* NEW: Physical Cash Input Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isPhysicalCashModalVisible}
        onRequestClose={() => {
          // Allow closing if loading or if physical cash is now greater than 0
          if (loading || totalPhysicalCash > 0) {
            setIsPhysicalCashModalVisible(false);
          } else {
            Toast.show({
              type: "info",
              text1: t("please_enter_physical_cash_to_proceed"),
            });
          }
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("update_physical_cash")}</Text>
            <Text style={styles.modalSubtitle}>
              {t("physical_cash_explanation")}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("physical_cash_amount")}</Text>
              <TextInput
                style={styles.input}
                placeholder={t("enter_cash_amount")}
                keyboardType="numeric"
                value={physicalCashInput}
                onChangeText={setPhysicalCashInput}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSavePhysicalCash}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>{t("save")}</Text>
                )}
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
    backgroundColor: "#f0f2f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: "#17a2b8",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    textAlign: "center",
    marginRight: 34,
  },
  container: {
    flex: 1,
    padding: 15,
    alignItems: "center",
  },
  // NEW: Styles for the total summary section
  totalSummaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  totalSummaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 15,
    flex: 1,
    marginHorizontal: 5,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    alignItems: "center",
    justifyContent: "center",
    position: "relative", // For the edit button
  },
  totalSummaryLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
    textAlign: "center",
  },
  totalSummaryValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  editPhysicalCashButton: {
    position: "absolute",
    top: 5,
    right: 5,
    padding: 5,
  },
  // END NEW SUMMARY STYLES
  loadingIndicator: {
    marginTop: 50,
  },
  // Updated text for clarity
  noDataText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 50,
  },
  fullWidthList: {
    width: "100%",
    marginTop: 10, // Add some space below the summary cards
  },
  listContent: {
    paddingBottom: 80,
  },
  itemCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderLeftWidth: 5,
    borderLeftColor: "#28a745",
  },
  itemDetails: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  itemStock: {
    fontSize: 16,
    color: "#555",
    marginTop: 5,
  },
  itemPrices: {
    fontSize: 14,
    color: "#777",
    marginTop: 3,
  },
  itemActions: {
    flexDirection: "row",
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#ffc107",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    position: "absolute",
    bottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 25,
    width: "90%",
    maxWidth: 400,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 5,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#f9f9f9",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#6c757d",
  },
  saveButton: {
    backgroundColor: "#28a745",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
