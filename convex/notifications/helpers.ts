export const NOTIFICATION_RATE_LIMITS = {
    subscribeToBook: {
        limit: 10,
        windowMs: 60 * 60 * 1000,
        message: "Too many notification subscriptions. Please try again later.",
    },
} as const;

export const MARK_ALL_READ_BATCH_SIZE = 100;
export const RECONCILE_BOOKS_CURSOR_KEY = "reconcile_available_copies_cursor";
export const RECONCILE_BOOKS_BATCH_SIZE = 50;

export function isExpoPushToken(token: string) {
    return token.startsWith("ExponentPushToken") || token.startsWith("ExpoPushToken");
}

export async function sendPush(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>
) {
    if (!token || !isExpoPushToken(token)) {
        return;
    }

    const message = {
        to: token,
        sound: "default",
        title,
        body,
        data: data ?? {},
        priority: "high",
        channelId: "default",
    };

    try {
        const response = await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Accept-encoding": "gzip, deflate",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(message),
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
            console.error("Expo push request failed:", payload ?? response.statusText);
            return;
        }

        if (payload?.errors?.length) {
            console.error("Expo push request errors:", payload.errors);
        }

        const tickets = Array.isArray(payload?.data)
            ? payload.data
            : payload?.data
                ? [payload.data]
                : [];

        for (const ticket of tickets) {
            if (ticket?.status === "error") {
                console.error("Expo push ticket error:", ticket);
            }
        }
    } catch (error) {
        console.error("Failed to send push notification:", error);
    }
}
