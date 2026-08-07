import { FontSizes, Fonts } from "@/constants/fonts";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface RentalStatusBannerProps {
    statusColor: string;
    statusLabel: string;
    createdAt: number;
}

export default function RentalStatusBanner({ statusColor, statusLabel, createdAt }: RentalStatusBannerProps) {
    const formattedDate = new Date(createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <View style={styles.bannerRow}>
            <View style={styles.leftGroup}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
            </View>
            <View style={styles.dateBadge}>
                <Ionicons name="time-outline" size={12} color={Colors.textSecondary} />
                <Text style={styles.statusDate}>{formattedDate}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    bannerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 12,
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.05)",
    },
    leftGroup: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    statusLabel: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
    },
    dateBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "rgba(0,0,0,0.03)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusDate: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
    },
});
