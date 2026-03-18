import { useMutation } from "convex/react";
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
        shouldSetBadge: false,
    }),
});

export function useNotifications(userId: Id<"users"> | null) {
    const [expoPushToken, setExpoPushToken] = useState<string>("");
    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);
    const router = useRouter();
    const updateTokenMutation = useMutation(api.notifications.updatePushToken);

    const handleNotificationClick = useCallback(
        (data: Record<string, unknown>) => {
            if (data.type === "rental" && data.rentalId) {
                router.push(`/rental/${data.rentalId}` as any);
            } else if (data.type === "book" && data.bookId) {
                router.push(`/book/${data.bookId}` as any);
            }
        },
        [router]
    );

    useEffect(() => {
        if (!userId) return;

        registerForPushNotificationsAsync().then((token) => {
            if (token) {
                setExpoPushToken(token);
                updateTokenMutation({ userId, pushToken: token });
            }
        });

        notificationListener.current = Notifications.addNotificationReceivedListener(
            (_notification) => {
                // Foreground notification received — nothing extra needed
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
    }, [userId, handleNotificationClick]);

    return { expoPushToken };
}

async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    let token: string | undefined;

    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== "granted") {
            console.log("Failed to get push token — permission denied.");
            return undefined;
        }

        try {
            token = (await Notifications.getExpoPushTokenAsync()).data;
        } catch (e) {
            console.error("Error getting push token:", e);
        }
    } else {
        console.log("Must use a physical device for Push Notifications.");
    }

    return token;
}
