import { isAppOutdated } from "@/utils";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import Constants from "expo-constants";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.ruthvicksai.litloop";

/**
 * Force Update Hook
 *
 * Layer 1 (Primary): Google's native In-App Updates API via expo-in-app-updates.
 *   - Automatically shows Google's full-screen blocking update UI.
 *   - Works only on Android, only for Play Store builds.
 *
 * Layer 2 (Fallback): Convex backend min version check.
 *   - Catches edge cases where native API hasn't propagated.
 *   - Lets admin force-gate a version immediately.
 *   - Shows a custom blocking modal.
 */
export function useForceUpdate() {
    const [nativeCheckDone, setNativeCheckDone] = useState(false);
    const [showFallbackModal, setShowFallbackModal] = useState(false);

    const currentVersion = Constants.expoConfig?.version ?? "0.0.0";
    const minVersion = useQuery(api.appVersion.getMinAppVersion);

    // Layer 1: Native Google Play In-App Updates
    useEffect(() => {
        if (Platform.OS !== "android") {
            setNativeCheckDone(true);
            return;
        }

        let cancelled = false;

        const tryNativeUpdate = async () => {
            try {
                const ExpoInAppUpdates = await import("expo-in-app-updates");
                const result = await ExpoInAppUpdates.default.checkForUpdate();

                if (!cancelled && result.updateAvailable) {
                    // Start immediate (blocking) update if allowed, otherwise flexible
                    await ExpoInAppUpdates.default.startUpdate(true);
                }
            } catch (error) {
                // Native API not available (dev build, emulator, etc.) — fall through to Layer 2
                console.warn("[ForceUpdate] Native check failed, falling back to backend check:", error);
            } finally {
                if (!cancelled) {
                    setNativeCheckDone(true);
                }
            }
        };

        tryNativeUpdate();
        return () => { cancelled = true; };
    }, []);

    // Layer 2: Convex backend fallback check
    useEffect(() => {
        if (!nativeCheckDone) return;
        if (minVersion === undefined) return; // Still loading
        if (minVersion === null) return; // No min version set — no forced update

        if (isAppOutdated(currentVersion, minVersion)) {
            setShowFallbackModal(true);
        }
    }, [nativeCheckDone, minVersion, currentVersion]);

    return {
        showFallbackModal,
        storeUrl: PLAY_STORE_URL,
        currentVersion,
        minVersion: minVersion ?? undefined,
    };
}
