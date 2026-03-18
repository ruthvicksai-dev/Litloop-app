import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, scale, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import {
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

function timeAgo(ts: number): string {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
}

export default function NotificationsScreen() {
    const { userId, user } = useAuth();
    const isAdmin = user?.role === "admin";
    const router = useRouter();

    const notifications = useQuery(
        api.notifications.getNotifications,
        userId ? { userId } : "skip"
    );
    const markReadMutation = useMutation(api.notifications.markRead);
    const markAllReadMutation = useMutation(api.notifications.markAllRead);

    const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

    const handlePress = async (item: any) => {
        if (!item.isRead) {
            await markReadMutation({ notificationId: item._id as Id<"user_notifications"> });
        }
        if (item.dataJson) {
            const data = JSON.parse(item.dataJson);
            if (data.type === "rental") {
                if (isAdmin && data.rentalId) {
                    // Admin → full rental detail screen
                    router.push(`/(admin)/rental/${data.rentalId}` as any);
                } else {
                    // User → My Rentals tab (no standalone user rental detail)
                    router.push("/(tabs)/my-rentals" as any);
                }
            } else if (data.type === "book" && data.bookId) {
                router.push(`/book/${data.bookId}` as any);
            }
        }
    };

    const handleMarkAllRead = () => {
        if (userId && unreadCount > 0) {
            markAllReadMutation({ userId });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Notifications</Text>
                    <Text style={styles.subtitle}>
                        {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
                    </Text>
                </View>
                {unreadCount > 0 && (
                    <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
                        <Text style={styles.markAllText}>Mark all read</Text>
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
                        <View style={styles.empty}>
                            <Ionicons name="notifications-outline" size={46} color={Colors.textLight} />
                            <Text style={styles.emptyTitle}>No notifications yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Delivery, pickup, and availability alerts will appear here.
                            </Text>
                        </View>
                    )
                }
                renderItem={({ item }) => {
                    const icon = TYPE_ICON[item.type] ?? "notifications-outline";
                    return (
                        <TouchableOpacity
                            style={[styles.item, !item.isRead && styles.itemUnread]}
                            onPress={() => handlePress(item)}
                            activeOpacity={0.75}
                        >
                            <View style={[styles.iconWrap, !item.isRead && styles.iconWrapUnread]}>
                                <Ionicons
                                    name={icon}
                                    size={20}
                                    color={item.isRead ? Colors.textSecondary : Colors.primary}
                                />
                            </View>
                            <View style={styles.textWrap}>
                                <View style={styles.titleRow}>
                                    <Text style={[styles.itemTitle, !item.isRead && styles.itemTitleUnread]}
                                        numberOfLines={1}>
                                        {item.title}
                                    </Text>
                                    {!item.isRead && <View style={styles.dot} />}
                                </View>
                                <Text style={styles.itemBody} numberOfLines={2}>{item.body}</Text>
                                <Text style={styles.itemTime}>{timeAgo(item.createdAt)}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                }}
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
    title: {
        fontSize: FontSizes.heading,
        color: Colors.text,
        fontFamily: Fonts.bold,
    },
    subtitle: {
        marginTop: Spacing.xs,
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
        paddingBottom: Layout.tabBarHeight + Spacing.lg,
    },
    emptyContainer: {
        flex: 1,
    },
    empty: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: scale(28),
        marginTop: scale(80),
    },
    emptyTitle: {
        marginTop: Spacing.sm,
        fontSize: FontSizes.subtitle,
        color: Colors.text,
        fontFamily: Fonts.bold,
    },
    emptySubtitle: {
        marginTop: Spacing.xs,
        textAlign: "center",
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
    },
    item: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingHorizontal: Layout.screenPaddingWide,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.background,
    },
    itemUnread: {
        backgroundColor: Colors.primaryLight + "55",
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.border + "60",
        alignItems: "center",
        justifyContent: "center",
        marginRight: Spacing.md,
        marginTop: 2,
    },
    iconWrapUnread: {
        backgroundColor: Colors.primaryLight,
    },
    textWrap: {
        flex: 1,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
    },
    itemTitle: {
        flex: 1,
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
    },
    itemTitleUnread: {
        color: Colors.text,
        fontFamily: Fonts.bold,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
    },
    itemBody: {
        marginTop: 2,
        fontSize: FontSizes.caption,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        lineHeight: 18,
    },
    itemTime: {
        marginTop: 4,
        fontSize: FontSizes.small,
        color: Colors.textLight,
        fontFamily: Fonts.regular,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: Colors.border,
        marginLeft: Layout.screenPaddingWide + 40 + Spacing.md,
    },
});
