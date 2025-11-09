import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@ui-kitten/components";

// Screens
import HomeScreen from "../screens/HomeScreen";
import PersonelStackNavigator from "./PersonelStackNavigator";
import ReportsScreen from "../screens/ReportsScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Personel") {
            iconName = focused ? "people" : "people-outline";
          } else if (route.name === "Reports") {
            iconName = focused ? "bar-chart" : "bar-chart-outline";
          } else if (route.name === "Settings") {
            iconName = focused ? "settings" : "settings-outline";
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
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Ana Sayfa",
        }}
      />
      <Tab.Screen
        name="Personel"
        component={PersonelStackNavigator}
        options={{
          tabBarLabel: "Personel",
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Varsayılan davranışı iptal etmeyelim ancak her tab basışında listeye dönelim
            navigation.navigate("Personel", {
              screen: "PersonelList",
            });
          },
        })}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarLabel: "Raporlar",
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: "Ayarlar",
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
