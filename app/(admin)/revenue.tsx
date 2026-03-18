import AdminAnalyticsBars from "@/components/admin/AdminAnalyticsBars";
import AdminDonutChart from "@/components/admin/AdminDonutChart";
import AdminStackedBarChart from "@/components/admin/AdminStackedBarChart";
import BookLoader from "@/components/ui/BookLoader";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { RENTALS_PAGINATION_OPTS } from "@/constants/pagination";
import {
    formatMonthLabel,
    getCurrentMonthKey,
    getMonthOptions,
    getRevenueMetricsForMonth,
} from "@/utils/adminRevenueAnalytics";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 0,
    }).format(value);

export default function AdminRevenueScreen() {
    const router = useRouter();
    const rentalsQuery = useQuery(api.rentals.getAllRentals, {
        paginationOpts: RENTALS_PAGINATION_OPTS,
    });
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
    const rentals = useMemo(() => rentalsQuery?.page ?? [], [rentalsQuery]);

    const monthOptions = useMemo(
        () => getMonthOptions(rentals, 6),
        [rentals]
    );

    const activeMonth =
        monthOptions.find((option) => option.key === selectedMonth)?.key ??
        monthOptions[0]?.key ??
        getCurrentMonthKey();
    const activeMonthOption = monthOptions.find((option) => option.key === activeMonth);

    const metrics = useMemo(
        () => getRevenueMetricsForMonth(rentals, activeMonth),
        [activeMonth, rentals]
    );

    if (rentalsQuery === undefined) {
        return (
            <View style={styles.center}>
                <BookLoader label="Loading revenue..." />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                    <View style={styles.headerText}>
                        <Text style={styles.title}>Revenue Analytics</Text>
                        <Text style={styles.subtitle}>
                            {activeMonthOption?.fullLabel ?? formatMonthLabel(activeMonth)}
                        </Text>
                    </View>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.monthRow}
                    style={styles.monthScroll}
                >
                    {monthOptions.map((option) => {
                        const isActive = option.key === activeMonth;
                        return (
                            <TouchableOpacity
                                key={option.key}
                                style={[styles.monthChip, isActive && styles.monthChipActive]}
                                onPress={() => setSelectedMonth(option.key)}
                            >
                                <Text style={[styles.monthChipText, isActive && styles.monthChipTextActive]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <View style={styles.kpiRow}>
                    <View style={[styles.kpiCard, styles.kpiCardPrimary]}>
                        <Text style={[styles.kpiLabel, styles.kpiLabelPrimary]}>Monthly Revenue</Text>
                        <Text style={[styles.kpiValue, styles.kpiValuePrimary]}>
                            ₹{formatCurrency(metrics.revenue)}
                        </Text>
                    </View>
                    <View style={styles.kpiCard}>
                        <Text style={styles.kpiLabel}>Total Orders</Text>
                        <Text style={styles.kpiValue}>{metrics.totalOrders}</Text>
                    </View>
                    <View style={styles.kpiCard}>
                        <Text style={styles.kpiLabel}>Completed</Text>
                        <Text style={styles.kpiValue}>{metrics.completedOrders}</Text>
                    </View>
                    <View style={styles.kpiCard}>
                        <Text style={styles.kpiLabel}>Pending Value</Text>
                        <Text style={styles.kpiValue}>₹{formatCurrency(metrics.pendingRevenue)}</Text>
                    </View>
                    <View style={styles.kpiCard}>
                        <Text style={styles.kpiLabel}>Avg Order</Text>
                        <Text style={styles.kpiValue}>₹{formatCurrency(metrics.averageOrderValue)}</Text>
                    </View>
                </View>

                <View style={styles.chartGrid}>
                    <View style={styles.chartWide}>
                        <AdminStackedBarChart
                            title="Orders Flow by Week"
                            items={metrics.weeklyTrend}
                            emptyLabel="No weekly order data for this month."
                        />
                    </View>
                    <View style={styles.chartWide}>
                        <AdminDonutChart
                            title="Orders by Payment Method"
                            items={metrics.paymentBreakdown.map((item, index) => ({
                                ...item,
                                color: [Colors.primary, Colors.success, Colors.warning, "#3B82F6"][index % 4],
                            }))}
                            centerLabel="Methods"
                            centerValue={`${metrics.paymentBreakdown.reduce((sum, item) => sum + item.value, 0)}`}
                            emptyLabel="No payment methods recorded yet."
                        />
                    </View>
                    <View style={styles.chartHalf}>
                        <AdminAnalyticsBars
                            title="Orders by Zone"
                            items={metrics.zoneBreakdown}
                            emptyLabel="No zone data available."
                            tone={Colors.warning}
                        />
                    </View>
                    <View style={styles.chartHalf}>
                        <View style={styles.noteCard}>
                            <Text style={styles.noteTitle}>Monthly Snapshot</Text>
                            <Text style={styles.noteText}>
                                {metrics.totalOrders} orders tracked in{" "}
                                {activeMonthOption?.fullLabel ?? formatMonthLabel(activeMonth)}.
                            </Text>
                            <Text style={styles.noteText}>
                                {metrics.completedOrders} completed and ₹{formatCurrency(metrics.pendingRevenue)} still pending.
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.background,
    },
    content: {
        paddingBottom: Spacing.xl,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
        paddingHorizontal: 20,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md,
    },
    backBtn: {
        alignSelf: "flex-start",
        padding: 4,
        marginLeft: -4,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: FontSizes.hero,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    subtitle: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    monthScroll: {
        flexGrow: 0,
        marginBottom: Spacing.md,
    },
    monthRow: {
        paddingHorizontal: 20,
        gap: 8,
    },
    monthChip: {
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 999,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    monthChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    monthChipText: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
    },
    monthChipTextActive: {
        color: Colors.white,
    },
    kpiRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.sm,
        paddingHorizontal: 20,
        marginBottom: Spacing.md,
    },
    kpiCard: {
        flexBasis: "48%",
        flexGrow: 1,
        backgroundColor: Colors.white,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    kpiCardPrimary: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    kpiLabel: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    kpiLabelPrimary: {
        color: Colors.white + "CC",
    },
    kpiValue: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    kpiValuePrimary: {
        color: Colors.white,
    },
    chartGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    chartWide: {
        width: "100%",
    },
    chartHalf: {
        width: "100%",
    },
    noteCard: {
        marginHorizontal: 20,
        marginBottom: Spacing.md,
        padding: Spacing.md,
        borderRadius: 20,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
        minHeight: 190,
        justifyContent: "center",
    },
    noteTitle: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: Spacing.sm,
    },
    noteText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        lineHeight: 22,
        marginBottom: 8,
    },
});
