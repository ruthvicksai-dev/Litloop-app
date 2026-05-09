import AdminAnalyticsBars from "@/components/admin/AdminAnalyticsBars";
import AdminDonutChart from "@/components/admin/AdminDonutChart";
import AdminStackedBarChart from "@/components/admin/AdminStackedBarChart";
import BookLoader from "@/components/ui/feedback/BookLoader";
import { Fonts, FontSizes } from "@/constants/fonts";
import { RENTALS_PAGINATION_OPTS } from "@/constants/pagination";
import { Colors, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/convex/_generated/api";
import {
    formatMonthLabel,
    getCurrentMonthKey,
    getMonthOptions,
    getRevenueMetricsForMonth,
    formatCurrency,
} from "@/utils";
import { useQuery } from "convex/react";
import AdminHeader from "@/components/admin/AdminHeader";
import React, { useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


export default function AdminRevenueScreen() {
    const { accessToken } = useAuth();
    const rentalsQuery = useQuery(
        api.rentals.getAllRentals,
        accessToken
            ? {
                accessToken,
                paginationOpts: RENTALS_PAGINATION_OPTS,
            }
            : "skip"
    );
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
    const [refreshing, setRefreshing] = useState(false);
    const rentals = useMemo(() => rentalsQuery?.page ?? [], [rentalsQuery]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

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
            <AdminHeader title="Revenue Analytics" />
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[Colors.primary]}
                    />
                }
            >
                <Text style={styles.screenSubtitle}>
                    {activeMonthOption?.fullLabel ?? formatMonthLabel(activeMonth)}
                </Text>

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
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md,
    },
    headerLeft: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: -25,
    },
    headerTitle: {
        flex: 1,
        fontSize: FontSizes.title,
        color: Colors.text,
        textAlign: "center",
        fontFamily: Fonts.bold,
    },
    headerSpacer: {
        width: 40,
        marginRight: -25,
    },
    screenSubtitle: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        paddingHorizontal: 20,
        marginBottom: Spacing.md,
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
