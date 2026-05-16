import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface VerifiedBadgeProps {
    /** Compact inline variant vs full card variant */
    variant?: "inline" | "card";
    label?: string;
}

/**
 * Reusable "Verified Student" badge component.
 * - `inline`: Small pill with icon + text (for profile header, order cards).
 * - `card`: Larger card variant with gradient background (for profile page).
 */
export default function VerifiedBadge({
    variant = "inline",
    label = "Verified Student",
}: VerifiedBadgeProps) {
    if (variant === "card") {
        return (
            <LinearGradient
                colors={["#E8F5E9", "#C8E6C9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
            >
                <View style={styles.cardIconWrap}>
                    <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
                </View>
                <View style={styles.cardTextWrap}>
                    <Text style={styles.cardTitle}>{label}</Text>
                    <Text style={styles.cardSubtitle}>
                        KKR & KSR Institute of Technology and Sciences
                    </Text>
                </View>
            </LinearGradient>
        );
    }

    return (
        <View style={styles.inlineBadge}>
            <Ionicons name="shield-checkmark" size={12} color={Colors.success} />
            <Text style={styles.inlineText}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    // Inline variant
    inlineBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#E8F5E920",
        borderWidth: 1,
        borderColor: Colors.success + "30",
        borderRadius: 20,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        alignSelf: "flex-start",
    },
    inlineText: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.bold,
        color: Colors.success,
    },

    // Card variant
    card: {
        flexDirection: "row",
        alignItems: "center",
        padding: Spacing.md,
        borderRadius: 16,
        marginHorizontal: 20,
        marginBottom: Spacing.md,
        gap: Spacing.sm,
    },
    cardIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.surfaceCard,
        justifyContent: "center",
        alignItems: "center",
    },
    cardTextWrap: {
        flex: 1,
    },
    cardTitle: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: "#2E7D32",
    },
    cardSubtitle: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.regular,
        color: "#4CAF50",
        marginTop: 1,
    },
});
