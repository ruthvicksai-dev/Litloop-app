import { NotificationItem } from "@/components/notifications/NotificationItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
    rental: "cube-outline",
    book: "book-outline",
    general: "notifications-outline",
};

export default function AdminNotificationsScreen() {
    const { accessToken, user, isLoading } = useAuth();
    const router = useRouter();

    const notifications = useQuery(
        api.notifications.getNotifications,
        accessToken ? { accessToken } : "skip"
    );
    const markReadMutation = useMutation(api.notifications.markRead);
    const markAllReadMutation = useMutation(api.notifications.markAllRead);

    const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

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

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Skeleton width={180} height={32} />
                </View>
                <View style={styles.emptyContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backBtn}
                    >
                        <Ionicons name="chevron-back" size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.title}>Admin Alerts</Text>
                        <Text style={styles.subtitle}>
                            {unreadCount > 0 ? `${unreadCount} new requests` : "All cleared"}
                        </Text>
                    </View>
                </View>
                {unreadCount > 0 && (
                    <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
                        <Text style={styles.markAllText}>Clear All</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={notifications}
                keyExtractor={(item) => item._id}
                contentContainerStyle={
                    notifications?.length === 0 ? styles.emptyContainer : styles.listContent
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
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: Layout.screenPaddingWide,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.white,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: FontSizes.heading,
        color: Colors.text,
        fontFamily: Fonts.bold,
    },
    subtitle: {
        marginTop: 2,
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
});
