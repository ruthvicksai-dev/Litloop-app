import { Shadows } from "@/constants/designTokens";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type RentalFilterPanelProps = {
    visible: boolean;
    statusFilter: string;
    timeframeFilter: string;
    onFilterChange: (type: "status" | "time", value: string) => void;
};

export default function RentalFilterPanel({
    visible,
    statusFilter,
    timeframeFilter,
    onFilterChange,
}: RentalFilterPanelProps) {
    if (!visible) return null;

    return (
        <View style={styles.filterPanel}>
            <Text style={styles.filterSectionTitle} allowFontScaling={false}>
                Status
            </Text>
            <View style={styles.filterRow}>
                {[
                    { label: "All Orders", value: "all" },
                    { label: "Paid", value: "paid" },
                    { label: "Returned", value: "returned" },
                ].map((option) => {
                    const isActive = statusFilter === option.value;

                    return (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.filterChip,
                                styles.filterChipThird,
                                isActive && styles.filterChipActive,
                            ]}
                            onPress={() => onFilterChange("status", option.value)}
                            activeOpacity={0.85}
                        >
                            <Text
                                style={[
                                    styles.filterChipText,
                                    isActive && styles.filterChipTextActive,
                                ]}
                                allowFontScaling={false}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.8}
                            >
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <Text style={styles.filterSectionTitle} allowFontScaling={false}>
                Time
            </Text>
            <View style={styles.filterRow}>
                {[
                    { label: "All Time", value: "all" },
                    { label: "Last 30 Days", value: "last_30_days" },
                    { label: "This Month", value: "this_month" },
                    { label: "This Year", value: "this_year" },
                ].map((option) => {
                    const isActive = timeframeFilter === option.value;

                    return (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.filterChip,
                                styles.filterChipHalf,
                                isActive && styles.filterChipActive,
                            ]}
                            onPress={() => onFilterChange("time", option.value)}
                            activeOpacity={0.85}
                        >
                            <Text
                                style={[
                                    styles.filterChipText,
                                    isActive && styles.filterChipTextActive,
                                ]}
                                allowFontScaling={false}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.8}
                            >
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    filterPanel: {
        marginHorizontal: Layout.screenPaddingWide,
        marginTop: Spacing.md,
        marginBottom: Spacing.md,
        backgroundColor: Colors.surfaceCard,
        borderRadius: Layout.cardRadius,
        padding: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.borderSubtle,
        ...Shadows.subtle,
    },
    filterSectionTitle: {
        fontSize: FontSizes.tiny,
        color: Colors.textSecondary,
        fontFamily: Fonts.bold,
        marginBottom: 6,
    },
    filterRow: {
        flexDirection: "row",
        flexWrap: "nowrap",
        gap: 6,
        marginBottom: Spacing.sm,
    },
    filterChip: {
        flex: 1,
        minHeight: 38,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: Colors.surfaceCard,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    filterChipThird: {
        paddingHorizontal: 6,
    },
    filterChipHalf: {
        paddingHorizontal: 6,
    },
    filterChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterChipText: {
        fontSize: FontSizes.tiny,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
        textAlign: "center",
    },
    filterChipTextActive: {
        color: Colors.white,
    },
});
