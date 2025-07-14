import React, { useCallback } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";

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

// Define the color palette
const Colors = {
  primary: "#007bff", 
  primaryDark: "#0056b3", 
  white: "#ffffff",
  textDark: "#2c3e50", 
};

const Stack = createNativeStackNavigator();

// Create a component that wraps the stack navigator
// This allows the use hooks like useLanguage within the navigator configuration
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
          return t("inventory_title"); // Or "manage_float_title" based on agent status if you want dynamic header here
        case "ManageItem":
          return t("manage_item_title"); // Or "add_item_title", "edit_item_title"
        case "ManageFloat": 
          return t("manage_float");
        default:
          return t("app_name"); // Fallback for undefined
      }
    },
    [t, language]
  ); // Re-create if 't' or 'language' changes

  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primary, 
        },
        headerTintColor: Colors.white, // Color of the title and back button
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 20,
        },
        headerTitleAlign: "center", // Center the header title
        // For iOS, the header height is often handled automatically with safe areas.
        // headerStatusBarHeight: Platform.OS === 'android' ? 0 : undefined, // Useful if status bar pushes header
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false, // Hide header for the Home screen, as it has a custom one
        }}
      />
      <Stack.Screen
        name="Transaction"
        component={TransactionScreen}
        options={({ route }) => ({
          headerTitle: getHeaderTitle("Transaction"),
          // You might want to dynamically change the title here based on transaction type
          // e.g., if route.params?.type === 'sell' then t('record_sale'), else t('record_restock')
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
          // If you want to dynamically change this based on agent status,
          // InventoryScreen would need to set its own header via useLayoutEffect
          // or you'd need to pass the isMobileMoneyAgent prop down to affect this title.
        }}
      />
      <Stack.Screen
        name="ManageItem"
        component={ManageItemScreen}
        options={({ route }) => ({
          // Use route to get params for dynamic title
          presentation: "modal", // Opens as a modal, common for forms
          headerTitle: route.params?.itemId
            ? t("edit_item_title")
            : t("add_new_item_title"), // Example: "Edit Item" vs "Add New Item"
          headerLeft: () => null, // Hide back button for modals (users expect a dismiss button)
        })}
      />
      <Stack.Screen
        name="ManageFloat"
        component={ManageFloatScreen}
        options={({ route }) => ({
          headerTitle: getHeaderTitle("ManageFloat"),
          presentation: "modal", // Opens as a modal, similar to ManageItem
          headerLeft: () => null, // Hide back button for modals
        })}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <NavigationContainer>
        {/* Render the AppNavigatorContent component inside NavigationContainer */}
        <AppNavigatorContent />
      </NavigationContainer>
      <Toast />
    </LanguageProvider>
  );
}
