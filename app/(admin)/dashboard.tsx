import AdminDashboardHeader from "@/components/admin/AdminDashboardHeader";
import AdminDashboardStats from "@/components/admin/AdminDashboardStats";
import AdminRentalCard from "@/components/admin/AdminRentalCard";
import AdminStatusFilters from "@/components/admin/AdminStatusFilters";
import BookLoader from "@/components/ui/BookLoader";
import ConfirmActionModal from "@/components/ui/ConfirmActionModal";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { useAdminDashboard, useFadeSlideIn } from "@/hooks";
import { triggerHaptic } from "@/utils/haptics";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Animated,
    SectionList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminDashboard() {
    const router = useRouter();
    const {
        rentals,
        stats,
        revenue,
        statusFilter,
        setStatusFilter,
        groupedByZone,
        handleMarkDelivered,
        handleMarkReturned,
        handleSignOut,
        statusFilters,
    } = useAdminDashboard();
    const { fadeAnim, slideAnim } = useFadeSlideIn();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    if (rentals === undefined) {
        return (
            <View style={styles.center}>
                <BookLoader label="Loading dashboard..." />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <SectionList
                sections={groupedByZone}
                keyExtractor={(item) => item._id}
                style={styles.flex}
                ListHeaderComponent={
                    <Animated.View
                        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
                    >
                        <AdminDashboardHeader
                            onAddBook={() => {
                                triggerHaptic("medium");
                                router.push("/(admin)/add-book");
                            }}
                            onSignOut={() => {
                                triggerHaptic("medium");
                                setShowLogoutConfirm(true);
                            }}
                        />

                        <AdminDashboardStats
                            stats={stats}
                            revenue={revenue}
                            onPressRevenue={() => {
                                triggerHaptic("light");
                                router.push("/(admin)/analytics");
                            }}
                        />

                        <View style={styles.quickActions}>
                            <TouchableOpacity
                                style={styles.quickAction}
                                onPress={() => {
                                    triggerHaptic("light");
                                    router.push("/(admin)/verify-payment");
                                }}
                            >
                                <Ionicons name="card" size={20} color={Colors.primary} />
                                <Text style={styles.quickActionText}>Verify Payments</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.quickAction}
                                onPress={() => {
                                    triggerHaptic("light");
                                    router.push("/(admin)/books");
                                }}
                            >
                                <Ionicons name="book" size={20} color={Colors.primary} />
                                <Text style={styles.quickActionText}>View Books</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.quickAction}
                                onPress={() => {
                                    triggerHaptic("light");
                                    router.push("/(admin)/series" as any);
                                }}
                            >
                                <Ionicons name="layers" size={20} color={Colors.primary} />
                                <Text style={styles.quickActionText}>Manage Series</Text>
                            </TouchableOpacity>
                        </View>

                        <AdminStatusFilters
                            items={statusFilters}
                            selected={statusFilter}
                            onSelect={(item) => {
                                triggerHaptic("light");
                                setStatusFilter(item as (typeof statusFilters)[number]);
                            }}
                        />
                    </Animated.View>
                }
                renderSectionHeader={({ section }) => (
                    <View style={styles.sectionHeader}>
                        <Ionicons name="location" size={18} color={Colors.primary} />
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <View style={styles.sectionBadge}>
                            <Text style={styles.sectionCount}>{section.data.length}</Text>
                        </View>
                    </View>
                )}
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
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="clipboard-outline" size={48} color={Colors.textLight} style={{ marginBottom: Spacing.md }} />
                        <Text style={styles.emptyText}>No rentals found</Text>
                    </View>
                }
            />

            <ConfirmActionModal
                visible={showLogoutConfirm}
                title="Sign Out?"
                message="Are you sure you want to log out of the admin panel?"
                confirmLabel="Log Out"
                cancelLabel="Cancel"
                tone="danger"
                onCancel={() => setShowLogoutConfirm(false)}
                onConfirm={async () => {
                    setShowLogoutConfirm(false);
                    await handleSignOut();
                }}
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
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.background,
    },
    quickActions: {
        flexDirection: "row",
        paddingHorizontal: 20,
        gap: 10,
        marginBottom: Spacing.md,
        flexWrap: "wrap",
    },
    quickAction: {
        flex: 1,
        minWidth: 160,
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
        fontSize: FontSizes.titleLarge,
    },
    quickActionText: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: Spacing.sm,
        paddingHorizontal: 20,
        backgroundColor: Colors.background,
    },
    sectionTitle: {
        fontSize: FontSizes.bodyLarge,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    sectionBadge: {
        backgroundColor: Colors.primary + "20",
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
        paddingBottom: 20,
    },
    empty: {
        alignItems: "center",
        paddingHorizontal: 24,
        paddingVertical: 56,
    },
    emptyIcon: {
        fontSize: FontSizes.display,
        marginBottom: Spacing.md,
    },
    emptyText: {
        fontSize: FontSizes.subtitle,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
    },
});
