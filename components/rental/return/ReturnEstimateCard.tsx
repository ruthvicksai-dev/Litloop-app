import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";

interface ReturnEstimateCardProps {
    estimatedDays: number;
    rentPerDay: number | undefined;
    estimatedRent: number;
}

export default function ReturnEstimateCard({
    estimatedDays,
    rentPerDay,
    estimatedRent,
}: ReturnEstimateCardProps) {
    if (estimatedDays <= 0) return null;

    return (
        <View style={styles.estimateCard}>
            <Text style={styles.estimateTitle}>Rent Estimate</Text>
            <View style={styles.estimateRow}>
                <Text style={styles.estimateLabel}>Days</Text>
                <Text style={styles.estimateValue}>{estimatedDays}</Text>
            </View>
            <View style={styles.estimateRow}>
                <Text style={styles.estimateLabel}>Rate</Text>
                <Text style={styles.estimateValue}>₹{rentPerDay ?? 0}/day</Text>
            </View>
            <View style={[styles.estimateRow, styles.totalRow]}>
                <Text style={[styles.estimateLabel, styles.totalLabel]}>Total</Text>
                <Text style={styles.totalValue}>₹{estimatedRent}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    estimateCard: {
        backgroundColor: Colors.surfaceCard,
        borderRadius: 12,
        padding: Spacing.md,
        marginTop: Spacing.md,
    },
    estimateTitle: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: Spacing.sm,
    },
    estimateRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    estimateLabel: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
    },
    estimateValue: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.text,
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingTop: 8,
        marginTop: 4,
    },
    totalLabel: {
        fontFamily: Fonts.bold,
    },
    totalValue: {
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
});
