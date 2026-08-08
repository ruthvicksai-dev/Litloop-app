import { NotificationItem } from "@/components/notifications/NotificationItem";
import { EmptyState } from "@/components/ui/feedback/EmptyState";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing } from "@/constants/theme";
import { useAuthState } from "@/context/AuthContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import AdminHeader from "@/components/admin/core/AdminHeader";
import React from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
    rental: "book-outline",
    book: "book-outline",
    general: "notifications-outline",
};

export default function AdminNotificationsScreen() {
    const { accessToken, isLoading } = useAuthState();
    const router = useRouter();
    const [refreshing, setRefreshing] = React.useState(false);

    const notifications = useQuery(
        api.notifications.getNotifications,
        accessToken ? { accessToken } : "skip"
    );
    const markReadMutation = useMutation(api.notifications.markRead);
    const markAllReadMutation = useMutation(api.notifications.markAllRead);
    const updatePushToken = useMutation(api.notifications.updatePushToken);

    const { user } = useAuthState();
    const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

    const handleEnablePush = async () => {
        if (!accessToken) return;
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === "granted") {
            try {
                const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
                if (!projectId) return;
                const { data: pushToken } = await Notifications.getExpoPushTokenAsync({ projectId });
                await updatePushToken({ accessToken, pushToken });
            } catch (e) {
                console.warn("[AdminNotifications] Failed to get push token", e);
            }
        }
    };

    const handlePress = async (item: any) => {
        if (!item.isRead) {
            if (!accessToken) return;
            await markReadMutation({
                accessToken,
                notificationId: item._id as Id<"user_notifications">,
            });
        }

        if (item.dataJson) {
            const data = JSON.parse(item.dataJson);
            if (data.type === "rental" && data.rentalId) {
                router.push(`/(admin)/rental/${data.rentalId}` as any);
            } else if (data.type === "book" && data.bookId) {
                router.push(`/(admin)/edit-book?id=${data.bookId}` as any);
            }
        }
    };

    const handleMarkAllRead = () => {
        if (accessToken && unreadCount > 0) {
            markAllReadMutation({ accessToken });
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 800);
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <AdminHeader title="Admin Alerts" variant="dark" />
                <SafeAreaView style={styles.flex} edges={["bottom", "left", "right"]}>
                    <View style={styles.emptyContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <AdminHeader title="Admin Alerts" variant="dark" />

            <SafeAreaView style={styles.flex} edges={["bottom", "left", "right"]}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryText}>
                        {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
                    </Text>
                    {unreadCount > 0 && (
                        <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
                            <Text style={styles.markAllText}>Mark all read</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {user && !user.pushToken && (
                    <View style={styles.pushPromptContainer}>
                        <View style={styles.pushPromptContent}>
                            <Ionicons name="notifications-off-outline" size={24} color={Colors.warning} />
                            <View style={styles.pushPromptTextContainer}>
                                <Text style={styles.pushPromptTitle}>Admin Push Disabled</Text>
                                <Text style={styles.pushPromptSubtitle}>Turn on push to get instant alerts for new rentals and payments.</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.pushPromptButton} onPress={handleEnablePush}>
                            <Text style={styles.pushPromptButtonText}>Enable</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={
                        notifications?.length === 0 ? styles.emptyContainer : styles.listContent
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[Colors.primary]}
                        />
                    }
                    ListEmptyComponent={
                        notifications === undefined ? null : (
                            <EmptyState
                                icon="notifications-outline"
                                title="No admin alerts"
                                subtitle="System alerts and rental requests will appear here."
                            />
                        )
                    }
                    renderItem={({ item }) => (
                        <NotificationItem
                            item={item}
                            onPress={handlePress}
                            icon={TYPE_ICON[item.type] ?? "notifications-outline"}
                        />
                    )}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    flex: {
        flex: 1,
    },
    summaryRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: Spacing.md,
        paddingHorizontal: Layout.screenPaddingWide,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.md,
    },
    summaryText: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
    },
    markAllBtn: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs + 2,
        borderRadius: 20,
        backgroundColor: Colors.primaryLight,
    },
    markAllText: {
        fontSize: FontSizes.caption,
        color: Colors.primary,
        fontFamily: Fonts.medium,
    },
    listContent: {
        paddingBottom: Spacing.xl,
    },
    emptyContainer: {
        flex: 1,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: Colors.border,
        marginLeft: Layout.screenPaddingWide + 40 + Spacing.md,
    },
    pushPromptContainer: {
        marginHorizontal: Layout.screenPaddingWide,
        marginBottom: Spacing.sm,
        padding: Spacing.md,
        backgroundColor: `${Colors.warning}15`,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: `${Colors.warning}40`,
        flexDirection: "column",
        gap: Spacing.sm,
    },
    pushPromptContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
    },
    pushPromptTextContainer: {
        flex: 1,
    },
    pushPromptTitle: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    pushPromptSubtitle: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    pushPromptButton: {
        backgroundColor: Colors.warning,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: "center",
    },
    pushPromptButtonText: {
        color: Colors.white,
        fontFamily: Fonts.bold,
        fontSize: FontSizes.body,
    },
});
