import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing, scale } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type SummaryStatProps = {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
};

/**
 * A compact stat chip used in admin overview cards.
 * Shows an icon, a bold value, and a small label beneath it.
 */
export default function SummaryStat({ icon, label, value }: SummaryStatProps) {
    return (
        <View style={styles.summaryStat}>
            <View style={styles.summaryStatIcon}>
                <Ionicons name={icon} size={12} color={Colors.primary} />
            </View>
            <View style={styles.summaryStatText}>
                <Text
                    style={styles.summaryStatValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.9}
                >
                    {value}
                </Text>
                <Text
                    style={styles.summaryStatLabel}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.9}
                >
                    {label}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    summaryStat: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
        backgroundColor: "rgba(255,255,255,0.72)",
        borderRadius: 999,
        paddingVertical: Spacing.xs + 2,
        paddingHorizontal: Spacing.sm,
        flex: 1,
        minWidth: 0,
        minHeight: scale(46),
    },
    summaryStatIcon: {
        width: Layout.badgeInset + scale(10),
        height: Layout.badgeInset + scale(10),
        borderRadius: 999,
        backgroundColor: Colors.white,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    summaryStatText: {
        flex: 1,
        minWidth: 0,
        justifyContent: "center",
    },
    summaryStatValue: {
        fontSize: FontSizes.body,
        color: Colors.text,
        fontFamily: Fonts.bold,
        lineHeight: scale(16),
    },
    summaryStatLabel: {
        fontSize: FontSizes.tiny,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
        marginTop: 1,
        lineHeight: scale(12),
    },
});
