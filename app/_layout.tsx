import AppGate from "@/components/AppGate";
import { OfflineBanner } from "@/components/ui/feedback/OfflineBanner";
import { Colors } from "@/constants/theme";
import { AuthProvider } from "@/context/AuthContext";
import { NetworkProvider } from "@/context/NetworkContext";
import { ToastProvider } from "@/context/ToastContext";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import * as Sentry from "@sentry/react-native";
import * as SystemUI from "expo-system-ui";
import React, { useEffect } from "react";
import { Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
const isSentryEnabled = Boolean(sentryDsn) && !__DEV__;

Sentry.init({
  dsn: sentryDsn,
  enabled: isSentryEnabled,
  tracesSampleRate: 0,
  environment: __DEV__ ? "development" : "production",
});

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
function RootLayout() {
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

  const customizeSystemUI = async () => {
  try {
    if (Platform.OS === "android") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Constants = require("expo-constants").default;
      const isExpoGo = Constants?.executionEnvironment === "storeClient";

      if (!isExpoGo) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const NavigationBar = require("expo-navigation-bar");

        await NavigationBar.setButtonStyleAsync("light");
      }
    }
    await SystemUI.setBackgroundColorAsync(Colors.background);
  } catch {}
};

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
    customizeSystemUI();
  }, [fontsLoaded]);


  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
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
      </View>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(RootLayout);
