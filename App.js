import React from "react";
import { StatusBar } from "expo-status-bar";
import * as eva from "@eva-design/eva";
import { ApplicationProvider } from "@ui-kitten/components";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./src/navigation/AppNavigator";
import "./src/utils/devHttpLogger";

export default function App() {
  return (
    <SafeAreaProvider>
      <ApplicationProvider {...eva} theme={eva.light}>
        <AppNavigator />
        <StatusBar style="auto" />
      </ApplicationProvider>
    </SafeAreaProvider>
  );
}
