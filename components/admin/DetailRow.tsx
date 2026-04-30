import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing, scale } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type DetailRowProps = {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value?: string | number | null;
    accent?: boolean;
};

/**
 * A reusable detail row used in admin screens to display key-value pairs
 * with an icon, label, and value. Supports an optional accent style.
 */
export default function DetailRow({ icon, label, value, accent = false }: DetailRowProps) {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    return (
        <View style={styles.detailRow}>
            <View style={[styles.detailIconWrap, accent && styles.detailIconWrapAccent]}>
                <Ionicons
                    name={icon}
                    size={16}
                    color={accent ? Colors.primary : Colors.textSecondary}
                />
            </View>
            <View style={styles.detailTextWrap}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={[styles.detailValue, accent && styles.detailValueAccent]}>{value}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm + 2,
        backgroundColor: Colors.background,
        borderRadius: Layout.borderRadius,
    },
    detailIconWrap: {
        width: scale(34),
        height: scale(34),
        borderRadius: scale(12),
        backgroundColor: Colors.white,
        alignItems: "center",
        justifyContent: "center",
    },
    detailIconWrapAccent: {
        backgroundColor: `${Colors.primary}12`,
    },
    detailTextWrap: {
        flex: 1,
    },
    detailLabel: {
        fontSize: FontSizes.caption,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
        marginBottom: 2,
    },
    detailValue: {
        fontSize: FontSizes.bodyLarge,
        color: Colors.text,
        fontFamily: Fonts.bold,
    },
    detailValueAccent: {
        color: Colors.primary,
    },
});
