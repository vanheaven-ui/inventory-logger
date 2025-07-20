import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import TransactionForm from "../components/TransactionForm";
import { useLanguage } from "../context/LanguageContext";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import your specific data storage functions
import {
  getPhysicalCash,
  savePhysicalCash,
  getFloatEntries,
  saveFloatEntry,
  getGeneralInventoryItems,
  saveGeneralInventoryItem,
  saveTransaction,
  calculateCommission,
  getCommissionEarnings,
  saveCommissionEarnings,
} from "../storage/dataStorage";
import FocusAwareStatusBar from "../components/FocusAwareStatusBar";

const IS_AGENT_KEY = "isMobileMoneyAgent";

export default function TransactionScreen({ route }) {
  const { type } = route.params; // 'sell' or 'restock'
  const { t } = useLanguage();
  const navigation = useNavigation();

  // --- State for TransactionScreen ---
  const [isMobileMoneyAgent, setIsMobileMoneyAgent] = useState(false);
  const [loadingAgentStatus, setLoadingAgentStatus] = useState(true);

  // Form Field States
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");

  const [mmNetworkName, setMmNetworkName] = useState("");
  const [mmAmount, setMmAmount] = useState("");

  // Balance/Quantity Info States (derived from storage)
  const [currentPhysicalCash, setCurrentPhysicalCash] = useState(0);
  const [availableFloat, setAvailableFloat] = useState(0); // Float for the selected MM network
  const [availableQuantity, setAvailableQuantity] = useState(0); // Quantity for the selected product

  // --- New state for existence checks and product details ---
  const [productFound, setProductFound] = useState(false);
  const [networkFound, setNetworkFound] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null); // Stores the full product object

  // Validation Errors
  const [validationErrors, setValidationErrors] = useState({});

  // --- Data Loading from AsyncStorage and your dataStorage.js ---

  const loadAgentStatus = useCallback(async () => {
    try {
      setLoadingAgentStatus(true);
      const storedStatus = await AsyncStorage.getItem(IS_AGENT_KEY);
      if (storedStatus !== null) {
        setIsMobileMoneyAgent(JSON.parse(storedStatus));
      } else {
        setIsMobileMoneyAgent(false); // Default to false if not found
      }
    } catch (error) {
      console.error("TransactionScreen: Failed to load agent status:", error);
      setIsMobileMoneyAgent(false);
    } finally {
      setLoadingAgentStatus(false);
    }
  }, []);

  const loadBalancesAndQuantities = useCallback(async () => {
    try {
      const cash = await getPhysicalCash();
      setCurrentPhysicalCash(cash);

      if (isMobileMoneyAgent && mmNetworkName) {
        const floatEntries = await getFloatEntries();
        const networkFloat = floatEntries.find(
          (entry) =>
            entry.itemName &&
            entry.itemName.toLowerCase() === mmNetworkName.toLowerCase()
        );
        setAvailableFloat(networkFloat ? networkFloat.currentStock : 0);
        setNetworkFound(!!networkFloat); // Set to true if networkFloat was found
      } else {
        setAvailableFloat(0);
        setNetworkFound(false); // Reset if not MM agent or no network selected
      }

      if (!isMobileMoneyAgent && productName) {
        const inventoryItems = await getGeneralInventoryItems();
        const product = inventoryItems.find(
          (item) =>
            item.itemName &&
            item.itemName.toLowerCase() === productName.toLowerCase()
        );
        setAvailableQuantity(product ? product.currentStock : 0);
        setProductFound(!!product); // Set to true if product was found
        setSelectedProductDetails(product || null); // Store the full product object here
      } else {
        setAvailableQuantity(0);
        setProductFound(false); // Reset if MM agent or no product selected
        setSelectedProductDetails(null); // Reset product details
      }
    } catch (error) {
      console.error("Failed to load balances/quantities:", error);
      // On error, assume not found
      setProductFound(false);
      setNetworkFound(false);
      setSelectedProductDetails(null);
    }
  }, [isMobileMoneyAgent, productName, mmNetworkName]);

  // Effect to load agent status when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadAgentStatus();
      // Reset form fields and validation errors when screen comes into focus
      setProductName("");
      setQuantity("");
      setMmNetworkName("");
      setMmAmount("");
      setValidationErrors({});
      // Reset found status and product details
      setProductFound(false);
      setNetworkFound(false);
      setSelectedProductDetails(null); // Reset product details
    }, [loadAgentStatus])
  );

  // Effect to load balances/quantities whenever relevant state changes
  useEffect(() => {
    loadBalancesAndQuantities();
  }, [
    loadBalancesAndQuantities,
    isMobileMoneyAgent,
    productName,
    mmNetworkName,
  ]);

  // --- MODIFIED: Immediate Alert for No Physical Cash on Withdrawal Select ---
  useEffect(() => {
    let timer;
    if (isMobileMoneyAgent && type === "sell" && currentPhysicalCash === 0) {
      timer = setTimeout(() => {
        Alert.alert(
          t("no_physical_cash_title"),
          t("no_physical_cash_message"),
          [
            {
              text: t("cancel"), // Option to say no
              style: "cancel",
            },
            {
              text: t("manage_cash_now"), // Option to manage cash
              onPress: () =>
                navigation.navigate("ManageFloat", { action: "adjustCash" }),
            },
          ]
        );
      }, 100); // Small delay to ensure all state is consistent
    }
    // Cleanup function for useEffect
    return () => {
      if (timer) {
        // Only clear if timer was actually set
        clearTimeout(timer);
      }
    };
  }, [isMobileMoneyAgent, type, currentPhysicalCash, t, navigation]);

  // --- MODIFIED: Immediate Alert for Insufficient Float on Amount Entry ---
  useEffect(() => {
    let timer;
    const amount = parseFloat(mmAmount);
    if (
      isMobileMoneyAgent &&
      type === "restock" &&
      !isNaN(amount) &&
      amount > 0 && // Ensure a positive amount is entered
      mmNetworkName.trim() && // Ensure network name is entered
      amount > availableFloat
    ) {
      timer = setTimeout(() => {
        Alert.alert(
          t("insufficient_float_title"),
          t("insufficient_float_message", {
            network: mmNetworkName.trim(),
            amount: amount?.toLocaleString(),
            available: availableFloat?.toLocaleString(),
          }),
          [
            { text: t("cancel"), style: "cancel" },
            {
              text: t("manage_float_now"),
              onPress: () => navigation.navigate("ManageFloat"),
            },
          ]
        );
      }, 500); // Debounce: wait 500ms after last change before showing alert

      return () => {
        if (timer) {
          // Only clear if timer was actually set
          clearTimeout(timer);
        }
      };
    }
    return () => {
      // This catch-all return is good practice for useEffect cleanup
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [
    isMobileMoneyAgent,
    type,
    mmAmount,
    availableFloat,
    mmNetworkName,
    t,
    navigation,
  ]);

  // --- Validation and Save Logic ---

  const validateForm = () => {
    const errors = {};
    if (isMobileMoneyAgent) {
      if (!mmNetworkName.trim()) {
        errors.mmNetworkName = t("network_name_required");
      }
      if (
        !mmAmount ||
        isNaN(parseFloat(mmAmount)) ||
        parseFloat(mmAmount) <= 0
      ) {
        errors.mmAmount = t("valid_amount_required");
      }
    } else {
      // General Shop Item
      if (!productName.trim()) {
        errors.productName = t("product_name_required");
      }
      if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
        errors.quantity = t("valid_quantity_required");
      }

      // Existing stock check for 'sell'
      if (type === "sell" && parseInt(quantity) > availableQuantity) {
        if (availableQuantity === 0) {
          errors.quantity = t("out_of_stock_message", {
            product: productName.trim(),
          });
        } else {
          errors.quantity = t("not_enough_stock");
        }
      }
      // NEW: Existence check for 'restock'
      if (type === "restock" && !productFound && productName.trim()) {
        errors.productName = t("item_not_in_inventory_message", {
          product: productName.trim(),
        });
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveTransaction = async () => {
    if (!validateForm()) {
      Alert.alert(t("validation_error"), t("please_correct_errors"));
      return;
    }

    // --- NEW REDIRECTION LOGIC (UNCHANGED, but now combined with previous logic) ---
    // This logic handles non-existent items/networks at the point of saving
    // for both 'sell' and 'restock' cases now.

    // If it's a general shop item transaction
    if (!isMobileMoneyAgent) {
      // If it's a 'sell' and product is not found
      if (type === "sell" && !productFound && productName.trim()) {
        Alert.alert(
          t("product_not_found_title"),
          t("product_not_found_message", { product: productName.trim() }),
          [
            {
              text: t("cancel"),
              style: "cancel",
            },
            {
              text: t("manage_item_now"),
              onPress: () => navigation.navigate("ManageItem"),
            },
          ]
        );
        return;
      }
      // If it's a 'restock' and product is not found (NEW ADDITION HERE)
      if (type === "restock" && !productFound && productName.trim()) {
        Alert.alert(
          t("item_not_in_inventory_title"), // New translation key
          t("item_not_in_inventory_message", { product: productName.trim() }), // Existing message, new title
          [
            {
              text: t("cancel"),
              style: "cancel",
            },
            {
              text: t("manage_item_now"), // Reuse existing translation
              onPress: () =>
                navigation.navigate("ManageItem", { action: "addItem" }), // Suggest adding
            },
          ]
        );
        return;
      }
    } else {
      // If it's a mobile money agent transaction
      // If it's a 'sell' (withdrawal) and network is not found
      if (type === "sell" && !networkFound && mmNetworkName.trim()) {
        Alert.alert(
          t("network_not_found_title"),
          t("network_not_found_message", { network: mmNetworkName.trim() }),
          [
            {
              text: t("cancel"),
              style: "cancel",
            },
            {
              text: t("manage_float_now"),
              onPress: () => navigation.navigate("ManageFloat"),
            },
          ]
        );
        return;
      }
      // For 'restock' (deposit) if network not found, we use the same alert
      // as the 'sell' case, as it's about network existence.
      if (type === "restock" && !networkFound && mmNetworkName.trim()) {
        Alert.alert(
          t("network_not_found_title"),
          t("network_not_found_message", { network: mmNetworkName.trim() }),
          [
            {
              text: t("cancel"),
              style: "cancel",
            },
            {
              text: t("manage_float_now"),
              onPress: () => navigation.navigate("ManageFloat"),
            },
          ]
        );
        return;
      }
    }
    // --- END NEW REDIRECTION LOGIC ---

    // --- Check for Physical Cash for Mobile Money Withdrawals (on Save) ---
    if (isMobileMoneyAgent && type === "sell") {
      if (currentPhysicalCash === 0) {
        Alert.alert(
          t("no_physical_cash_title"),
          t("no_physical_cash_message"),
          [
            {
              text: t("cancel"),
              style: "cancel",
              onPress: () =>
                ('User cancelled "no physical cash" alert'),
            },
            {
              text: t("manage_cash_now"),
              onPress: () =>
                navigation.navigate("ManageFloat", { action: "adjustCash" }),
            },
          ]
        );
        return; // Prevent transaction if no physical cash
      }
    }
    // --- END Check ---

    // --- Check for available float for Mobile Money Deposits (on Save) ---
    if (isMobileMoneyAgent && type === "restock") {
      const amountToDeposit = parseFloat(mmAmount);
      if (amountToDeposit > availableFloat) {
        Alert.alert(
          t("insufficient_float_title"),
          t("insufficient_float_message", {
            network: mmNetworkName.trim(),
            amount: amountToDeposit?.toLocaleString(),
            available: availableFloat?.toLocaleString(),
          }),
          [
            { text: t("cancel"), style: "cancel" },
            {
              text: t("manage_float_now"),
              onPress: () => navigation.navigate("ManageFloat"),
            },
          ]
        );
        return; // Prevent transaction if insufficient float
      }
    }
    // --- END NEW CHECK ---

    let transactionData = {
      type: type, // 'sell' or 'restock'
      isMobileMoney: isMobileMoneyAgent,
    };

    if (isMobileMoneyAgent) {
      transactionData = {
        ...transactionData,
        itemName: mmNetworkName.trim(), // Renamed to itemName for consistency with dataStorage
        quantity: parseFloat(mmAmount), // Using quantity for amount in MM
        amount: parseFloat(mmAmount), // Keeping amount for clearer transaction record
      };
    } else {
      // General Shop Item
      transactionData = {
        ...transactionData,
        itemName: productName.trim(),
        quantity: parseInt(quantity),
        // Use prices from selectedProductDetails. These will be null if productFound is false,
        // but the redirection logic above should prevent this code from running in that case.
        costPrice: selectedProductDetails
          ? selectedProductDetails.costPrice
          : 0,
        sellingPrice: selectedProductDetails
          ? selectedProductDetails.sellingPrice
          : 0,
        amount:
          type === "sell"
            ? (selectedProductDetails
                ? selectedProductDetails.sellingPrice
                : 0) * parseInt(quantity)
            : (selectedProductDetails ? selectedProductDetails.costPrice : 0) *
              parseInt(quantity), // Total amount based on type
      };
    }

    try {
      // Your robust saveTransaction function handles all inventory/float/cash updates
      await saveTransaction(transactionData);

      // After successful save, refresh balances and clear form
      await loadBalancesAndQuantities(); // Refresh displayed balances
      Alert.alert(
        t("transaction_recorded"),
        isMobileMoneyAgent
          ? type === "sell" // This means it's a withdrawal
            ? t("withdrawal_recorded_successfully", {
                amount: parseFloat(mmAmount)?.toLocaleString(),
              })
            : t("deposit_recorded_successfully", {
                // This means it's a deposit
                amount: parseFloat(mmAmount)?.toLocaleString(),
              })
          : type === "sell"
          ? t("sale_recorded_successfully", {
              product: productName,
              quantity: parseInt(quantity),
            })
          : t("restock_recorded_successfully", {
              product: productName,
              quantity: parseInt(quantity),
            }),
        [{ text: t("ok"), onPress: () => navigation.goBack() }]
      );
      // Clear form fields
      setProductName("");
      setQuantity("");
      setMmNetworkName("");
      setMmAmount("");
      setValidationErrors({}); // Clear any residual errors
      setProductFound(false); // Reset found status
      setNetworkFound(false); // Reset found status
      setSelectedProductDetails(null); // Reset product details
    } catch (error) {
      console.error("TransactionScreen: Error during transaction save:", error);
      Alert.alert(t("error"), error.message || t("failed_to_save_transaction"));
    }
  };

  // --- UI Rendering ---

  const headerBackgroundColor = type === "sell" ? "#dc3545" : "#28a745"; // Red for Sell, Green for Restock

  const headerTitle = isMobileMoneyAgent
    ? type === "sell"
      ? t("record_a_withdrawal")
      : t("record_a_deposit")
    : type === "sell"
    ? t("record_a_sale")
    : t("record_a_restock");

  if (loadingAgentStatus) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>{t("loading_agent_status")}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FocusAwareStatusBar
        barStyle="light-content"
        backgroundColor={headerBackgroundColor}
      />
      <View style={[styles.header, { backgroundColor: headerBackgroundColor }]}>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
      </View>
      <KeyboardAvoidingView
        style={styles.screenContent}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          {/* Display selling and cost prices for general items here (if product is found) */}
          {!isMobileMoneyAgent && selectedProductDetails && (
            <View style={styles.balanceInfoContainer}>
              {type === "sell" && (
                <View style={styles.balanceItem}>
                  <Icon name="tag" size={24} color="#007bff" />
                  <Text style={styles.balanceLabel}>{t("selling_price")}:</Text>
                  <Text style={styles.balanceValue}>
                    UGX {selectedProductDetails.sellingPrice?.toLocaleString()}
                  </Text>
                </View>
              )}
              {type === "restock" && (
                <View style={styles.balanceItem}>
                  <Icon name="tag-outline" size={24} color="#28a745" />
                  <Text style={styles.balanceLabel}>{t("cost_price")}:</Text>
                  <Text style={styles.balanceValue}>
                    UGX {selectedProductDetails.costPrice?.toLocaleString()}
                  </Text>
                </View>
              )}
            </View>
          )}

          <TransactionForm
            isMobileMoneyAgent={isMobileMoneyAgent}
            transactionType={type} // Pass 'sell' or 'restock' directly
            // Balances
            currentPhysicalCash={currentPhysicalCash} // Still passed as it's used in TransactionForm
            availableFloat={availableFloat} // Still passed as it's used in TransactionForm
            availableQuantity={availableQuantity} // Still passed as it's used in TransactionForm
            // General Transaction States and Setters
            productName={productName}
            setProductName={setProductName}
            quantity={quantity}
            setQuantity={setQuantity}
            // Mobile Money Transaction States and Setters
            mmNetworkName={mmNetworkName}
            setMmNetworkName={setMmNetworkName}
            mmAmount={mmAmount}
            setMmAmount={setMmAmount}
            // Validation and Save
            validationErrors={validationErrors}
            handleSaveTransaction={handleSaveTransaction}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6f6f6",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f6f6f6",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#555",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.3)",
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
    flex: 1,
    textAlign: "center",
    paddingRight: 50,
    paddingLeft: 20,
  },
  backButton: {
    position: "absolute",
    left: 20,
    padding: 5,
    zIndex: 1,
  },
  screenContent: {
    flex: 1,
    paddingTop: 0,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  balanceInfoContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    marginHorizontal: 20,
    marginTop: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: "column",
    alignItems: "flex-start",
  },
  balanceItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#555",
    marginLeft: 10,
    marginRight: 5,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
});
