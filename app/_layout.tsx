import AppSplash from "@/components/ui/AppSplash";
import { Colors } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { useNotifications } from "@/hooks/useNotifications";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { StatusBar } from "react-native";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

SplashScreen.preventAutoHideAsync();
let hasCompletedStartupSplash = false;

/** Blocks navigation until startup splash and auth state are both resolved. */
function AppGate({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { isLoading, userId, user } = useAuth();
  const [isSplashAnimationDone, setIsSplashAnimationDone] = useState(hasCompletedStartupSplash);
  const [hasResolvedInitialAuth, setHasResolvedInitialAuth] = useState(false);
  const showSplash = !isSplashAnimationDone || !hasResolvedInitialAuth;

  // Initialize push notifications for the logged-in user
  useNotifications(userId, user?.role);

  const handleSplashComplete = () => {
    hasCompletedStartupSplash = true;
    setIsSplashAnimationDone(true);
  };

  useEffect(() => {
    if (!isLoading) {
      setHasResolvedInitialAuth(true);
    }
  }, [isLoading]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar
        barStyle={showSplash ? "light-content" : "dark-content"}
        backgroundColor={showSplash ? "#0F2027" : Colors.background}
      />
      {showSplash ? (
        <AppSplash onAnimationComplete={handleSplashComplete} />
      ) : (
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            contentStyle: { backgroundColor: Colors.background },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(admin)" />
          <Stack.Screen name="book/[id]" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="section-books" />
          <Stack.Screen name="profile/edit" />
          <Stack.Screen name="rental" />
        </Stack>
      )}
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Lato-Light": require("../assets/fonts/Lato/Lato-Light.ttf"),
    "Lato-LightItalic": require("../assets/fonts/Lato/Lato-LightItalic.ttf"),
    "Lato-Regular": require("../assets/fonts/Lato/Lato-Regular.ttf"),
    "Lato-Italic": require("../assets/fonts/Lato/Lato-Italic.ttf"),
    "Lato-Medium": require("../assets/fonts/Lato/Lato-Regular.ttf"),
    "Lato-MediumItalic": require("../assets/fonts/Lato/Lato-Italic.ttf"),
    "Lato-Bold": require("../assets/fonts/Lato/Lato-Bold.ttf"),
    "Lato-BoldItalic": require("../assets/fonts/Lato/Lato-BoldItalic.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <ToastProvider>
          <AppGate fontsLoaded={fontsLoaded} />
        </ToastProvider>
      </AuthProvider>
    </ConvexProvider>
  );
}
