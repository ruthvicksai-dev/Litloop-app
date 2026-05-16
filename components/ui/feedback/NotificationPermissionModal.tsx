/**
 * P4: Notification Permission Rationale Modal
 *
 * Google Play Store policy requires an in-app rationale BEFORE requesting
 * POST_NOTIFICATIONS on Android 13+. Show this once per install using
 * SecureStore to persist the "shown" flag.
 *
 * Usage:
 *   const { shouldShow, onAllow, onDecline } = useNotificationRationale();
 *   <NotificationPermissionModal visible={shouldShow} onAllow={onAllow} onDecline={onDecline} />
 */

import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, scale, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const NOTIFICATION_RATIONALE_KEY = "litloop_notification_rationale_shown";

export function useNotificationRationale() {
    const [shouldShow, setShouldShow] = useState(false);

    useEffect(() => {
        (async () => {
            const alreadyShown = await SecureStore.getItemAsync(NOTIFICATION_RATIONALE_KEY);

            if (!alreadyShown) {
                setShouldShow(true);
                return;
            }

            // Self-healing: the flag may have been written by old code that fired
            // the system dialog directly (without showing the custom modal first).
            // If permission is still "undetermined", the user hasn't actually
            // responded to the modal yet — reset the flag and show the modal.
            const { status } = await Notifications.getPermissionsAsync();
            if (status === "undetermined") {
                await SecureStore.deleteItemAsync(NOTIFICATION_RATIONALE_KEY);
                setShouldShow(true);
            }
        })();
    }, []);

    const onAllow = async (onGranted: () => void) => {
        await SecureStore.setItemAsync(NOTIFICATION_RATIONALE_KEY, "true");
        setShouldShow(false);
        onGranted();
    };

    const onDecline = async () => {
        await SecureStore.setItemAsync(NOTIFICATION_RATIONALE_KEY, "true");
        setShouldShow(false);
    };

    return { shouldShow, onAllow, onDecline };
}

interface NotificationPermissionModalProps {
    visible: boolean;
    onAllow: (onGranted: () => void) => void;
    onDecline: () => void;
    onGranted: () => void;
}

export function NotificationPermissionModal({
    visible,
    onAllow,
    onDecline,
    onGranted,
}: NotificationPermissionModalProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onDecline}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="notifications-outline" size={scale(44)} color={Colors.primary} />
                    </View>
                    <Text style={styles.title}>Stay in the Loop 📚</Text>
                    <Text style={styles.body}>
                        Allow Lit Loop to send you notifications for:
                    </Text>
                    <View style={styles.featureList}>
                        <FeatureRow icon="bicycle-outline" text="Delivery & pickup updates" />
                        <FeatureRow icon="checkmark-circle-outline" text="Rental approval status" />
                        <FeatureRow icon="book-outline" text="Book availability alerts" />
                    </View>
                    <Text style={styles.disclaimer}>
                        You can change this anytime in your phone{`'`}s Settings.
                    </Text>
                    <TouchableOpacity
                        style={styles.allowButton}
                        onPress={() => onAllow(onGranted)}
                    >
                        <Text style={styles.allowText}>Allow Notifications</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.skipButton} onPress={onDecline}>
                        <Text style={styles.skipText}>Not Now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

function FeatureRow({ icon, text }: { icon: any; text: string }) {
    return (
        <View style={styles.featureRow}>
            <Ionicons name={icon} size={scale(18)} color={Colors.primary} />
            <Text style={styles.featureText}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    card: {
        backgroundColor: Colors.surfaceCard,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: Spacing.xl,
        alignItems: "center",
        gap: Spacing.sm,
        paddingBottom: Spacing.xl * 1.5,
    },
    iconContainer: {
        width: scale(80),
        height: scale(80),
        borderRadius: scale(40),
        backgroundColor: `${Colors.primary}15`,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: Spacing.xs,
    },
    title: {
        fontSize: FontSizes.titleLarge,
        fontFamily: Fonts.bold,
        color: Colors.text,
        textAlign: "center",
    },
    body: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        textAlign: "center",
    },
    featureList: {
        width: "100%",
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
    },
    featureRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
    },
    featureText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.text,
    },
    disclaimer: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        textAlign: "center",
    },
    allowButton: {
        backgroundColor: Colors.primary,
        borderRadius: Layout.cardRadius,
        paddingVertical: Spacing.md,
        width: "100%",
        alignItems: "center",
        marginTop: Spacing.xs,
    },
    allowText: {
        color: "#fff",
        fontFamily: Fonts.bold,
        fontSize: FontSizes.body,
    },
    skipButton: {
        paddingVertical: Spacing.sm,
        width: "100%",
        alignItems: "center",
    },
    skipText: {
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        fontSize: FontSizes.body,
    },
});
