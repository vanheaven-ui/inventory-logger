import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message"; // Ensure this is installed: npm install react-native-toast-message
import HomeScreen from "./screens/HomeScreen";
import TransactionHistoryScreen from "./screens/TransactionHistoryScreen";
import TransactionScreen from "./screens/TransactionScreen";
import SummaryScreen from "./screens/SummaryScreen";
import { LanguageProvider } from "./context/LanguageContext";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    // Wrap the entire app with LanguageProvider to make translation available everywhere
    <LanguageProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }} // Optionally hide header for Home screen
          />
          <Stack.Screen name="Transaction" component={TransactionScreen} />
          <Stack.Screen name="Summary" component={SummaryScreen} />
          <Stack.Screen name="History" component={TransactionHistoryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast /> 
    </LanguageProvider>
  );
}
