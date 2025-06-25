// TransactionScreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import TransactionForm from "../components/TransactionForm";
import { useLanguage } from "../context/LanguageContext"; 
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons"; // Install this

export default function TransactionScreen({ route }) {
  const { type } = route.params;
  const { t } = useLanguage();
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {type === "sell" ? t("record_a_sale") : t("record_a_restock")}
        </Text>
      </View>
      <View style={styles.screenContent}>
        <TransactionForm type={type} />
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
    justifyContent: "center", // Center title
    paddingVertical: 20,
    backgroundColor: "#4a90e2", // Header background
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
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
    flex: 1, // Allow title to take available space
    textAlign: "center", // Center text
    paddingRight: 40, // Offset for back button to truly center
  },
  backButton: {
    position: "absolute",
    left: 20,
    padding: 5,
  },
  screenContent: {
    flex: 1,
    paddingTop: 0, // TransactionForm has its own padding
  },
});
