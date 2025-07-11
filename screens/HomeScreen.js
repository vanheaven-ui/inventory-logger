// screens/HomeScreen.js
import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  Switch,
  Platform,
  StatusBar, // Import StatusBar for Android specific padding
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useLanguage } from "../context/LanguageContext";
import { FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Key for AsyncStorage
const IS_AGENT_KEY = "isMobileMoneyAgent";

// Define your color palette ONCE at the top or import it from a separate file.
const Colors = {
  primary: "#007bff", // A vibrant blue for main actions
  primaryLite: "#66A7FF", // Lighter shade of primary for track color
  secondary: "#6c757d", // Muted gray for secondary elements
  accent: "#ffc107", // A pop of yellow/gold for highlights (e.g., switch thumb)
  success: "#28a745", // Green for success/positive actions
  danger: "#dc3545", // Red for sell/negative actions
  warning: "#ff8c00", // Orange for inventory/warnings
  info: "#17a2b8", // Cyan/teal for info/summary
  darkGray: "#343a40", // Dark text
  textDark: "#2c3e50", // Dark text
  textLight: "#555", // Lighter text
  background: "#eef2f5", // Light background
  cardBackground: "#fff", // White for cards
  grayLight: "#dee2e6", // Very light gray
  grayMedium: "#adb5bd", // Medium gray
  white: "#ffffff",
};

export default function HomeScreen() {
  const navigation = useNavigation();
  const { t, changeLanguage, language } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [isMobileMoneyAgent, setIsMobileMoneyAgent] = useState(false);

  const loadAgentStatus = async () => {
    try {
      const storedStatus = await AsyncStorage.getItem(IS_AGENT_KEY);
      if (storedStatus !== null) {
        setIsMobileMoneyAgent(JSON.parse(storedStatus));
      }
      console.log("Loaded agent status from storage:", storedStatus);
    } catch (error) {
      console.error("Failed to load agent status:", error);
    }
  };

  const saveAgentStatus = async (value) => {
    try {
      await AsyncStorage.setItem(IS_AGENT_KEY, JSON.stringify(value));
      console.log("Saving agent status to storage:", value);
    } catch (error) {
      console.error("Failed to save agent status:", error);
    }
  };

  useEffect(() => {
    loadAgentStatus();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      console.log("Data refreshed!");
      setRefreshing(false);
    }, 1500);
  }, []);

  const handleAgentToggle = (newValue) => {
    setIsMobileMoneyAgent(newValue);
    saveAgentStatus(newValue);
  };

  const languages = [
    { code: "en", name: t("english") },
    { code: "lg", name: t("luganda") },
    { code: "sw", name: t("swahili") },
    { code: "nyn", name: t("runyakitara") },
    { code: "ach", name: t("acholi") },
    { code: "lgo", name: t("lango") },
    { code: "sog", name: t("lusoga") },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Fixed App Name and Logo Section */}
      {/* Adjusted padding for Android to account for status bar */}
      <View
        style={[
          styles.fixedHeaderContainer,
          Platform.OS === "android" && {
            paddingTop: StatusBar.currentHeight + 10,
          },
        ]}
      >
        <View style={styles.appTitleContainerExt}>
          <Text style={styles.heading}>{t("app_name")}</Text>
          <View style={styles.logoContainer}>
            <FontAwesome5 name="handshake" size={30} color={Colors.white} />
          </View>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContentInner}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Language Selection Buttons */}
        <View style={styles.languageSelectionContainer}>
          <Text style={styles.languageSelectionText}>
            {t("select_language")}
          </Text>
          <View style={styles.languageButtonsWrapper}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageButton,
                  language === lang.code && styles.languageButtonActive,
                ]}
                onPress={() => changeLanguage(lang.code)}
              >
                <Text style={styles.languageButtonText}>{lang.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Agent Toggle Switch */}
        <View style={styles.agentQuestionContainer}>
          <Text style={styles.agentQuestionText}>
            {t("is_mobile_money_agent")}
          </Text>
          <Switch
            onValueChange={handleAgentToggle}
            value={isMobileMoneyAgent}
            trackColor={{ false: Colors.grayLight, true: Colors.primaryLite }}
            thumbColor={isMobileMoneyAgent ? Colors.accent : Colors.white}
            ios_backgroundColor={Colors.grayMedium}
          />
        </View>

        {/* Action Buttons - Text changes based on toggle */}
        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.button, styles.sellButton]}
            onPress={() => navigation.navigate("Transaction", { type: "sell" })}
          >
            <Text style={styles.buttonText}>
              {isMobileMoneyAgent ? t("record_withdrawal") : t("record_sale")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.restockButton]}
            onPress={() =>
              navigation.navigate("Transaction", { type: "restock" })
            }
          >
            <Text style={styles.buttonText}>
              {isMobileMoneyAgent ? t("record_deposit") : t("record_restock")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.inventoryButton]}
            onPress={() => navigation.navigate("Inventory")}
          >
            <Text style={styles.buttonText}>
              {isMobileMoneyAgent ? t("manage_float") : t("manage_inventory")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.summaryButton]}
            onPress={() => navigation.navigate("Summary")}
          >
            <Text style={styles.buttonText}>{t("view_summary")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.historyButton]}
            onPress={() => navigation.navigate("History")}
          >
            <Text style={styles.buttonText}>{t("view_history")}</Text>
          </TouchableOpacity>
        </View>

        {/* Tip text */}
        <Text style={styles.tipExt}>{t("tip_home")}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// Stylesheet definition - now uses the single Colors declaration from above
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  fixedHeaderContainer: {
    backgroundColor: Colors.background,
    paddingBottom: 10,
    shadowColor: Colors.darkGray,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 1,
    // Add conditional padding for iOS to push content down from the notch area
    // SafeAreaView usually handles this, but explicit padding can fine-tune
    // For Android, we add StatusBar.currentHeight in the component itself
    paddingTop: Platform.OS === "ios" ? 0 : 0, // SafeAreaView already provides this on iOS
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContentInner: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  appTitleContainerExt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
    marginTop: 0, // Reduced to decrease overall height
    paddingHorizontal: 20,
    height: 70, // Fixed height for header container to control size
  },
  heading: {
    fontSize: 26, // Reduced font size
    fontWeight: "800",
    textAlign: "center",
    color: Colors.textDark,
    marginRight: 10, // Reduced margin
  },
  greetingIcon: {
    marginHorizontal: 5,
  },
  logoContainer: {
    backgroundColor: Colors.success,
    width: 50, // Reduced width
    height: 50, // Reduced height
    borderRadius: 25, // Adjusted borderRadius for smaller size
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.darkGray,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 10,
  },
  agentQuestionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.cardBackground,
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    elevation: 4,
    shadowColor: Colors.darkGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  agentQuestionText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textDark,
    flexShrink: 1,
    marginRight: 15,
  },
  languageSelectionContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  languageSelectionText: {
    fontSize: 18,
    color: Colors.textLight,
    marginBottom: 15,
    fontWeight: "600",
  },
  languageButtonsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  languageButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25,
    shadowColor: Colors.darkGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  languageButtonActive: {
    backgroundColor: Colors.secondary,
  },
  languageButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: Colors.cardBackground,
    padding: 25,
    borderRadius: 15,
    elevation: 6,
    shadowColor: Colors.darkGray,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    gap: 12,
    marginBottom: 30,
  },
  button: {
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  sellButton: {
    backgroundColor: Colors.danger,
  },
  restockButton: {
    backgroundColor: Colors.success,
  },
  inventoryButton: {
    backgroundColor: Colors.warning,
  },
  summaryButton: {
    backgroundColor: Colors.info,
  },
  historyButton: {
    backgroundColor: Colors.darkGray,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  tipExt: {
    marginTop: 20,
    textAlign: "center",
    color: Colors.textLight,
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 20,
  },
});
