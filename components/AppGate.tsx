import AppSplash from "@/components/ui/AppSplash";
import ErrorBoundary from "@/components/ui/feedback/ErrorBoundary";
import ForceUpdateGate from "@/components/ui/feedback/ForceUpdateGate";
import { NotificationPermissionModal, useNotificationRationale } from "@/components/ui/feedback/NotificationPermissionModal";
import { Colors } from "@/constants/theme";
import { useAuthState } from "@/context/AuthContext";
import { api } from "@/convex/_generated/api";
import { useForceUpdate } from "@/hooks/useForceUpdate";
import { useNotifications } from "@/hooks/useNotifications";
import { useMutation } from "convex/react";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

let hasCompletedStartupSplash = false;

/** Blocks navigation until startup splash and auth state are both resolved. */
export default function AppGate({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { isLoading, userId, user, accessToken } = useAuthState();
  const [isSplashAnimationDone, setIsSplashAnimationDone] = useState(hasCompletedStartupSplash);
  const [hasResolvedInitialAuth, setHasResolvedInitialAuth] = useState(false);
  const showSplash = !isSplashAnimationDone || !hasResolvedInitialAuth;

  // Force update gate — Google native (primary) + Convex backend (fallback)
  const { showFallbackModal, storeUrl, currentVersion, minVersion } = useForceUpdate();

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
        style={showSplash ? "light" : "dark"}
        translucent
        backgroundColor="transparent"
        animated
      />
      <ErrorBoundary>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            contentStyle: { backgroundColor: Colors.background },
            freezeOnBlur: false,
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
      </ErrorBoundary>

      {showSplash && (
        <View style={StyleSheet.absoluteFill}>
          <AppSplash onAnimationComplete={handleSplashComplete} />
        </View>
      )}

      {/* P4: Notification permission rationale — shown once per install after login */}
      <NotificationPermissionModal
        visible={showNotificationRationale}
        onAllow={onAllow}
        onDecline={onDecline}
        onGranted={requestSystemNotificationPermission}
      />

      {/* Force update fallback gate — blocks app if backend detects outdated version */}
      <ForceUpdateGate
        visible={showFallbackModal}
        storeUrl={storeUrl}
        currentVersion={currentVersion}
        minVersion={minVersion}
      />
    </>
  );
}
