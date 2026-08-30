/**
 * ForceUpdateGate — Fallback blocking modal for when Google's native
 * In-App Updates API is unavailable or hasn't propagated yet.
 *
 * This is NOT the primary update mechanism — it's a defense-in-depth layer
 * controlled by the admin via the Convex `min_app_version` system_state key.
 */

import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, scale, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ForceUpdateGateProps {
    visible: boolean;
    storeUrl: string;
    currentVersion?: string;
    minVersion?: string;
}

export default function ForceUpdateGate({
    visible,
    storeUrl,
    currentVersion,
    minVersion,
}: ForceUpdateGateProps) {
    if (!visible) return null;

    const handleUpdate = () => {
        Linking.openURL(storeUrl).catch(() => {
            // If the Play Store URL fails, try the market URI
            Linking.openURL(`market://details?id=com.ruthvicksai.litloop`).catch(() => {});
        });
    };

    return (
        <Modal
            visible
            transparent
            statusBarTranslucent
            animationType="fade"
            onRequestClose={() => {
                // Intentionally empty — cannot dismiss
            }}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <Ionicons name="arrow-up-circle-outline" size={scale(48)} color={Colors.primary} />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Update Required</Text>

                    {/* Description */}
                    <Text style={styles.body}>
                        A new version of LitLoop is available with important fixes and improvements.
                        Please update to continue using the app.
                    </Text>

                    {/* What's improved */}
                    <View style={styles.featureList}>
                        <FeatureRow icon="bug-outline" text="Critical bug fixes" />
                        <FeatureRow icon="shield-checkmark-outline" text="Security improvements" />
                        <FeatureRow icon="sparkles-outline" text="Better experience" />
                    </View>

                    {/* Version info */}
                    {currentVersion && minVersion && (
                        <Text style={styles.versionInfo}>
                            Your version: {currentVersion} → Required: {minVersion}
                        </Text>
                    )}

                    {/* Update button */}
                    <TouchableOpacity style={styles.updateButton} onPress={handleUpdate} activeOpacity={0.85}>
                        <Ionicons name="download-outline" size={scale(18)} color="#fff" />
                        <Text style={styles.updateText}>Update Now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

function FeatureRow({ icon, text }: { icon: any; text: string }) {
    return (
        <View style={styles.featureRow}>
            <Ionicons name={icon} size={scale(16)} color={Colors.primary} />
            <Text style={styles.featureText}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
        padding: Spacing.xl,
    },
    card: {
        backgroundColor: Colors.surfaceCard,
        borderRadius: Layout.cardRadiusLarge,
        padding: Spacing.xl,
        alignItems: "center",
        gap: Spacing.sm,
        width: "100%",
        maxWidth: 380,
    },
    iconContainer: {
        width: scale(88),
        height: scale(88),
        borderRadius: scale(44),
        backgroundColor: `${Colors.primary}12`,
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
        lineHeight: FontSizes.body * 1.5,
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
    versionInfo: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        textAlign: "center",
    },
    updateButton: {
        backgroundColor: Colors.primary,
        borderRadius: Layout.cardRadius,
        paddingVertical: Spacing.md,
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: Spacing.sm,
        marginTop: Spacing.xs,
    },
    updateText: {
        color: "#fff",
        fontFamily: Fonts.bold,
        fontSize: FontSizes.body,
    },
});
