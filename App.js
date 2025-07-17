import React, { useCallback, useEffect, useState } from "react"; 
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Toast, {
  BaseToast,
  ErrorToast,
  SuccessToast,
} from "react-native-toast-message"; // Import BaseToast, ErrorToast, SuccessToast

// Import screens
import HomeScreen from "./screens/HomeScreen";
import TransactionHistoryScreen from "./screens/TransactionHistoryScreen";
import TransactionScreen from "./screens/TransactionScreen";
import SummaryScreen from "./screens/SummaryScreen";
import InventoryScreen from "./screens/InventoryScreen";
import ManageItemScreen from "./screens/ManageItemScreen";
import ManageFloatScreen from "./screens/ManageFloatScreen";

// Import LanguageContext
import { LanguageProvider, useLanguage } from "./context/LanguageContext";

// Import the initialization function
import { initializeShopData } from "./storage/initialization"

// Define the color palette
const Colors = {
  primary: "#007bff",
  primaryDark: "#0056b3",
  white: "#ffffff",
  textDark: "#2c3e50",
  success: "#28a745", // Green for success
  error: "#dc3545", // Red for error
  info: "#17a2b8", // Blue-ish for info
  warning: "#ffc107", // Yellow-orange for warning
  lightGray: "#f8f8f8",
  mediumGray: "#cccccc",
  darkGray: "#666666",
};

const Stack = createNativeStackNavigator();

// 1. Define custom Toast styles (ToastConfig)
const toastConfig = {
  success: (props) => (
    <SuccessToast
      {...props}
      style={{
        borderLeftColor: Colors.success,
        height: 70,
        backgroundColor: Colors.white,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16, // Slightly larger
        fontWeight: "bold", // Make it bold
        color: Colors.textDark,
      }}
      text2Style={{
        fontSize: 13,
        color: Colors.darkGray,
      }}
      // Add more customization for visibility/shadow if needed
      // containerStyle={{ elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: Colors.error,
        height: 70,
        backgroundColor: Colors.white,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: "bold",
        color: Colors.textDark,
      }}
      text2Style={{
        fontSize: 13,
        color: Colors.darkGray,
      }}
    />
  ),
  info: (props) => (
    <BaseToast // Using BaseToast for custom info appearance
      {...props}
      style={{
        borderLeftColor: Colors.info,
        height: 70,
        backgroundColor: Colors.white,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: "bold",
        color: Colors.textDark,
      }}
      text2Style={{
        fontSize: 13,
        color: Colors.darkGray,
      }}
    />
  ),
  warning: (
    props // Added a warning toast type
  ) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: Colors.warning,
        height: 70,
        backgroundColor: Colors.white,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: "bold",
        color: Colors.textDark,
      }}
      text2Style={{
        fontSize: 13,
        color: Colors.darkGray,
      }}
    />
  ),
  // You can add more custom types here if you need unique designs
  // For example:
  // custom_success: (props) => (
  //   <BaseToast
  //     {...props}
  //     style={{ borderLeftColor: 'purple', borderWidth: 2 }}
  //     text1Style={{ fontSize: 18, color: 'purple' }}
  //     text2Style={{ fontSize: 14 }}
  //   />
  // )
};

function AppNavigatorContent() {
  const { t, language } = useLanguage(); // Get translation function and current language

  // Memoize header titles for performance and to react to language changes
  const getHeaderTitle = useCallback(
    (screenName) => {
      switch (screenName) {
        case "Transaction":
          return t("record_transaction_title");
        case "Summary":
          return t("daily_summary_title");
        case "History":
          return t("transaction_history_title");
        case "Inventory":
          return t("inventory_title");
        case "ManageItem":
          return t("manage_item_title");
        case "ManageFloat":
          return t("manage_float");
        default:
          return t("app_name"); // Fallback for undefined
      }
    },
    [t, language]
  );

  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: Colors.white,
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 20,
        },
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Transaction"
        component={TransactionScreen}
        options={({ route }) => ({
          headerTitle: getHeaderTitle("Transaction"),
        })}
      />
      <Stack.Screen
        name="Summary"
        component={SummaryScreen}
        options={{
          headerTitle: getHeaderTitle("Summary"),
        }}
      />
      <Stack.Screen
        name="History"
        component={TransactionHistoryScreen}
        options={{
          headerTitle: getHeaderTitle("History"),
        }}
      />
      <Stack.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          headerTitle: getHeaderTitle("Inventory"),
        }}
      />
      <Stack.Screen
        name="ManageItem"
        component={ManageItemScreen}
        options={({ route }) => ({
          presentation: "modal",
          headerTitle: route.params?.itemId
            ? t("edit_item_title")
            : t("add_new_item_title"),
          headerLeft: () => null,
        })}
      />
      <Stack.Screen
        name="ManageFloat"
        component={ManageFloatScreen}
        options={({ route }) => ({
          headerTitle: getHeaderTitle("ManageFloat"),
          presentation: "modal",
          headerLeft: () => null,
        })}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function prepareApp() {
      try {
        // Run the initialization logic when the app mounts
        await initializeShopData();
        // You can load other initial data or perform other startup tasks here
      } catch (e) {
        console.error("Failed to prepare app data:", e);
        // Implement error handling, e.g., show an error message to the user
        Toast.show({
          type: "error",
          text1: "Initialization Error",
          text2: "Failed to load initial shop data. Please restart the app.",
          position: "top",
        });
      } finally {
        setIsLoading(false); // Once data is loaded/checked, stop loading
      }
    }

    prepareApp();
  }, []); // The empty dependency array ensures this runs only once on mount

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        {/* You need to define styles here or import them */}
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Setting up your shop data...</Text>
      </View>
    );
  }

  return (
    <LanguageProvider>
      <NavigationContainer>
        <AppNavigatorContent />
      </NavigationContainer>
      <Toast config={toastConfig} />
    </LanguageProvider>
  );
}

const styles = {
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.lightGray,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: Colors.textDark,
  },
};
