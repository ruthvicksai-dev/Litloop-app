import { useMutation } from "convex/react";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export function useNotifications(
    userId: Id<"users"> | null,
    accessToken: string | null,
    userRole?: string
) {
    const [expoPushToken, setExpoPushToken] = useState<string>("");
    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);
    const tokenRegistrationRef = useRef<{
        userId: Id<"users">;
        accessToken: string;
        pushToken: string;
    } | null>(null);
    const router = useRouter();
    const updateTokenMutation = useMutation(api.notifications.updatePushToken);
    const clearTokenMutation = useMutation(api.notifications.clearPushToken);

    const handleNotificationClick = useCallback(
        (data: Record<string, unknown>) => {
            if (data.type === "rental") {
                if (userRole === "admin" && data.rentalId) {
                    router.push(`/(admin)/rental/${data.rentalId}` as any);
                } else {
                    router.push("/(tabs)/my-rentals" as any);
                }
            } else if (data.type === "book" && data.bookId) {
                router.push(`/book/${data.bookId}` as any);
            }
        },
        [router, userRole]
    );

    useEffect(() => {
        const previousRegistration = tokenRegistrationRef.current;
        if (
            previousRegistration &&
            (!userId || previousRegistration.userId !== userId)
        ) {
            clearTokenMutation({
                accessToken: previousRegistration.accessToken,
                pushToken: previousRegistration.pushToken,
            }).catch(() => {
                // Ignore cleanup errors during auth transitions
            });
            tokenRegistrationRef.current = null;
            setExpoPushToken("");
        }

        if (!userId || !accessToken) {
            return;
        }

        let isCancelled = false;

        registerForPushNotificationsAsync().then((token) => {
            if (!token || isCancelled) {
                return;
            }

            setExpoPushToken(token);
            updateTokenMutation({ accessToken, pushToken: token }).catch((error) => {
                console.error("Failed to save push token:", error);
            });
            tokenRegistrationRef.current = { userId, accessToken, pushToken: token };
        }).catch((error) => {
            console.error("Push registration failed:", error);
        });

        return () => {
            isCancelled = true;
        };
    }, [userId, accessToken, updateTokenMutation, clearTokenMutation]);

    useEffect(() => {
        notificationListener.current = Notifications.addNotificationReceivedListener(
            () => {
                // Foreground notification received; Expo handles presentation.
            }
        );

        responseListener.current = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                const data = response.notification.request.content.data as Record<string, unknown>;
                handleNotificationClick(data);
            }
        );

        return () => {
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, [handleNotificationClick]);

    useEffect(() => {
        return () => {
            const registration = tokenRegistrationRef.current;
            if (!registration) {
                return;
            }

            clearTokenMutation({
                accessToken: registration.accessToken,
                pushToken: registration.pushToken,
            }).catch(() => {
                // Ignore cleanup errors while unmounting
            });
            tokenRegistrationRef.current = null;
        };
    }, [clearTokenMutation]);

    return { expoPushToken };
}

async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    let token: string | undefined;
    const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;

    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
        });
    }

    // In development mode, we can try to get a token even if we're not on a physical device.
    // Some modern emulators support it, and it gives us better logging.
    if (!Device.isDevice && !__DEV__) {
        console.log("Push notifications require a physical device in production.");
        return undefined;
    }

    if (!projectId) {
        console.warn("Push notifications skipped: missing Expo projectId in app config.");
        return undefined;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    // Do NOT call requestPermissionsAsync here.
    // The system permission dialog is triggered exclusively by the custom
    // NotificationPermissionModal's onAllow handler in _layout.tsx.
    // Calling it here would show the Android system dialog immediately on
    // login, skipping the in-app rationale required by Play Store policy.
    if (existingStatus !== "granted") {
        console.log("[Notifications] Permission not yet granted — awaiting user rationale modal.");
        return undefined;
    }

    try {
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log("[Notifications] Push token generated:", token);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (
            Platform.OS === "android" &&
            message.includes("Default FirebaseApp is not initialized")
        ) {
            console.error(
                "Error getting push token: Android push notifications are not configured. " +
                "Add Firebase `google-services.json`, connect it in Expo config, rebuild the Android app, and then retry."
            );
            return undefined;
        }
        console.error("Error getting push token:", error);
    }

    return token;
}
