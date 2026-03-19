import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type EmptyStateProps = {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
};

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
    return (
        <View style={styles.empty}>
            <Ionicons
                name={icon}
                size={48}
                color={Colors.textLight}
                style={{ marginBottom: Spacing.md }}
            />
            <Text style={styles.emptyTitle} allowFontScaling={false}>
                {title}
            </Text>
            {subtitle ? (
                <Text style={styles.emptySubtitle} allowFontScaling={false}>
                    {subtitle}
                </Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    empty: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingVertical: 56,
    },
    emptyTitle: {
        fontSize: FontSizes.subtitle,
        color: Colors.text,
        fontFamily: Fonts.bold,
        textAlign: "center",
    },
    emptySubtitle: {
        marginTop: Spacing.xs,
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        textAlign: "center",
    },
});
