import { Colors } from "@/constants/theme";
import BookLoader from "@/components/ui/BookLoader";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { StatusBar, StyleSheet, View } from "react-native";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

SplashScreen.preventAutoHideAsync();

/** Gate that blocks all navigation until auth state is resolved. */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <BookLoader label="" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "IosevkaCharonMono-Light": require("../assets/fonts/IosevkaCharonMono-Light.ttf"),
    "IosevkaCharonMono-LightItalic": require("../assets/fonts/IosevkaCharonMono-LightItalic.ttf"),
    "IosevkaCharonMono-Regular": require("../assets/fonts/IosevkaCharonMono-Regular.ttf"),
    "IosevkaCharonMono-Italic": require("../assets/fonts/IosevkaCharonMono-Italic.ttf"),
    "IosevkaCharonMono-Medium": require("../assets/fonts/IosevkaCharonMono-Medium.ttf"),
    "IosevkaCharonMono-MediumItalic": require("../assets/fonts/IosevkaCharonMono-MediumItalic.ttf"),
    "IosevkaCharonMono-Bold": require("../assets/fonts/IosevkaCharonMono-Bold.ttf"),
    "IosevkaCharonMono-BoldItalic": require("../assets/fonts/IosevkaCharonMono-BoldItalic.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

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
