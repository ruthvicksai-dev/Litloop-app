import AdminDashboardHeader from "@/components/admin/AdminDashboardHeader";
import AdminDashboardStats from "@/components/admin/AdminDashboardStats";
import AdminRentalCard from "@/components/admin/AdminRentalCard";
import AdminStatusFilters from "@/components/admin/AdminStatusFilters";
import { Fonts } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { useFadeSlideIn } from "@/hooks/useFadeSlideIn";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    SectionList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function AdminDashboard() {
    const router = useRouter();
    const {
        rentals,
        stats,
        statusFilter,
        setStatusFilter,
        groupedByZone,
        handleMarkDelivered,
        handleMarkReturned,
        handleSignOut,
        statusFilters,
    } = useAdminDashboard();
    const { fadeAnim, slideAnim } = useFadeSlideIn();

    if (rentals === undefined) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
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
                            onAddBook={() => router.push("/(admin)/add-book")}
                            onSignOut={handleSignOut}
                        />

                        <AdminDashboardStats stats={stats} />

                        <View style={styles.quickActions}>
                            <TouchableOpacity
                                style={styles.quickAction}
                                onPress={() => router.push("/(admin)/verify-payment")}
                            >
                                <Ionicons name="card" size={20} color={Colors.primary} />
                                <Text style={styles.quickActionText}>Verify Payments</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.quickAction}
                                onPress={() => router.push("/(admin)/books")}
                            >
                                <Ionicons name="book" size={20} color={Colors.primary} />
                                <Text style={styles.quickActionText}>View Books</Text>
                            </TouchableOpacity>
                        </View>

                        <AdminStatusFilters
                            items={statusFilters}
                            selected={statusFilter}
                            onSelect={(item) =>
                                setStatusFilter(item as (typeof statusFilters)[number])
                            }
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
                        <Ionicons name="clipboard-outline" size={SCREEN_WIDTH * 0.12} color={Colors.textLight} style={{ marginBottom: Spacing.md }} />
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
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.background,
    },
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
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
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
        fontSize: 11,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
    list: {
        paddingBottom: 20,
    },
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
      fontFamily: Fonts.regular,
    },
});
