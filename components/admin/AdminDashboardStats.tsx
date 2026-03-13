import { Colors, Spacing } from "@/constants/theme";
import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type AdminDashboardStatsProps = {
    stats: {
        total: number;
        active: number;
        pending: number;
        completed: number;
    };
};

export default function AdminDashboardStats({
    stats,
}: AdminDashboardStatsProps) {
    return (
        <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: Colors.primary + "15" }]}>
                <Text style={[styles.statNumber, { color: Colors.primary }]}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: "#3B82F615" }]}>
                <Text style={[styles.statNumber, { color: "#3B82F6" }]}>{stats.active}</Text>
                <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: "#F59E0B15" }]}>
                <Text style={[styles.statNumber, { color: "#F59E0B" }]}>{stats.pending}</Text>
                <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: "#10B98115" }]}>
                <Text style={[styles.statNumber, { color: "#10B981" }]}>{stats.completed}</Text>
                <Text style={styles.statLabel}>Done</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    statsRow: {
        flexDirection: "row",
        paddingHorizontal: SCREEN_WIDTH * 0.06,
        gap: 10,
        marginBottom: Spacing.md,
    },
    statCard: {
        flex: 1,
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: "center",
    },
    statNumber: {
        fontSize: SCREEN_WIDTH * 0.055,
        fontWeight: "800",
    },
    statLabel: {
        fontSize: 11,
        fontWeight: "600",
        color: Colors.textSecondary,
        marginTop: 2,
    },
});
