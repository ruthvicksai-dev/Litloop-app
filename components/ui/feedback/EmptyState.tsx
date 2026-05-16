import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type EmptyStateProps = {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    actionLabel?: string;
    onAction?: () => void;
};

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
    return (
        <View style={styles.empty}>
            <View style={styles.iconCircle}>
                <Ionicons
                    name={icon}
                    size={32}
                    color={Colors.primary}
                />
            </View>
            <Text style={styles.emptyTitle} allowFontScaling={false}>
                {title}
            </Text>
            {subtitle ? (
                <Text style={styles.emptySubtitle} allowFontScaling={false}>
                    {subtitle}
                </Text>
            ) : null}
            {actionLabel && onAction ? (
                <Pressable style={styles.actionBtn} onPress={onAction}>
                    <Text style={styles.actionText}>{actionLabel}</Text>
                </Pressable>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    empty: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
        paddingVertical: 56,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: `${Colors.primary}0A`,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: Spacing.md + 4,
        borderWidth: 1,
        borderColor: `${Colors.primary}12`,
    },
    emptyTitle: {
        fontSize: FontSizes.subtitle,
        color: Colors.text,
        fontFamily: Fonts.bold,
        textAlign: "center",
    },
    emptySubtitle: {
        marginTop: Spacing.xs + 2,
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        textAlign: "center",
        lineHeight: 21,
    },
    actionBtn: {
        marginTop: Spacing.md,
        paddingVertical: Spacing.sm + 2,
        paddingHorizontal: Spacing.lg,
        borderRadius: 10,
        backgroundColor: Colors.primary,
    },
    actionText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.white,
    },
});
