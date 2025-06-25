import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useLanguage } from "../context/LaguageContext";

export default function HomeScreen() {
  const navigation = useNavigation();
  const { t, setAppLanguage } = useLanguage(); // Get translation function and set language function

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{t("home_heading")}</Text>

      {/* Language Selection Buttons */}
      <View style={styles.languageSelectionContainer}>
        <Text style={styles.languageSelectionText}>{t("select_language")}</Text>
        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => setAppLanguage("en")}
        >
          <Text style={styles.languageButtonText}>{t("english")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => setAppLanguage("lg")}
        >
          <Text style={styles.languageButtonText}>{t("luganda")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => setAppLanguage("sw")}
        >
          <Text style={styles.languageButtonText}>{t("swahili")}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <TouchableOpacity
          style={[styles.button, styles.sell]}
          onPress={() => navigation.navigate("Transaction", { type: "sell" })}
        >
          <Text style={styles.buttonText}>{t("record_sale")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.restock]}
          onPress={() =>
            navigation.navigate("Transaction", { type: "restock" })
          }
        >
          <Text style={styles.buttonText}>{t("record_restock")}</Text>
        </TouchableOpacity>

        {/* View Today's Summary button with unique styling */}
        <TouchableOpacity
          style={[styles.button, styles.summaryButton]} // Apply summaryButton style
          onPress={() => navigation.navigate("Summary")}
        >
          <Text style={styles.buttonText}>{t("view_summary")}</Text>
        </TouchableOpacity>

        {/* View History button with unique styling */}
        <TouchableOpacity
          style={[styles.button, styles.historyButton]} // Apply historyButton style
          onPress={() => navigation.navigate("History")}
        >
          <Text style={styles.buttonText}>{t("view_history")}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.tip}>{t("tip_home")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#f4f6f8",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#333", // Darken text for contrast
  },
  languageSelectionContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap", // Allow buttons to wrap
  },
  languageSelectionText: {
    fontSize: 16,
    marginRight: 10,
    color: "#555",
    marginBottom: 5,
  },
  languageButton: {
    backgroundColor: "#007bff",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginHorizontal: 5,
    marginBottom: 5,
  },
  languageButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    elevation: 3, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    gap: 16, // Spacing between buttons
  },
  button: {
    backgroundColor: "#4a90e2", // Default blue for general buttons (can be overridden)
    paddingVertical: 15,
    borderRadius: 6,
    alignItems: "center",
  },
  sell: {
    backgroundColor: "#d9534f", // Red for Sell
  },
  restock: {
    backgroundColor: "#5cb85c", // Green for Restock
  },
  summaryButton: {
    backgroundColor: "#007bff",
    marginTop: 10, // Add some space above
    // You can add other styles like padding, borderRadius etc., if they differ from 'button'
  },
  historyButton: {
    backgroundColor: "#6c757d", // A distinct grey/darker color
    // If you want smaller text or different font, you could define a separate text style here too
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  tip: {
    marginTop: 30,
    textAlign: "center",
    color: "#666",
    fontSize: 13,
  },
});
