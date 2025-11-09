import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@ui-kitten/components";

// Screens
import EmployeeDashboardScreen from "../screens/EmployeeDashboardScreen";
import MyProfileScreen from "../screens/MyProfileScreen";
import MyLeavesScreen from "../screens/MyLeavesScreen";
import MyAdvancesScreen from "../screens/MyAdvancesScreen";
import MyTimesheetsScreen from "../screens/MyTimesheetsScreen";

const Tab = createBottomTabNavigator();

const EmployeeTabNavigator = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Dashboard") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          } else if (route.name === "Leaves") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "Advances") {
            iconName = focused ? "card" : "card-outline";
          } else if (route.name === "Timesheets") {
            iconName = focused ? "time" : "time-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme["color-primary-500"],
        tabBarInactiveTintColor: theme["color-basic-600"],
        tabBarStyle: {
          backgroundColor: theme["color-basic-100"],
          borderTopColor: theme["color-basic-300"],
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={EmployeeDashboardScreen}
        options={{
          tabBarLabel: "Ana Sayfa",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={MyProfileScreen}
        options={{
          tabBarLabel: "Profilim",
        }}
      />
      <Tab.Screen
        name="Leaves"
        component={MyLeavesScreen}
        options={{
          tabBarLabel: "İzinlerim",
        }}
      />
      <Tab.Screen
        name="Advances"
        component={MyAdvancesScreen}
        options={{
          tabBarLabel: "Avanslarım",
        }}
      />
      <Tab.Screen
        name="Timesheets"
        component={MyTimesheetsScreen}
        options={{
          tabBarLabel: "Mesailerim",
        }}
      />
    </Tab.Navigator>
  );
};

export default EmployeeTabNavigator;
