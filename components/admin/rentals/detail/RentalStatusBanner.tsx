import { FontSizes, Fonts } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface RentalStatusBannerProps {
    statusColor: string;
    statusLabel: string;
    createdAt: number;
}

export default function RentalStatusBanner({ statusColor, statusLabel, createdAt }: RentalStatusBannerProps) {
    return (
        <View style={styles.statusBanner}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
            <Text style={styles.statusDate}>
                {new Date(createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    statusBanner: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        marginTop: Spacing.sm,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: Spacing.sm,
    },
    statusLabel: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        flex: 1,
    },
    statusDate: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
    },
});
