import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type AdminDashboardStatsProps = {
    stats: {
        total: number;
        active: number;
        pending: number;
        completed: number;
    };
    revenue: {
        monthlyRevenue: number;
        monthlyOrders: number;
        currentMonthLabel: string;
    };
    onPressRevenue: () => void;
};

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 0,
    }).format(value);

export default function AdminDashboardStats({
    stats,
    revenue,
    onPressRevenue,
}: AdminDashboardStatsProps) {
    const items = [
        {
            key: "total",
            label: "Total",
            value: stats.total,
            icon: "apps" as const,
            color: Colors.primary,
            backgroundColor: Colors.primary + "15",
        },
        {
            key: "active",
            label: "Active",
            value: stats.active,
            icon: "reader" as const,
            color: "#1E3A8A",
            backgroundColor: "#1E3A8A15",
        },
        {
            key: "pending",
            label: "Pending",
            value: stats.pending,
            icon: "time" as const,
            color: "#b98325",
            backgroundColor: "#b9832515",
        },
        {
            key: "completed",
            label: "Done",
            value: stats.completed,
            icon: "checkmark-circle" as const,
            color: "#137252",
            backgroundColor: "#13725210",
        },
    ];

    return (
        <View style={styles.statsRow}>
            <TouchableOpacity style={styles.revenueCard} activeOpacity={0.9} onPress={onPressRevenue}>
                <View style={styles.revenueHeader}>
                    <View>
                        <Text style={styles.revenueEyebrow}>Revenue</Text>
                        <Text style={styles.revenueTitle}>₹{formatCurrency(revenue.monthlyRevenue)}</Text>
                    </View>
                    <View style={styles.revenueIconWrap}>
                        <Ionicons name="wallet-outline" size={20} color={Colors.primary} />
                    </View>
                </View>
                <View style={styles.revenueMetricsRow}>
                    <View style={styles.revenueMetric}>
                        <Text style={styles.revenueMetricLabel}>Month</Text>
                        <Text style={styles.revenueMetricValue}>{revenue.currentMonthLabel}</Text>
                    </View>
                    <View style={styles.revenueMetric}>
                        <Text style={styles.revenueMetricLabel}>Orders</Text>
                        <Text style={styles.revenueMetricValue}>{revenue.monthlyOrders}</Text>
                    </View>
                </View>
                <Text style={styles.revenueLink}>View revenue analytics</Text>
            </TouchableOpacity>
            {items.map((item) => (
                <View
                    key={item.key}
                    style={[
                        styles.statCard,
                        { backgroundColor: item.backgroundColor },
                    ]}
                >
                    <View style={styles.cardTop}>
                        <View style={[styles.iconWrap, { backgroundColor: item.color }]}>
                            <Ionicons name={item.icon} size={18} color={Colors.white} />
                        </View>
                        <View style={[styles.valueBadge, { backgroundColor: item.color + "18" }]}>
                            <Text style={[styles.statNumber, { color: item.color }]}>{item.value}</Text>
                        </View>
                    </View>
                    <Text style={styles.statLabel}>{item.label}</Text>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    statsRow: {
        flexDirection: "row",
        paddingHorizontal: 20,
        gap: 10,
        marginBottom: Spacing.md,
        flexWrap: "wrap",
    },
    revenueCard: {
        width: "100%",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 24,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    revenueHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    revenueEyebrow: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 0.6,
    },
    revenueTitle: {
        fontSize: FontSizes.heading,
        fontFamily: Fonts.bold,
        color: Colors.primary,
        marginTop: 2,
    },
    revenueIconWrap: {
        width: 36,
        aspectRatio: 1,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.primaryLight,
    },
    revenueMetricsRow: {
        flexDirection: "row",
        gap: 8,
    },
    revenueMetric: {
        flex: 1,
        backgroundColor: Colors.background,
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    revenueMetricLabel: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    revenueMetricValue: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    revenueLink: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.medium,
        color: Colors.primary,
        marginTop: 10,
    },
    statCard: {
        flexBasis: "47%",
        flexGrow: 1,
        minHeight: 108,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 24,
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cardTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    iconWrap: {
        width: 36,
        aspectRatio: 1,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    valueBadge: {
        minWidth: 52,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
    },
    statNumber: {
        fontSize: FontSizes.titleLarge,
        fontFamily: Fonts.bold,
    },
    statLabel: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginTop: 10,
    },
});
