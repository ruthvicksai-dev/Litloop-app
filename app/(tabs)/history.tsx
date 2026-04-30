import { RentalHistoryCard } from "@/components/history/RentalHistoryCard";
import { GuestView } from "@/components/profile/GuestProfileView";
import { EmptyState } from "@/components/ui/feedback/EmptyState";
import { RentalHistorySkeleton } from "@/components/ui/skeletons/RentalHistorySkeleton";
import { Skeleton } from "@/components/ui/skeletons/Skeleton";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/convex/_generated/api";
import { useFadeSlideIn, useRentalFilters } from "@/hooks";
import { triggerHaptic } from "@/utils/haptics";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    Animated,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RentalHistoryScreen() {
    const { user, userId, accessToken, isLoading } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const {
        statusFilter,
        setStatusFilter,
        timeframeFilter,
        setTimeframeFilter,
        showFilters,
        toggleFilters,
    } = useRentalFilters();

    const history = useQuery(
        api.rentals.getRentalHistory,
        userId && accessToken
            ? { userId, accessToken, status: statusFilter, timeframe: timeframeFilter }
            : "skip"
    );
    const { fadeAnim, slideAnim } = useFadeSlideIn();
    const [expandedRentalId, setExpandedRentalId] = useState<string | null>(null);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        triggerHaptic("light");
        // Convex queries auto-refresh, so we just simulate a delay for UX
        setTimeout(() => setRefreshing(false), 800);
    }, []);

    const handleFilterPress = (type: "status" | "time", value: string) => {
        triggerHaptic("light");
        if (type === "status") {
            setStatusFilter(value as any);
        } else {
            setTimeframeFilter(value as any);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Skeleton width={180} height={32} style={{ marginBottom: 8 }} />
                    <Skeleton width={150} height={16} />
                </View>
                <View style={styles.list}>
                    <RentalHistorySkeleton />
                    <RentalHistorySkeleton />
                    <RentalHistorySkeleton />
                </View>
            </SafeAreaView>
        );
    }

    if (!user) {
        return (
            <GuestView
                title="Sign in for history"
                subtitle="View your past rentals and returned books by signing in to your account!"
                headerTitle="Rental History"
                icon="time-outline"
            />
        );
    }

    if (user.role === "admin") {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <Text style={styles.title}>Admin Access</Text>
                    <Text style={[styles.subtitle, { textAlign: "center", paddingHorizontal: 40, marginTop: 8 }]}>
                        Rental history is managed through the Admin Dashboard.
                    </Text>
                    <TouchableOpacity
                        style={{ marginTop: 24 }}
                        onPress={() => router.replace("/(admin)/dashboard")}
                    >
                        <Text style={{ color: Colors.primary, fontFamily: Fonts.bold, fontSize: FontSizes.subtitle }}>
                            Go to Dashboard
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (history === undefined) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Skeleton width={180} height={32} style={{ marginBottom: 8 }} />
                    <Skeleton width={150} height={16} />
                </View>
                <View style={styles.list}>
                    <RentalHistorySkeleton />
                    <RentalHistorySkeleton />
                    <RentalHistorySkeleton />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
            <Animated.View
                style={[
                    styles.header,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                <View style={styles.headerTopRow}>
                    <View style={styles.headerTextWrap}>
                        <Text style={styles.title} allowFontScaling={false}>
                            Rental History
                        </Text>
                        <Text style={styles.subtitle} allowFontScaling={false}>
                            Past completed rentals
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => {
                            triggerHaptic("light");
                            toggleFilters();
                        }}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="filter-outline" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
                {showFilters ? (
                    <View style={styles.filterPanel}>
                        <Text style={styles.filterSectionTitle} allowFontScaling={false}>
                            Status
                        </Text>
                        <View style={styles.filterRow}>
                            {[
                                { label: "All Orders", value: "all" },
                                { label: "Paid", value: "paid" },
                                { label: "Returned", value: "returned" },
                            ].map((option) => {
                                const isActive = statusFilter === option.value;

                                return (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[
                                            styles.filterChip,
                                            styles.filterChipThird,
                                            isActive && styles.filterChipActive,
                                        ]}
                                        onPress={() => handleFilterPress("status", option.value)}
                                        activeOpacity={0.85}
                                    >
                                        <Text
                                            style={[
                                                styles.filterChipText,
                                                isActive && styles.filterChipTextActive,
                                            ]}
                                            allowFontScaling={false}
                                            numberOfLines={1}
                                            adjustsFontSizeToFit
                                            minimumFontScale={0.8}
                                        >
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={styles.filterSectionTitle} allowFontScaling={false}>
                            Time
                        </Text>
                        <View style={styles.filterRow}>
                            {[
                                { label: "All Time", value: "all" },
                                { label: "Last 30 Days", value: "last_30_days" },
                                { label: "This Month", value: "this_month" },
                                { label: "This Year", value: "this_year" },
                            ].map((option) => {
                                const isActive = timeframeFilter === option.value;

                                return (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[
                                            styles.filterChip,
                                            styles.filterChipHalf,
                                            isActive && styles.filterChipActive,
                                        ]}
                                        onPress={() => handleFilterPress("time", option.value)}
                                        activeOpacity={0.85}
                                    >
                                        <Text
                                            style={[
                                                styles.filterChipText,
                                                isActive && styles.filterChipTextActive,
                                            ]}
                                            allowFontScaling={false}
                                            numberOfLines={1}
                                            adjustsFontSizeToFit
                                            minimumFontScale={0.8}
                                        >
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ) : null}
            </Animated.View>

            <FlatList
                data={history}
                keyExtractor={(item) => item._id}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
                }
                renderItem={({ item, index }) => (
                    <RentalHistoryCard
                        item={item}
                        index={index}
                        isExpanded={expandedRentalId === item._id}
                        onToggleExpand={(id) => {
                            triggerHaptic("light");
                            setExpandedRentalId(prev => prev === id ? null : id);
                        }}
                        fadeAnim={fadeAnim}
                        slideAnim={slideAnim}
                    />
                )}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <EmptyState
                        icon="time-outline"
                        title="No rental history yet"
                    />
                }
            />
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
    header: {
        paddingHorizontal: 20,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md,
    },
    headerTopRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headerTextWrap: {
        flex: 1,
        marginRight: Spacing.sm,
    },
    title: {
        fontSize: 24,
        color: Colors.text,
        fontFamily: Fonts.bold,
    },
    subtitle: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        marginTop: 4,
        fontFamily: Fonts.regular,
    },
    filterButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterPanel: {
        marginTop: Spacing.sm,
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterSectionTitle: {
        fontSize: FontSizes.caption,
        color: Colors.textSecondary,
        fontFamily: Fonts.bold,
        marginBottom: 8,
    },
    filterRow: {
        flexDirection: "row",
        flexWrap: "nowrap",
        gap: 6,
        marginBottom: Spacing.sm,
    },
    filterChip: {
        flex: 1,
        minHeight: 38,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    filterChipThird: {
        paddingHorizontal: 6,
    },
    filterChipHalf: {
        paddingHorizontal: 6,
    },
    filterChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterChipText: {
        fontSize: FontSizes.tiny,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
        textAlign: "center",
    },
    filterChipTextActive: {
        color: Colors.white,
    },
    list: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingBottom: 90,
    },
});
