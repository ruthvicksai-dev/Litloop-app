import { Colors, RENTAL_STATUS_LABELS, Spacing, STATUS_COLORS } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    ScrollView,
    SectionList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const STATUS_FILTERS = [
    "all",
    "requested",
    "delivery_scheduled",
    "delivered",
    "pickup_scheduled",
    "payment_pending",
    "paid",
    "returned",
];

export default function AdminDashboard() {
    const rentals = useQuery(api.rentals.getAllRentals);
    const markDelivered = useMutation(api.rentals.markDelivered);
    const markReturned = useMutation(api.rentals.markReturned);
    const { showToast } = useToast();
    const router = useRouter();
    const { signOut } = useAuth();

    const [statusFilter, setStatusFilter] = useState("all");

    // Entrance animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Stats
    const stats = useMemo(() => {
        if (!rentals) return { total: 0, active: 0, pending: 0, completed: 0 };
        return {
            total: rentals.length,
            active: rentals.filter((r) =>
                ["requested", "delivery_scheduled", "delivered"].includes(r.status)
            ).length,
            pending: rentals.filter((r) =>
                ["pickup_scheduled", "payment_pending"].includes(r.status)
            ).length,
            completed: rentals.filter((r) =>
                ["paid", "returned"].includes(r.status)
            ).length,
        };
    }, [rentals]);

    const filteredRentals = useMemo(() => {
        if (!rentals) return [];
        if (statusFilter === "all") return rentals;
        return rentals.filter((r) => r.status === statusFilter);
    }, [rentals, statusFilter]);

    // Group by zone
    const groupedByZone = useMemo(() => {
        const groups: Record<string, typeof filteredRentals> = {};
        filteredRentals.forEach((r) => {
            const zone = r.zone || "Unknown";
            if (!groups[zone]) groups[zone] = [];
            groups[zone].push(r);
        });
        return Object.entries(groups).map(([zone, data]) => ({
            title: zone,
            data,
        }));
    }, [filteredRentals]);

    if (rentals === undefined) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const handleMarkDelivered = async (rentalId: string) => {
        try {
            await markDelivered({ rentalId: rentalId as any });
            showToast("Marked as delivered.", "success");
        } catch (error: any) {
            showToast(error.message, "error");
        }
    };

    const handleMarkReturned = async (rentalId: string) => {
        try {
            await markReturned({ rentalId: rentalId as any });
            showToast("Marked as returned.", "success");
        } catch (error: any) {
            showToast(error.message, "error");
        }
    };

    const handleSignOut = async () => {
        await signOut();
        router.replace("/(auth)/sign-in");
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Rentals grouped by zone, with all top content in ListHeaderComponent */}
            <SectionList
                sections={groupedByZone}
                keyExtractor={(item) => item._id}
                style={styles.flex}
                ListHeaderComponent={
                    <Animated.View
                        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.headerGreeting}>Admin Panel</Text>
                                <Text style={styles.title}>Dashboard</Text>
                            </View>
                            <View style={styles.headerActions}>
                                <TouchableOpacity
                                    style={styles.iconBtn}
                                    onPress={() => router.push("/(admin)/add-book")}
                                >
                                    <Text style={styles.iconBtnText}>+ Book</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.logoutBtn}
                                    onPress={handleSignOut}
                                >
                                    <Text style={styles.logoutText}>Logout</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Stats Cards */}
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

                        {/* Quick Actions */}
                        <View style={styles.quickActions}>
                            <TouchableOpacity
                                style={styles.quickAction}
                                onPress={() => router.push("/(admin)/verify-payment")}
                            >
                                <Text style={styles.quickActionIcon}>💳</Text>
                                <Text style={styles.quickActionText}>Verify Payments</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.quickAction}
                                onPress={() => router.push("/(admin)/books")}
                            >
                                <Text style={styles.quickActionIcon}>📚</Text>
                                <Text style={styles.quickActionText}>View Books</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Status Filter chips */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.filterRow}
                            style={styles.filterScroll}
                        >
                            {STATUS_FILTERS.map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    style={[
                                        styles.filterChip,
                                        statusFilter === item && styles.filterChipActive,
                                    ]}
                                    onPress={() => setStatusFilter(item)}
                                >
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            statusFilter === item && styles.filterChipTextActive,
                                        ]}
                                    >
                                        {item === "all"
                                            ? "All"
                                            : RENTAL_STATUS_LABELS[item] || item}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Animated.View>
                }
                renderSectionHeader={({ section }) => (
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>📍 {section.title}</Text>
                        <View style={styles.sectionBadge}>
                            <Text style={styles.sectionCount}>
                                {section.data.length}
                            </Text>
                        </View>
                    </View>
                )}
                renderItem={({ item }) => {
                    const statusColor =
                        STATUS_COLORS[item.status] || Colors.textSecondary;
                    return (
                        <View style={styles.rentalCard}>
                            <View style={styles.rentalTop}>
                                <View style={styles.rentalInfo}>
                                    <Text style={styles.rentalTitle} numberOfLines={1}>
                                        {item.book?.title || "Unknown"}
                                    </Text>
                                    <Text style={styles.rentalUser}>
                                        👤 {item.user?.name || "Unknown"} • {item.user?.phone}
                                    </Text>
                                    <Text style={styles.rentalLocation}>
                                        📍 {item.deliveryLocation?.area}, {item.deliveryLocation?.city}
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        { backgroundColor: statusColor + "18" },
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.statusDot,
                                            { backgroundColor: statusColor },
                                        ]}
                                    />
                                    <Text style={[styles.statusText, { color: statusColor }]}>
                                        {RENTAL_STATUS_LABELS[item.status]}
                                    </Text>
                                </View>
                            </View>

                            {/* Action buttons based on status */}
                            {(item.status === "requested" ||
                                item.status === "delivery_scheduled" ||
                                item.status === "paid" ||
                                item.status === "payment_pending") && (
                                    <View style={styles.actionRow}>
                                        {item.status === "requested" && (
                                            <TouchableOpacity
                                                style={styles.actionBtn}
                                                onPress={() =>
                                                    router.push(
                                                        `/(admin)/schedule-delivery?rentalId=${item._id}`
                                                    )
                                                }
                                            >
                                                <Text style={styles.actionBtnText}>
                                                    📅 Schedule Delivery
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                        {item.status === "delivery_scheduled" && (
                                            <TouchableOpacity
                                                style={[styles.actionBtn, styles.successBtn]}
                                                onPress={() => handleMarkDelivered(item._id)}
                                            >
                                                <Text style={styles.actionBtnText}>
                                                    ✅ Mark Delivered
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                        {item.status === "paid" && (
                                            <TouchableOpacity
                                                style={[styles.actionBtn, styles.successBtn]}
                                                onPress={() => handleMarkReturned(item._id)}
                                            >
                                                <Text style={styles.actionBtnText}>
                                                    📦 Mark Returned
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                        {item.status === "payment_pending" && (
                                            <TouchableOpacity
                                                style={styles.actionBtn}
                                                onPress={() =>
                                                    router.push(
                                                        `/(admin)/verify-payment?rentalId=${item._id}`
                                                    )
                                                }
                                            >
                                                <Text style={styles.actionBtnText}>
                                                    💳 Verify Payment
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
                        </View>
                    );
                }}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>📋</Text>
                        <Text style={styles.emptyText}>No rentals found</Text>
                    </View>
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
    flex: {
        flex: 1,
    },
    filterScroll: {
        flexGrow: 0,
        marginBottom: Spacing.sm,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingHorizontal: SCREEN_WIDTH * 0.06,
        paddingTop: SCREEN_HEIGHT * 0.015,
        paddingBottom: Spacing.sm,
    },
    headerGreeting: {
        fontSize: 13,
        color: Colors.textSecondary,
        fontWeight: "500",
    },
    title: {
        fontSize: SCREEN_WIDTH * 0.065,
        fontWeight: "800",
        color: Colors.text,
    },
    headerActions: {
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
    },
    iconBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
    iconBtnText: {
        color: Colors.white,
        fontWeight: "700",
        fontSize: 13,
    },
    logoutBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    logoutText: {
        color: Colors.textSecondary,
        fontSize: 13,
        fontWeight: "600",
    },

    // Stats
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

    // Quick actions
    quickActions: {
        flexDirection: "row",
        paddingHorizontal: SCREEN_WIDTH * 0.06,
        gap: 10,
        marginBottom: Spacing.md,
    },
    quickAction: {
        flex: 1,
        backgroundColor: Colors.white,
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    quickActionIcon: {
        fontSize: 20,
    },
    quickActionText: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.text,
    },

    // Filters
    filterRow: {
        paddingHorizontal: SCREEN_WIDTH * 0.06,
        paddingBottom: 6,
        gap: 6,
        alignItems: "center",
    },
    filterChip: {
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.white,
        alignSelf: "flex-start",
        height: 32,
        justifyContent: "center",
    },
    filterChipActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary,
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.textSecondary,
    },
    filterChipTextActive: {
        color: Colors.white,
    },

    // Section headers
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: Spacing.sm,
        paddingHorizontal: SCREEN_WIDTH * 0.06,
        backgroundColor: Colors.background,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: Colors.text,
    },
    sectionBadge: {
        backgroundColor: Colors.primary + "20",
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    sectionCount: {
        fontSize: 11,
        fontWeight: "700",
        color: Colors.primary,
    },

    // Rental cards
    list: {
        paddingBottom: 20,
    },
    rentalCard: {
        backgroundColor: Colors.white,
        marginHorizontal: SCREEN_WIDTH * 0.06,
        marginBottom: 10,
        borderRadius: 14,
        padding: Spacing.md,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    rentalTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    rentalInfo: {
        flex: 1,
        marginRight: 10,
    },
    rentalTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: Colors.text,
        marginBottom: 4,
    },
    rentalUser: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 2,
    },
    rentalLocation: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 10,
        fontWeight: "700",
    },

    // Actions
    actionRow: {
        flexDirection: "row",
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: Colors.border + "40",
        gap: 8,
    },
    actionBtn: {
        flex: 1,
        backgroundColor: Colors.primary,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: "center",
    },
    successBtn: {
        backgroundColor: "#10B981",
    },
    actionBtnText: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: "700",
    },

    // Empty
    empty: {
        alignItems: "center",
        paddingTop: SCREEN_HEIGHT * 0.1,
    },
    emptyIcon: {
        fontSize: SCREEN_WIDTH * 0.12,
        marginBottom: Spacing.md,
    },
    emptyText: {
        fontSize: 16,
        color: Colors.textSecondary,
    },
});
