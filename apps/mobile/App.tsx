import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MobileAuthProvider } from "./src/context/AuthContext";
import { CompareProvider } from "./src/context/CompareContext";
import { NetworkProvider } from "./src/context/NetworkContext";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import { RootNavigator } from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <NetworkProvider>
          <MobileAuthProvider>
            <CompareProvider>
              <RootNavigator />
            </CompareProvider>
          </MobileAuthProvider>
        </NetworkProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
