import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import TransactionForm from "../components/TransactionForm";
import { useLanguage } from "../context/LanguageContext";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const IS_AGENT_KEY = "isMobileMoneyAgent";

export default function TransactionScreen({ route }) {
  const { type } = route.params; // 'sell' or 'restock'
  const { t } = useLanguage();
  const navigation = useNavigation();

  const [isMobileMoneyAgent, setIsMobileMoneyAgent] = useState(false);
  const [loadingAgentStatus, setLoadingAgentStatus] = useState(true);

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
      setIsMobileMoneyAgent(false); // Ensure a default even on error
    } finally {
      setLoadingAgentStatus(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAgentStatus();
    }, [loadAgentStatus])
  );

  const headerBackgroundColor = type === "sell" ? "#dc3545" : "#28a745";

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
      <View style={[styles.header, { backgroundColor: headerBackgroundColor }]}>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
      </View>
      <View style={styles.screenContent}>
        <TransactionForm type={type} isMobileMoneyAgent={isMobileMoneyAgent} />
      </View>
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
    // Adjust padding to visually center the title despite the back button's presence
    paddingRight: 50, // Roughly the width of the back button + its padding
    paddingLeft: 20,
  },
  backButton: {
    position: "absolute",
    left: 20,
    padding: 5,
    zIndex: 1, // Ensure the back button is tappable
  },
  screenContent: {
    flex: 1,
    paddingTop: 0,
  },
});
