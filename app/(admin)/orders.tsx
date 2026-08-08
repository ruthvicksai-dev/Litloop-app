import { SegmentedControl, SegmentOption } from "@/components/ui/core/SegmentedControl";
import AdminRentalCard from "@/components/admin/rentals/AdminRentalCard";
import BookLoader from "@/components/ui/feedback/BookLoader";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, RENTAL_STATUS_LABELS, Layout, Spacing, scale } from "@/constants/theme";
import { useAdminDashboard } from "@/hooks";
import { triggerHaptic } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const ZONE_TAB_OPTIONS: SegmentOption[] = [
    { label: "Home", value: "Home", icon: "home-outline", activeIcon: "home" },
    { label: "College", value: "College", icon: "school-outline", activeIcon: "school" },
];

const TITLE_MAP: Record<string, string> = {
    all: "All Orders",
    requested: "Requested Orders",
    delivery_scheduled: "Delivery Scheduled",
    delivered: "Delivered Orders",
    pickup_scheduled: "Pickup Scheduled",
    payment_pending: "Payment Pending",
    paid: "Paid Orders",
    returned: "Returned Orders",
};

const SUBTITLE_MAP: Record<string, string> = {
    all: "View and manage all customer book orders",
    requested: "New order requests awaiting delivery schedule",
    delivery_scheduled: "Orders ready to be delivered to customers",
    delivered: "Active books currently with readers",
    pickup_scheduled: "Returns scheduled for pickup",
    payment_pending: "Orders awaiting payment verification",
    paid: "Completed payments verified by admin",
    returned: "Books returned and added back to inventory",
};

export default function AdminOrdersScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ status?: string }>();
    const [refreshing, setRefreshing] = useState(false);
    const [activeZone, setActiveZone] = useState<"Home" | "College">("Home");
    const insets = useSafeAreaInsets();

    const {
        rentals,
        statusFilter,
        setStatusFilter,
        handleMarkDelivered,
        handleMarkReturned,
        statusFilters,
    } = useAdminDashboard();

    useEffect(() => {
        if (params.status && statusFilters.includes(params.status as any)) {
            setStatusFilter(params.status as any);
        }
    }, [params.status, setStatusFilter, statusFilters]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        triggerHaptic("light");
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    const filteredRentals = useMemo(() => {
        const rentalList = rentals?.page ?? [];
        return statusFilter === "all"
            ? rentalList
            : rentalList.filter((rental) => rental.status === statusFilter);
    }, [rentals, statusFilter]);

    const zoneRentals = useMemo(() => {
        return filteredRentals.filter((rental) => {
            const z = (rental.zone || "").toLowerCase();
            if (activeZone === "College") {
                return z === "college";
            }
            return z !== "college";
        });
    }, [filteredRentals, activeZone]);

    if (rentals === undefined) {
        return (
            <SafeAreaView style={styles.center} edges={["bottom", "left", "right"]}>
                <BookLoader label="Loading orders..." />
            </SafeAreaView>
        );
    }

    const pageTitle = TITLE_MAP[statusFilter] || RENTAL_STATUS_LABELS[statusFilter] || "Orders";
    const pageSubtitle = SUBTITLE_MAP[statusFilter] || "Manage customer rentals";
    const totalCount = zoneRentals.length;

    return (
        <View style={styles.container}>
            <StatusBar style="light" animated />

            {/* ─── Premium Gradient Hero Header (Matching Admin Dashboard) ─── */}
            <LinearGradient
                colors={[Colors.primaryDark, Colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroHeader}
            >
                <View style={styles.heroDecor} pointerEvents="none">
                    <View style={styles.heroDecorShape1} />
                    <View style={styles.heroDecorShape2} />
                </View>

                <SafeAreaView edges={["top", "left", "right"]} style={styles.heroSafeArea}>
                    <View style={styles.heroContent}>
                        {/* Top Nav Row */}
                        <View style={styles.topNavRow}>
                            <TouchableOpacity
                                style={styles.backBtn}
                                activeOpacity={0.7}
                                onPress={() => {
                                    triggerHaptic("light");
                                    router.back();
                                }}
                            >
                                <Ionicons name="chevron-back" size={22} color={Colors.white} />
                            </TouchableOpacity>
                            <View style={styles.countBadge}>
                                <Text style={styles.countBadgeText}>{totalCount} Orders</Text>
                            </View>
                        </View>

                        {/* Title & Description */}
                        <Text style={styles.heroTitle}>{pageTitle}</Text>
                        <Text style={styles.heroSubtitle}>{pageSubtitle}</Text>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* ─── Orders List Section ─── */}
            <SafeAreaView style={styles.flex} edges={["bottom", "left", "right"]}>
                {/* Zone Tabs */}
                <View style={styles.tabContainer}>
                    <SegmentedControl
                        options={ZONE_TAB_OPTIONS}
                        activeValue={activeZone}
                        onChange={(val) => {
                            triggerHaptic("light");
                            setActiveZone(val as "Home" | "College");
                        }}
                    />
                </View>

                <FlatList
                    data={zoneRentals}
                    keyExtractor={(item) => item._id}
                    style={styles.flex}
                    renderItem={({ item }) => (
                        <AdminRentalCard
                            item={item}
                            onScheduleDelivery={() =>
                                router.push(`/(admin)/schedule-delivery?rentalId=${item._id}`)
                            }
                            onVerifyPayment={() =>
                                router.push(`/(admin)/verify-payment?rentalId=${item._id}`)
                            }
                            onMarkDelivered={() => handleMarkDelivered(item._id)}
                            onMarkReturned={() => handleMarkReturned(item._id)}
                        />
                    )}
                    contentContainerStyle={[
                        styles.list,
                        { paddingBottom: Math.max(insets.bottom + 24, 32) }
                    ]}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[Colors.primary]}
                            tintColor={Colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyCard}>
                            <View style={styles.emptyIconCircle}>
                                <Ionicons name="clipboard-outline" size={36} color={Colors.primary} />
                            </View>
                            <Text style={styles.emptyTitle}>No {pageTitle}</Text>
                            <Text style={styles.emptyText}>
                                There are currently no {activeZone.toLowerCase()} zone orders under this status.
                            </Text>
                        </View>
                    }
                />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    tabContainer: {
        paddingHorizontal: Layout.screenPaddingWide,
        marginTop: Spacing.md,
        marginBottom: Spacing.xs,
    },
    flex: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.background,
    },
    /* Hero Header */
    heroHeader: {
        borderBottomLeftRadius: Layout.cardRadiusLarge + scale(4),
        borderBottomRightRadius: Layout.cardRadiusLarge + scale(4),
        overflow: "hidden",
        zIndex: 10,
        elevation: 4,
        backgroundColor: Colors.primaryDark,
    },
    heroSafeArea: {},
    heroContent: {
        paddingHorizontal: Layout.screenPaddingWide,
        paddingTop: Spacing.xs,
        paddingBottom: Spacing.lg,
    },
    heroDecor: {
        ...StyleSheet.absoluteFillObject,
        overflow: "hidden",
    },
    heroDecorShape1: {
        position: "absolute",
        width: scale(160),
        height: scale(160),
        borderRadius: scale(80),
        backgroundColor: "rgba(255,255,255,0.05)",
        top: -scale(40),
        right: -scale(20),
    },
    heroDecorShape2: {
        position: "absolute",
        width: scale(120),
        height: scale(120),
        borderRadius: scale(60),
        backgroundColor: "rgba(255,255,255,0.03)",
        bottom: -scale(30),
        left: -scale(20),
    },
    topNavRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: Spacing.sm,
    },
    backBtn: {
        padding: 4,
        marginLeft: -4,
        alignItems: "center",
        justifyContent: "center",
    },
    countBadge: {
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    countBadgeText: {
        color: Colors.white,
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
    },
    heroTitle: {
        fontSize: FontSizes.heading,
        color: Colors.white,
        fontFamily: Fonts.bold,
        letterSpacing: -0.4,
    },
    heroSubtitle: {
        fontSize: FontSizes.caption,
        color: "rgba(255,255,255,0.75)",
        fontFamily: Fonts.regular,
        marginTop: 2,
    },
    /* Section Headers */
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: Spacing.sm,
        paddingHorizontal: 20,
        backgroundColor: Colors.background,
        marginTop: Spacing.xs,
    },
    sectionTitle: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    sectionBadge: {
        backgroundColor: Colors.primary + "18",
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    sectionCount: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
    list: {
        flexGrow: 1,
        paddingTop: 8,
        paddingHorizontal: Layout.screenPaddingWide,
    },
    /* Empty State */
    emptyCard: {
        backgroundColor: Colors.white,
        marginHorizontal: 20,
        marginTop: Spacing.lg,
        borderRadius: 22,
        padding: 32,
        alignItems: "center",
        borderWidth: 1,
        borderColor: Colors.border,
    },
    emptyIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.primary + "12",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: Spacing.md,
    },
    emptyTitle: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 6,
        textAlign: "center",
    },
    emptyText: {
        fontSize: FontSizes.caption,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        textAlign: "center",
        lineHeight: 18,
    },
});
