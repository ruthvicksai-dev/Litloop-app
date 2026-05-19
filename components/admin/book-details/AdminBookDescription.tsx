import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";

interface AdminBookDescriptionProps {
    description: string;
    isExpanded: boolean;
    onToggleExpand: () => void;
}

export default function AdminBookDescription({
    description,
    isExpanded,
    onToggleExpand,
}: AdminBookDescriptionProps) {
    return (
        <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text
                style={styles.descriptionText}
                numberOfLines={isExpanded ? undefined : 3}
            >
                {description}
            </Text>
            {description.length > 140 && (
                <TouchableOpacity
                    onPress={onToggleExpand}
                    activeOpacity={0.8}
                >
                    <Text style={styles.toggleText}>
                        {isExpanded ? "View less" : "View more"}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    sectionCard: {
        paddingTop: Spacing.xs,
        paddingBottom: Spacing.md,
        paddingHorizontal: Spacing.xs,
        marginBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.05)",
    },
    sectionLabel: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: Spacing.sm,
    },
    descriptionText: {
        fontSize: FontSizes.bodyLarge,
        color: Colors.textSecondary,
        lineHeight: 24,
        letterSpacing: 0.2,
        fontFamily: Fonts.regular,
    },
    toggleText: {
        fontSize: FontSizes.body,
        color: Colors.primary,
        fontFamily: Fonts.medium,
        marginTop: Spacing.xs,
    },
});
