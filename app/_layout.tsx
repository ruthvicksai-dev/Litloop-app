import AppSplash from "@/components/ui/AppSplash";
import { NotificationPermissionModal, useNotificationRationale } from "@/components/ui/NotificationPermissionModal";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { Colors } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { NetworkProvider } from "@/context/NetworkContext";
import { ToastProvider } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { useNotifications } from "@/hooks/useNotifications";
import { ConvexProvider, ConvexReactClient, useMutation } from "convex/react";
import Constants from "expo-constants";
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

// L4 FIX: Suppress verbose Convex logs in production builds.
// console.error is still active in production for critical failures.
const isProd = process.env.NODE_ENV === "production";
const noop = () => { };

const convexLogger = {
  log: isProd ? noop : (...args: unknown[]) => console.log(...args),
  warn: isProd ? noop : (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => {
    if (shouldSuppressConvexLog(args)) {
      return;
    }
    console.error(...args);
  },
  logVerbose: isProd ? noop : (...args: unknown[]) => console.log(...args),
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

  const updatePushToken = useMutation(api.notifications.updatePushToken);

  const requestSystemNotificationPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted" || !accessToken) return;

    // Immediately register the push token after the user grants permission.
    // useNotifications won't re-run mid-session, so we do it here directly.
    try {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;
      if (projectId) {
        const { data: pushToken } = await Notifications.getExpoPushTokenAsync({ projectId });
        await updatePushToken({ accessToken, pushToken });
      }
    } catch (e) {
      console.warn("[Notifications] Failed to register push token post-permission:", e);
    }
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
    // L1 FIX: Lato has no "Medium" weight. Map Lato-Medium to Regular (400)
    // so components using Fonts.medium render at the correct weight,
    // not incorrectly at Bold (700).
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
            <OfflineBanner type="fullscreen" />
            <AppGate fontsLoaded={fontsLoaded} />
          </ToastProvider>
        </AuthProvider>
      </NetworkProvider>
    </ConvexProvider>
  );
}
