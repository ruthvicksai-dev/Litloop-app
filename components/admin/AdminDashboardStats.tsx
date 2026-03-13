import { Fonts } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
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
                <Ionicons name="apps" size={18} color={Colors.primary} />
                <Text style={[styles.statNumber, { color: Colors.primary }]}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: "#3B82F615" }]}>
                <Ionicons name="reader" size={18} color="#3B82F6" />
                <Text style={[styles.statNumber, { color: "#3B82F6" }]}>{stats.active}</Text>
                <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: "#F59E0B15" }]}>
                <Ionicons name="time" size={18} color="#F59E0B" />
                <Text style={[styles.statNumber, { color: "#F59E0B" }]}>{stats.pending}</Text>
                <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: "#10B98115" }]}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
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
        fontSize: SCREEN_WIDTH * 0.05,

        marginTop: 4,
        fontFamily: Fonts.bold,
    },
    statLabel: {
        fontSize: 11,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        marginTop: 2,
    },
});
