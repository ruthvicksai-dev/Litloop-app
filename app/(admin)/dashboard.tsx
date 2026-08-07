import AdminDashboardHeader from "@/components/admin/dashboard/AdminDashboardHeader";
import AdminDashboardStats from "@/components/admin/dashboard/AdminDashboardStats";
import QuickActionGrid from "@/components/admin/dashboard/QuickActionGrid";
import BookLoader from "@/components/ui/feedback/BookLoader";
import { Colors } from "@/constants/theme";
import { useAuthState } from "@/context/AuthContext";
import { api } from "@/convex/_generated/api";
import { useAdminDashboard, useFadeSlideIn } from "@/hooks";
import { triggerHaptic } from "@/utils";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
    Animated,
    RefreshControl,
    ScrollView,
    StyleSheet,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function AdminDashboard() {
    const router = useRouter();
    const { accessToken } = useAuthState();
    const [refreshing, setRefreshing] = useState(false);
    const insets = useSafeAreaInsets();
    const {
        rentals,
        stats,
        revenue,
        dashboardStats,
        greeting,
    } = useAdminDashboard();
    const { fadeAnim, slideAnim } = useFadeSlideIn();

    const unreadCount =
        useQuery(
            api.notifications.getUnreadCount,
            accessToken ? { accessToken } : "skip",
        ) ?? 0;

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        triggerHaptic("light");
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    if (rentals === undefined && dashboardStats === undefined) {
        return (
            <SafeAreaView style={styles.center} edges={["bottom", "left", "right"]}>
                <BookLoader label="Loading dashboard..." />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
            <StatusBar style="light" animated />

            {/* ─── Fixed Hero Header (Exact same position as User Home Screen) ─── */}
            <AdminDashboardHeader
                greeting={greeting}
                unreadCount={unreadCount}
                todayOrders={dashboardStats?.todayOrders ?? 0}
                todayRevenue={dashboardStats?.todayRevenue ?? 0}
                onNotificationsPress={() => {
                    triggerHaptic("light");
                    router.push("/(admin)/notifications" as any);
                }}
                onSettingsPress={() => {
                    triggerHaptic("light");
                    router.push("/(admin)/payment-settings" as any);
                }}
            />

            {/* ─── Scrollable Content Body Below Fixed Header ─── */}
            <ScrollView
                style={styles.flex}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: Math.max(insets.bottom + 24, 32) }
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[Colors.primary]}
                        tintColor={Colors.primary}
                    />
                }
            >
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    }}
                >
                    {/* Stats Section */}
                    <AdminDashboardStats
                        stats={stats}
                        revenue={revenue}
                        totalBooks={dashboardStats?.totalBooks ?? 0}
                        monthlyGrowth={dashboardStats?.monthlyGrowth ?? 0}
                        onPressRevenue={() => {
                            triggerHaptic("light");
                            router.push("/(admin)/analytics");
                        }}
                    />

                    {/* Quick Actions Grid */}
                    <QuickActionGrid
                        statusCounts={dashboardStats?.statusCounts}
                    />
                </Animated.View>
            </ScrollView>
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
        backgroundColor: Colors.background,
    },
    scrollContent: {
        backgroundColor: Colors.background,
        paddingTop: 8,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.background,
    },
});
