import AdminAnalyticsBars from "@/components/admin/AdminAnalyticsBars";
import AdminDonutChart from "@/components/admin/AdminDonutChart";
import AdminLineChart from "@/components/admin/AdminLineChart";
import StatCard from "@/components/admin/StatCard";
import AdminVerticalBarChart from "@/components/admin/AdminVerticalBarChart";
import BookLoader from "@/components/ui/BookLoader";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FILTERS = [
    { key: "7d", label: "Last 7 Days" },
    { key: "30d", label: "Last 30 Days" },
    { key: "6m", label: "Last 6 Months" },
    { key: "1y", label: "Last Year" },
] as const;

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 0,
    }).format(value);

export default function AdminAnalyticsDashboard() {
    const router = useRouter();
    const [range, setRange] = useState<(typeof FILTERS)[number]["key"]>("30d");
    const [refreshing, setRefreshing] = useState(false);
    const analytics = useQuery(api.analytics.getDashboardAnalytics, { range });

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    if (!analytics) {
        return (
            <View style={styles.center}>
                <BookLoader label="Loading analytics..." />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
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
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                    <View style={styles.headerText}>
                        <Text style={styles.title}>Analytics Dashboard</Text>
                        <Text style={styles.subtitle}>Marketplace performance overview</Text>
                    </View>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterRow}
                    style={styles.filterScroll}
                >
                    {FILTERS.map((filter) => {
                        const isActive = filter.key === range;
                        return (
                            <TouchableOpacity
                                key={filter.key}
                                style={[styles.filterChip, isActive && styles.filterChipActive]}
                                onPress={() => setRange(filter.key)}
                            >
                                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                                    {filter.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <View style={styles.statsGrid}>
                    <StatCard
                        label="Total Revenue"
                        value={`₹${formatCurrency(analytics.kpis.totalRevenue)}`}
                        icon="wallet-outline"
                    />
                    <StatCard
                        label="Revenue This Month"
                        value={`₹${formatCurrency(analytics.kpis.revenueThisMonth)}`}
                        icon="trending-up-outline"
                        tint={Colors.success}
                    />
                    <StatCard
                        label="Active Rentals"
                        value={analytics.kpis.activeRentals}
                        icon="book-outline"
                        tint={Colors.warning}
                    />
                    <StatCard
                        label="Total Users"
                        value={analytics.kpis.totalUsers}
                        icon="people-outline"
                        tint="#3B82F6"
                    />
                </View>

                <View style={styles.chartCard}>
                    <AdminVerticalBarChart
                        title="Monthly Revenue"
                        items={analytics.charts.monthlyRevenue}
                        emptyLabel="No monthly revenue data yet."
                        tone={Colors.primary}
                    />
                </View>

                <View style={styles.chartCard}>
                    <AdminLineChart
                        title="Daily Rentals"
                        points={analytics.charts.dailyRentals}
                        emptyLabel="No daily rental data yet."
                        tone={Colors.success}
                    />
                </View>

                <View style={styles.chartCard}>
                    <AdminDonutChart
                        title="Rentals by Genre"
                        items={analytics.charts.rentalsByGenre.map((item, index) => ({
                            label: item.name,
                            value: item.rentals,
                            color: [Colors.primary, Colors.success, Colors.warning, "#3B82F6", "#8B5CF6"][index % 5],
                        }))}
                        centerLabel="Genres"
                        centerValue={`${analytics.charts.rentalsByGenre.reduce((sum, item) => sum + item.rentals, 0)}`}
                        emptyLabel="No genre analytics available yet."
                    />
                </View>

                <AdminAnalyticsBars
                    title="Top Rented Books"
                    items={analytics.charts.topBooksByRentals.map((item) => ({
                        label: item.title,
                        value: item.rentals,
                    }))}
                    emptyLabel="No book rental analytics yet."
                    tone={Colors.primary}
                />

                <View style={styles.leaderboardCard}>
                    <Text style={styles.chartTitle}>Top 10 Most Rented Books</Text>
                    {analytics.leaderboards.topRentedBooks.map((book, index) => (
                        <View key={`${book.bookId}-rentals`} style={styles.leaderRow}>
                            <Text style={styles.rank}>{index + 1}</Text>
                            <Text style={styles.leaderLabel} numberOfLines={1}>
                                {book.title}
                            </Text>
                            <Text style={styles.leaderValue}>{book.rentals}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.leaderboardCard}>
                    <Text style={styles.chartTitle}>Top Revenue Generating Books</Text>
                    {analytics.leaderboards.topRevenueBooks.map((book, index) => (
                        <View key={`${book.bookId}-revenue`} style={styles.leaderRow}>
                            <Text style={styles.rank}>{index + 1}</Text>
                            <Text style={styles.leaderLabel} numberOfLines={1}>
                                {book.title}
                            </Text>
                            <Text style={styles.leaderValue}>₹{formatCurrency(book.revenue)}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.leaderboardCard}>
                    <Text style={styles.chartTitle}>Top Genres by Rentals</Text>
                    {analytics.leaderboards.topGenres.map((genre, index) => (
                        <View key={`${genre.genre}-${index}`} style={styles.leaderRow}>
                            <Text style={styles.rank}>{index + 1}</Text>
                            <Text style={styles.leaderLabel} numberOfLines={1}>
                                {genre.genre}
                            </Text>
                            <Text style={styles.leaderValue}>{genre.rentals}</Text>
                        </View>
                    ))}
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
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    subtitle: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    filterScroll: {
        flexGrow: 0,
        marginBottom: Spacing.md,
    },
    filterRow: {
        paddingHorizontal: 20,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 999,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterChipText: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
    },
    filterChipTextActive: {
        color: Colors.white,
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.sm,
        paddingHorizontal: 20,
        marginBottom: Spacing.md,
    },
    chartCard: {
        marginBottom: 0,
    },
    leaderboardCard: {
        marginHorizontal: 20,
        marginBottom: Spacing.md,
        padding: Spacing.md,
        borderRadius: 20,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    chartTitle: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: Spacing.sm,
    },
    leaderRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border + "60",
    },
    rank: {
        width: 24,
        fontSize: FontSizes.small,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
    leaderLabel: {
        flex: 1,
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.text,
        marginRight: 12,
    },
    leaderValue: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.bold,
        color: Colors.textSecondary,
    },
});
