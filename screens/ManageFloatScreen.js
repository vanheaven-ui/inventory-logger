import React, {
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
} from "react";
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
import Icon from "react-native-vector-icons/MaterialCommunityIcons"; // For mic icon
import Toast from "react-native-toast-message";
import { useLanguage } from "../context/LanguageContext"; // Your LanguageContext
import {
  getFloatEntries,
  saveFloatEntry,
  updateFloatEntry,
  deleteFloatEntry,
  getPhysicalCash,
  savePhysicalCash,
  MIN_PHYSICAL_CASH_REQUIRED,
  // clearAllStorage // <-- For testing purposes, uncomment if needed
} from "../storage/dataStorage";

import FocusAwareStatusBar from "../components/FocusAwareStatusBar";
import useVoiceRecognition from "../hooks/useVoiceRecognition";

export default function ManageFloatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { t, language } = useLanguage(); // Get language from context

  // Voice Recognition Hook
  const {
    recognizedText,
    partialResults,
    isListening,
    error: voiceError,
    startListening,
    stopListening,
    cancelListening,
    setRecognizedText,
  } = useVoiceRecognition();

  const [floatEntries, setFloatEntries] = useState([]); // E-Value/Mobile Money floats
  const [totalPhysicalCash, setTotalPhysicalCash] = useState(0);
  const [totalEValueFloat, setTotalEValueFloat] = useState(0);

  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false); // For adding/editing E-Value floats
  const [isPhysicalCashModalVisible, setIsPhysicalCashModalVisible] =
    useState(false);

  const [currentItem, setCurrentItem] = useState(null); // Null for new, object for edit E-Value float
  const [networkName, setNetworkName] = useState("");
  const [currentFloatAmount, setCurrentFloatAmount] = useState("");
  const [physicalCashInput, setPhysicalCashInput] = useState("");

  const [activeInput, setActiveInput] = useState(null);

  // Use a ref to store the locale for speech recognition
  const speechRecognizerLocale = React.useRef(language);

  // Update locale ref if language changes
  useEffect(() => {
    speechRecognizerLocale.current = language;
  }, [language]);

  // --- Header Configuration with React Navigation ---
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t("manage_float"),
      headerShown: true,
      headerStyle: {
        backgroundColor: "#ffc107", // Matching your previous custom header's color
      },
      headerTintColor: "#fff", // White color for title and back arrow
      headerBackTitleVisible: false,
      headerRight: () => (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleAddEditFloat()}
        >
          <Ionicons name="add-circle" size={30} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, t]);

  // Effect to apply recognized text to the active input field
  useEffect(() => {
    if (recognizedText && activeInput) {
      if (activeInput === "networkName") {
        setNetworkName(recognizedText);
      } else if (activeInput === "currentFloatAmount") {
        // Attempt to parse number, but voice recognition for numbers can be tricky
        const parsed = parseFloat(recognizedText.replace(/,/g, "")); // Remove commas before parsing
        if (!isNaN(parsed)) {
          setCurrentFloatAmount(String(parsed));
        } else {
          Toast.show({
            type: "info",
            text1: t("voice_input_note"),
            text2: t("could_not_parse_number", { text: recognizedText }),
          });
        }
      } else if (activeInput === "physicalCashInput") {
        // Attempt to parse number for physical cash
        const parsed = parseFloat(recognizedText.replace(/,/g, ""));
        if (!isNaN(parsed)) {
          setPhysicalCashInput(String(parsed));
        } else {
          Toast.show({
            type: "info",
            text1: t("voice_input_note"),
            text2: t("could_not_parse_number", { text: recognizedText }),
          });
        }
      }
      setRecognizedText(""); // Clear the recognized text after applying it
      stopListening(); // Stop listening after applying text
      setActiveInput(null); // Clear active input
    }
    // If listening stops for any reason (user stops, error), clear active input
    if (!isListening && activeInput) {
      setActiveInput(null);
    }
  }, [
    recognizedText,
    activeInput,
    isListening,
    setRecognizedText,
    stopListening,
    t,
  ]);

  // Effect to show voice recognition errors
  useEffect(() => {
    if (voiceError) {
      Toast.show({
        type: "error",
        text1: t("voice_input_error"),
        text2: voiceError,
      });
      // Consider adding a way to clear voiceError state in the hook if needed
    }
  }, [voiceError, t]);

  // Handle microphone button press
  const handleMicPress = (inputField) => {
    if (isListening && activeInput === inputField) {
      cancelListening(); // Stop listening if already active for this field
      setActiveInput(null);
    } else {
      cancelListening(); // Cancel any existing listening session
      setActiveInput(inputField);
      startListening(speechRecognizerLocale.current); // Pass the current locale to the hook
    }
  };

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
      const storedEntries = await getFloatEntries();
      setFloatEntries(storedEntries || []);

      const calculatedEValueFloat = storedEntries.reduce(
        (sum, entry) => sum + (entry.currentStock || 0),
        0
      );
      setTotalEValueFloat(calculatedEValueFloat);

      const storedPhysicalCash = await getPhysicalCash();
      setTotalPhysicalCash(storedPhysicalCash);

      if (storedPhysicalCash < MIN_PHYSICAL_CASH_REQUIRED) {
        setIsPhysicalCashModalVisible(true);
        setPhysicalCashInput(
          storedPhysicalCash > 0 ? storedPhysicalCash.toString() : ""
        );
        Toast.show({
          type: "info",
          text1: t("physical_cash_low_title"),
          text2: t("physical_cash_low_message", {
            minCash: MIN_PHYSICAL_CASH_REQUIRED.toLocaleString(),
          }),
          visibilityTime: 6000,
        });
      } else {
        setIsPhysicalCashModalVisible(false);
      }
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
      // clearAllStorage(); // Uncomment for testing to clear all data
      loadAllFloatData();
      return () => {
        // Optional cleanup
        cancelListening(); // Ensure listening is stopped when leaving the screen
      };
    }, [loadAllFloatData, cancelListening])
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

  // Helper to render voice input button with text
  const renderVoiceInputButtonWithText = (fieldKey, placeholderTextKey) => (
    <TouchableOpacity
      style={[
        styles.micButton,
        isListening && activeInput === fieldKey && styles.micButtonActive,
      ]}
      onPress={() => handleMicPress(fieldKey)}
    >
      {isListening && activeInput === fieldKey ? (
        <ActivityIndicator size="small" color="red" />
      ) : (
        <Icon name="microphone-outline" size={24} color="#666" />
      )}
      <Text style={styles.micButtonText}>
        {isListening && activeInput === fieldKey
          ? t("listening")
          : t(placeholderTextKey)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* FocusAwareStatusBar */}
      <FocusAwareStatusBar
        backgroundColor="#ffc107" // Matching React Navigation header background
        barStyle="light-content" // Changed to light-content for better contrast with a light background header
        animated={true}
      />

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

        {loading || isListening ? ( // Combine loading and listening for ActivityIndicator
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
            keyExtractor={(item) => item.itemName}
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
        onRequestClose={() => {
          setIsModalVisible(false);
          cancelListening(); // Stop listening if modal is closed
        }}
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
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={t("enter_network_name")}
                value={networkName}
                onChangeText={setNetworkName}
                editable={!currentItem} // Prevent editing network name if editing existing float
                onFocus={() => setActiveInput("networkName")}
                onBlur={() => setActiveInput(null)}
              />
              {renderVoiceInputButtonWithText(
                "networkName",
                "speak_network_name"
              )}
            </View>

            <Text style={styles.label}>{t("current_float_amount")}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={t("enter_current_float_amount")}
                keyboardType="numeric"
                value={currentFloatAmount}
                onChangeText={setCurrentFloatAmount}
                onFocus={() => setActiveInput("currentFloatAmount")}
                onBlur={() => setActiveInput(null)}
              />
              {renderVoiceInputButtonWithText(
                "currentFloatAmount",
                "speak_amount"
              )}
            </View>

            {/* Partial results for modal inputs */}
            {isListening && partialResults.length > 0 && activeInput && (
              <Text style={styles.partialText}>
                {t("listening")} {partialResults[0]}...
              </Text>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setIsModalVisible(false);
                  cancelListening();
                }}
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
        onRequestClose={() => {
          setIsPhysicalCashModalVisible(false);
          cancelListening(); // Stop listening if modal is closed
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t("set_physical_cash")}</Text>
            <Text style={styles.label}>{t("current_physical_cash")}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={t("enter_physical_cash_amount")}
                keyboardType="numeric"
                value={physicalCashInput}
                onChangeText={setPhysicalCashInput}
                onFocus={() => setActiveInput("physicalCashInput")}
                onBlur={() => setActiveInput(null)}
              />
              {renderVoiceInputButtonWithText(
                "physicalCashInput",
                "speak_amount"
              )}
            </View>

            {/* Partial results for modal inputs */}
            {isListening &&
              partialResults.length > 0 &&
              activeInput === "physicalCashInput" && (
                <Text style={styles.partialText}>
                  {t("listening")} {partialResults[0]}...
                </Text>
              )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setIsPhysicalCashModalVisible(false);
                  cancelListening();
                }}
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
  addButton: {
    // Keep this style as it's used by headerRight
    padding: 5,
    marginLeft: 10,
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  input: {
    flex: 1, // Allows TextInput to take up remaining space
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fcfcfc",
    marginRight: 10, // Space between input and mic button
  },
  micButton: {
    flexDirection: "row", // Arrange icon and text horizontally
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#e0e0e0", // Light grey for inactive mic
    justifyContent: "center",
    gap: 5, // Space between icon and text
  },
  micButtonActive: {
    backgroundColor: "#ffe0e0", // Light red for active mic
  },
  micButtonText: {
    color: "#666", // Default text color
    fontSize: 12,
  },
  partialText: {
    fontSize: 14,
    color: "#007bff",
    textAlign: "center",
    marginBottom: 10,
    marginTop: -10, // Pull up slightly closer to input
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
