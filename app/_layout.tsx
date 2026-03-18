import { Colors } from "@/constants/theme";
import AppSplash from "@/components/ui/AppSplash";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
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

/** Gate that blocks all navigation until auth state is resolved. */
function AuthGate({ children }: { children: React.ReactNode }) {
  const [isSplashAnimationDone, setIsSplashAnimationDone] = useState(hasCompletedStartupSplash);

  const handleSplashComplete = () => {
    hasCompletedStartupSplash = true;
    setIsSplashAnimationDone(true);
  };

  if (!isSplashAnimationDone) {
    return (
      <AppSplash
        animate={!isSplashAnimationDone}
        onAnimationComplete={handleSplashComplete}
      />
    );
  }

  return <>{children}</>;
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
              <Stack.Screen name="profile/edit" />
              <Stack.Screen name="rental" />
            </Stack>
          </AuthGate>
        </ToastProvider>
      </AuthProvider>
    </ConvexProvider>
  );
}
