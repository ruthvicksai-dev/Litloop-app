import AppSplash from "@/components/ui/AppSplash";
import { NotificationPermissionModal, useNotificationRationale } from "@/components/ui/NotificationPermissionModal";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { Colors } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { NetworkProvider } from "@/context/NetworkContext";
import { ToastProvider } from "@/context/ToastContext";
import { useNotifications } from "@/hooks/useNotifications";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { StatusBar } from "react-native";

const shouldSuppressConvexLog = (args: unknown[]) => {
  const message = args
    .map((value) => (typeof value === "string" ? value : ""))
    .join(" ");

  return (
    message.includes("[CONVEX M(auth:signIn)]") &&
    (
      message.includes("Invalid email or password.") ||
      message.includes("This account uses social login.")
    )
  );
};

const convexLogger = {
  log: (...args: unknown[]) => console.log(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => {
    if (shouldSuppressConvexLog(args)) {
      return;
    }
    console.error(...args);
  },
  logVerbose: (...args: unknown[]) => console.log(...args),
};

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
  logger: convexLogger,
});

SplashScreen.preventAutoHideAsync();
let hasCompletedStartupSplash = false;

/** Blocks navigation until startup splash and auth state are both resolved. */
function AppGate({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { isLoading, userId, user, accessToken } = useAuth();
  const [isSplashAnimationDone, setIsSplashAnimationDone] = useState(hasCompletedStartupSplash);
  const [hasResolvedInitialAuth, setHasResolvedInitialAuth] = useState(false);
  const showSplash = !isSplashAnimationDone || !hasResolvedInitialAuth;

  // Initialize push notifications for the logged-in user
  useNotifications(userId, accessToken, user?.role);

  // P4: Notification permission rationale (shown once per install, after login)
  const { shouldShow, onAllow, onDecline } = useNotificationRationale();
  const showNotificationRationale = shouldShow && !!userId && !showSplash;

  const requestSystemNotificationPermission = async () => {
    await Notifications.requestPermissionsAsync();
  };

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
          <Stack.Screen name="legal/privacy-policy" />
          <Stack.Screen name="legal/terms-of-service" />
        </Stack>
      )}

      {/* P4: Notification permission rationale — shown once per install after login */}
      <NotificationPermissionModal
        visible={showNotificationRationale}
        onAllow={onAllow}
        onDecline={onDecline}
        onGranted={requestSystemNotificationPermission}
      />
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
      <NetworkProvider>
        <AuthProvider>
          <ToastProvider>
            <OfflineBanner />
            <AppGate fontsLoaded={fontsLoaded} />
          </ToastProvider>
        </AuthProvider>
      </NetworkProvider>
    </ConvexProvider>
  );
}
