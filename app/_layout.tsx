import { Colors } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";
import React from "react";
import { ActivityIndicator, StatusBar, StyleSheet, View } from "react-native";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

/** Gate that blocks all navigation until auth state is resolved. */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <ToastProvider>
          <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
          <AuthGate>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
                contentStyle: { backgroundColor: Colors.background },
              }}
            >
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(admin)" />
              <Stack.Screen name="book/[id]" />
              <Stack.Screen name="rental" />
            </Stack>
          </AuthGate>
        </ToastProvider>
      </AuthProvider>
    </ConvexProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
});
