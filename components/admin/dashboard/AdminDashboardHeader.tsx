import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing, Layout, scale } from "@/constants/theme";
import { Shadows } from "@/constants/designTokens";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

type AdminDashboardHeaderProps = {
    onNotificationsPress: () => void;
    onSettingsPress: () => void;
    unreadCount?: number;
    greeting: string;
    todayOrders: number;
    todayRevenue: number;
};

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);

export default function AdminDashboardHeader({
    onNotificationsPress,
    onSettingsPress,
    unreadCount = 0,
    greeting,
    todayOrders,
    todayRevenue,
}: AdminDashboardHeaderProps) {
    return (
        <LinearGradient
            colors={[Colors.primaryDark, Colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroHeader}
        >
            {/* Decorative background shapes matching User Home screen */}
            <View style={styles.heroDecor} pointerEvents="none">
                <View style={styles.heroDecorShape1} />
                <View style={styles.heroDecorShape2} />
                <View style={styles.heroDecorShape3} />
            </View>

            <SafeAreaView edges={["top"]} style={styles.heroSafeArea}>
                <View style={styles.heroContent}>
                    {/* Top Row: Avatar + Greeting | Actions */}
                    <View style={styles.heroTopRow}>
                        <View style={styles.heroLeft}>
                            <View style={styles.avatarWrap}>
                                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                    <Ionicons
                                        name="shield-checkmark"
                                        size={scale(18)}
                                        color={Colors.primary}
                                    />
                                </View>
                            </View>
                            <View>
                                <Text style={styles.heroGreeting} allowFontScaling={false}>
                                    {greeting}
                                </Text>
                                <Text style={styles.heroName} allowFontScaling={false}>
                                    Admin 👋
                                </Text>
                            </View>
                        </View>

                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                style={styles.heroNotifBtn}
                                activeOpacity={0.75}
                                onPress={onNotificationsPress}
                            >
                                <Ionicons
                                    name={unreadCount > 0 ? "notifications" : "notifications-outline"}
                                    size={scale(18)}
                                    color={Colors.primary}
                                />
                                {unreadCount > 0 ? (
                                    <View style={styles.heroNotifBadge}>
                                        <Text style={styles.heroNotifBadgeText}>
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </Text>
                                    </View>
                                ) : null}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.heroNotifBtn}
                                activeOpacity={0.75}
                                onPress={onSettingsPress}
                            >
                                <Ionicons
                                    name="settings-outline"
                                    size={scale(18)}
                                    color={Colors.primary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Dashboard Section Title */}
                    <View style={styles.titleSection}>
                        <Text style={styles.heroTitle}>Dashboard</Text>
                        <Text style={styles.heroSubtitle}>Manage LitLoop rentals and inventory</Text>
                    </View>

                    {/* Today's Quick Stats Bar */}
                    <View style={styles.todayBar}>
                        <View style={styles.todayItem}>
                            <View style={styles.todayIconWrap}>
                                <Ionicons name="cube-outline" size={15} color="#EBD9C0" />
                            </View>
                            <View>
                                <Text style={styles.todayLabel}>Orders Today</Text>
                                <Text style={styles.todayValue}>{todayOrders}</Text>
                            </View>
                        </View>
                        <View style={styles.todayDivider} />
                        <View style={styles.todayItem}>
                            <View style={styles.todayIconWrap}>
                                <Text style={styles.rupeeIcon}>₹</Text>
                            </View>
                            <View>
                                <Text style={styles.todayLabel}>Revenue Today</Text>
                                <Text style={styles.todayValue}>₹{formatCurrency(todayRevenue)}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    heroHeader: {
        borderBottomLeftRadius: scale(24),
        borderBottomRightRadius: scale(24),
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
    /* Decorative shapes */
    heroDecor: {
        ...StyleSheet.absoluteFillObject,
        overflow: "hidden",
    },
    heroDecorShape1: {
        position: "absolute",
        width: scale(180),
        height: scale(180),
        borderRadius: scale(90),
        backgroundColor: "rgba(255,255,255,0.05)",
        top: -scale(50),
        right: -scale(30),
    },
    heroDecorShape2: {
        position: "absolute",
        width: scale(140),
        height: scale(140),
        borderRadius: scale(70),
        backgroundColor: "rgba(255,255,255,0.03)",
        bottom: -scale(40),
        left: -scale(30),
    },
    heroDecorShape3: {
        position: "absolute",
        width: scale(90),
        height: scale(90),
        borderRadius: scale(45),
        backgroundColor: "rgba(255,255,255,0.04)",
        top: scale(30),
        left: scale(100),
    },
    /* Top row */
    heroTopRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: Spacing.md,
    },
    heroLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm + Spacing.xs,
    },
    avatarWrap: {
        ...Shadows.card,
        borderRadius: scale(20),
    },
    avatar: {
        width: scale(40),
        height: scale(40),
        borderRadius: scale(20),
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.3)",
    },
    avatarPlaceholder: {
        backgroundColor: Colors.white,
        alignItems: "center",
        justifyContent: "center",
    },
    heroGreeting: {
        fontSize: FontSizes.small,
        color: "rgba(255,255,255,0.8)",
        fontFamily: Fonts.regular,
        letterSpacing: 0.2,
    },
    heroName: {
        fontSize: FontSizes.title,
        color: Colors.white,
        fontFamily: Fonts.bold,
        letterSpacing: -0.3,
        marginTop: 1,
    },
    headerActions: {
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
    },
    heroNotifBtn: {
        width: scale(36),
        height: scale(36),
        borderRadius: scale(18),
        backgroundColor: Colors.white,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        ...Shadows.card,
    },
    heroNotifBadge: {
        position: "absolute",
        top: -1,
        right: -1,
        minWidth: scale(15),
        height: scale(15),
        borderRadius: scale(7.5),
        backgroundColor: Colors.error,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: Colors.white,
        paddingHorizontal: 2,
    },
    heroNotifBadgeText: {
        fontSize: 9,
        color: Colors.white,
        fontFamily: Fonts.bold,
        lineHeight: 11,
    },
    /* Title section */
    titleSection: {
        marginBottom: Spacing.md,
    },
    heroTitle: {
        fontSize: FontSizes.heading,
        fontFamily: Fonts.bold,
        color: Colors.white,
        letterSpacing: -0.4,
        marginBottom: 2,
    },
    heroSubtitle: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.regular,
        color: "rgba(255,255,255,0.75)",
    },
    /* Today Stats Bar */
    todayBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.12)",
        borderRadius: 16,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm + 2,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
    },
    todayItem: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    todayIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.15)",
        alignItems: "center",
        justifyContent: "center",
    },
    rupeeIcon: {
        fontSize: 14,
        fontFamily: Fonts.bold,
        color: "#EBD9C0",
    },
    todayLabel: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.medium,
        color: "rgba(255,255,255,0.75)",
    },
    todayValue: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.white,
    },
    todayDivider: {
        width: 1,
        height: 24,
        backgroundColor: "rgba(255,255,255,0.2)",
        marginHorizontal: 8,
    },
});
