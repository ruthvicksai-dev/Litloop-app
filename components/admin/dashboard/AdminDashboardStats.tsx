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
    totalBooks: number;
    monthlyGrowth: number;
};

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 0,
    }).format(value);

function MiniSparkline() {
    const points = [20, 35, 28, 40, 32, 55, 48, 65];
    const max = Math.max(...points);
    const min = Math.min(...points);
    const range = max - min || 1;
    const height = 42;
    const width = 125;

    return (
        <View style={sparkStyles.container}>
            {points.map((val, i) => {
                const x = (i / (points.length - 1)) * (width - 8);
                const y = height - ((val - min) / range) * (height - 10) - 5;
                return (
                    <View
                        key={i}
                        style={[
                            sparkStyles.dot,
                            {
                                left: x,
                                top: y,
                            },
                        ]}
                    />
                );
            })}
            {points.slice(0, -1).map((val, i) => {
                const x1 = (i / (points.length - 1)) * (width - 8) + 2.5;
                const y1 = height - ((val - min) / range) * (height - 10) - 2.5;
                const nextVal = points[i + 1];
                const x2 = ((i + 1) / (points.length - 1)) * (width - 8) + 2.5;
                const y2 = height - ((nextVal - min) / range) * (height - 10) - 2.5;

                const dx = x2 - x1;
                const dy = y2 - y1;
                const len = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                return (
                    <View
                        key={`line-${i}`}
                        style={[
                            sparkStyles.line,
                            {
                                left: x1,
                                top: y1,
                                width: len,
                                transform: [{ rotate: `${angle}deg` }],
                            },
                        ]}
                    />
                );
            })}
        </View>
    );
}

const sparkStyles = StyleSheet.create({
    container: {
        width: 125,
        height: 42,
        position: "relative",
    },
    dot: {
        position: "absolute",
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: Colors.primary,
    },
    line: {
        position: "absolute",
        height: 2,
        backgroundColor: Colors.primary,
        borderRadius: 1,
        transformOrigin: "left center",
    },
});

export default function AdminDashboardStats({
    stats,
    revenue,
    onPressRevenue,
    totalBooks,
    monthlyGrowth,
}: AdminDashboardStatsProps) {
    const statCards = [
        {
            key: "books",
            label: "Total Books",
            value: totalBooks,
            icon: "library" as const,
            color: Colors.primary,
            bgColor: Colors.primary + "15",
            tag: "All Books",
            tagColor: Colors.primary,
        },
        {
            key: "active",
            label: "Active Rentals",
            value: stats.active,
            icon: "book" as const,
            color: "#1E3A8A",
            bgColor: "#1E3A8A15",
            tag: "Currently Active",
            tagColor: "#1E3A8A",
        },
        {
            key: "pending",
            label: "Pending",
            value: stats.pending,
            icon: "time" as const,
            color: "#D97706",
            bgColor: "#D9770615",
            tag: "Needs Attention",
            tagColor: "#D97706",
        },
        {
            key: "completed",
            label: "Completed",
            value: stats.completed,
            icon: "checkmark-circle" as const,
            color: "#059669",
            bgColor: "#05966915",
            tag: "This Month",
            tagColor: "#059669",
        },
    ];

    const growthPositive = monthlyGrowth >= 0;

    return (
        <View style={styles.wrapper}>
            {/* ─── Total Revenue Analytics Card ─── */}
            <TouchableOpacity style={styles.revenueCard} activeOpacity={0.85} onPress={onPressRevenue}>
                <View style={styles.revenueRow}>
                    {/* Left: Title + Amount + Sparkline + Growth */}
                    <View style={styles.revenueLeft}>
                        <Text style={styles.revenueEyebrow}>Total Revenue</Text>
                        <Text style={styles.revenueAmount}>₹{formatCurrency(revenue.monthlyRevenue)}</Text>
                        <MiniSparkline />
                        <View style={styles.growthRow}>
                            <Ionicons
                                name={growthPositive ? "trending-up" : "trending-down"}
                                size={13}
                                color={growthPositive ? "#059669" : Colors.error}
                            />
                            <Text
                                style={[
                                    styles.growthText,
                                    { color: growthPositive ? "#059669" : Colors.error },
                                ]}
                            >
                                {growthPositive ? "+" : ""}{monthlyGrowth}% vs last month
                            </Text>
                        </View>
                    </View>

                    {/* Right: Month + Orders */}
                    <View style={styles.revenueRight}>
                        <View style={styles.revenueMetricCard}>
                            <View style={styles.metricIconRow}>
                                <Ionicons name="calendar-outline" size={13} color={Colors.primary} />
                                <Text style={styles.metricLabel}>This Month</Text>
                            </View>
                            <Text style={styles.metricValue}>{revenue.currentMonthLabel}</Text>
                        </View>
                        <View style={styles.revenueMetricCard}>
                            <Text style={styles.metricLabel}>Total Orders</Text>
                            <Text style={styles.metricValueLarge}>{revenue.monthlyOrders}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>

            {/* ─── 4 Transparent Stat Boxes in 1 Row ─── */}
            <View style={styles.statCardsRow}>
                {statCards.map((item) => (
                    <View key={item.key} style={styles.statCard}>
                        <View style={[styles.statIconWrap, { backgroundColor: item.bgColor }]}>
                            <Ionicons name={item.icon} size={18} color={item.color} />
                        </View>
                        <Text
                            style={styles.statLabel}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.75}
                        >
                            {item.label}
                        </Text>
                        <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
                        <View style={[styles.statTag, { backgroundColor: item.tagColor + "15" }]}>
                            <Text
                                style={[styles.statTagText, { color: item.tagColor }]}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.75}
                            >
                                {item.tag}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        paddingHorizontal: 14,
        gap: 12,
        marginTop: Spacing.sm,
    },
    // Total Revenue Card
    revenueCard: {
        backgroundColor: "rgba(255,255,255,0.72)",
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.9)",
    },
    revenueRow: {
        flexDirection: "row",
        gap: 12,
        alignItems: "center",
    },
    revenueLeft: {
        flex: 1,
    },
    revenueEyebrow: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 2,
    },
    revenueAmount: {
        fontSize: FontSizes.heading,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 4,
    },
    growthRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        marginTop: 5,
    },
    growthText: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.bold,
    },
    revenueRight: {
        justifyContent: "space-between",
        gap: 8,
        minWidth: 108,
    },
    revenueMetricCard: {
        backgroundColor: "rgba(255,255,255,0.6)",
        borderRadius: 12,
        paddingVertical: 9,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.8)",
    },
    metricIconRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        marginBottom: 2,
    },
    metricLabel: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
    },
    metricValue: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    metricValueLarge: {
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    // 4 Transparent Stat Items in 1 Row
    statCardsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "stretch",
        gap: 6,
    },
    statCard: {
        flex: 1,
        backgroundColor: "transparent",
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 2,
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: 110,
    },
    statIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 10,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        textAlign: "center",
        paddingHorizontal: 2,
    },
    statValue: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        marginVertical: 2,
        textAlign: "center",
    },
    statTag: {
        alignSelf: "center",
        paddingHorizontal: 5,
        paddingVertical: 3,
        borderRadius: 8,
        maxWidth: "95%",
    },
    statTagText: {
        fontSize: 9,
        fontFamily: Fonts.bold,
        textAlign: "center",
    },
});
