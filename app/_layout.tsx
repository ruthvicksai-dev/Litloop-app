// Animated freeze guard is no longer needed since useNonFrozen prevents freezing
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
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { enableFreeze } from "react-native-screens";

// Globally disable react-freeze to prevent "Cannot add new property '_tracking'"
// crashes with React Native 0.81 + React 19. react-freeze freezes Animated.Value
// objects making them non-extensible, which crashes the animation system.
enableFreeze(false);

// Safe Sentry Initialization
try {
  const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  const isSentryEnabled = Boolean(sentryDsn) && !__DEV__;
  if (isSentryEnabled) {
    Sentry.init({
      dsn: sentryDsn,
      enabled: true,
      tracesSampleRate: 0,
      environment: "production",
    });
  }
} catch (e) {
  console.warn("[Sentry] Failed to initialize:", e);
}

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

// Lazy singleton instantiation for Convex client
let convexClientInstance: ConvexReactClient | null = null;
function getConvexClient(): ConvexReactClient {
  if (!convexClientInstance) {
    const rawConvexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

    console.log("[Convex Client Init] Diagnostic details:");
    console.log("  - NODE_ENV:", process.env.NODE_ENV);
    console.log("  - EXPO_PUBLIC_CONVEX_URL:", rawConvexUrl);
    console.log("  - typeof EXPO_PUBLIC_CONVEX_URL:", typeof rawConvexUrl);
    console.log(
      "  - Length:",
      typeof rawConvexUrl === "string" ? rawConvexUrl.length : "N/A"
    );

    if (
      !rawConvexUrl ||
      typeof rawConvexUrl !== "string" ||
      rawConvexUrl.trim() === ""
    ) {
      throw new Error(
        `[Convex Error] EXPO_PUBLIC_CONVEX_URL is missing or empty. Got: ${JSON.stringify(
          rawConvexUrl
        )}`
      );
    }

    if (rawConvexUrl.startsWith("$") || rawConvexUrl.includes("EXPO_PUBLIC_")) {
      throw new Error(
        `[Convex Error] EXPO_PUBLIC_CONVEX_URL was not substituted at build time and holds a raw placeholder: "${rawConvexUrl}". Ensure your EAS build environment variable is properly set.`
      );
    }

    if (!/^https?:\/\//i.test(rawConvexUrl)) {
      throw new Error(
        `[Convex Error] EXPO_PUBLIC_CONVEX_URL is not a valid absolute URL (missing http:// or https:// protocol). Value: "${rawConvexUrl}"`
      );
    }

    convexClientInstance = new ConvexReactClient(rawConvexUrl, {
      unsavedChangesWarning: false,
      logger: convexLogger,
    });
  }
  return convexClientInstance;
}

try {
  SplashScreen.preventAutoHideAsync();
} catch {}

function RootLayout() {
  const convexClient = React.useMemo(() => getConvexClient(), []);

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

  const customizeSystemUI = async () => {
    try {
      if (Platform.OS === "android") {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const NavigationBar = require("expo-navigation-bar");
          await NavigationBar.setBackgroundColorAsync(Colors.background);
          await NavigationBar.setButtonStyleAsync("dark");
        } catch {}
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
      <KeyboardProvider>
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
          <ConvexProvider client={convexClient}>
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
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}

// Safely wrap with Sentry without breaking default export shape
const WrappedRootLayout = Sentry && typeof Sentry.wrap === "function" 
  ? Sentry.wrap(RootLayout) 
  : RootLayout;

export default WrappedRootLayout;
