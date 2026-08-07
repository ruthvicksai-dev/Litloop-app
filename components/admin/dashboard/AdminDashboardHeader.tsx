import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing, Layout, scale } from "@/constants/theme";
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
            </View>

            <SafeAreaView edges={["top"]} style={styles.heroSafeArea}>
                <View style={styles.heroContent}>
                    {/* Top Row: Avatar + Greeting | Actions */}
                    <View style={styles.topRow}>
                        <View style={styles.greetingRow}>
                            <View>
                                <Text style={styles.greetingText}>{greeting}</Text>
                                <Text style={styles.adminName}>Admin 👋</Text>
                            </View>
                        </View>
                        <View style={styles.headerActions}>
                            <TouchableOpacity style={styles.iconBtn} onPress={onNotificationsPress}>
                                <Ionicons
                                    name={unreadCount > 0 ? "notifications" : "notifications-outline"}
                                    size={18}
                                    color={Colors.primary}
                                />
                                {unreadCount > 0 ? <View style={styles.badge} /> : null}
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconBtn} onPress={onSettingsPress}>
                                <Ionicons name="settings-outline" size={18} color={Colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Title Section */}
                    <View style={styles.titleSection}>
                        <Text style={styles.heroTitle}>Dashboard</Text>
                        <Text style={styles.heroSubtitle}>Manage LitLoop effortlessly</Text>
                    </View>

                    {/* Today's Stats Bar */}
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
        borderBottomLeftRadius: Layout.cardRadiusLarge + scale(8),
        borderBottomRightRadius: Layout.cardRadiusLarge + scale(8),
        overflow: "hidden",
    },
    heroSafeArea: {
        // Safe area handles top inset cleanly
    },
    heroContent: {
        paddingHorizontal: Layout.screenPaddingWide,
        paddingTop: Spacing.sm,
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
    /* Top row */
    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: Spacing.sm,
    },
    greetingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    avatarCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.white,
        alignItems: "center",
        justifyContent: "center",
    },
    greetingText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: "rgba(255,255,255,0.8)",
    },
    adminName: {
        fontSize: FontSizes.bodyLarge,
        fontFamily: Fonts.regular,
        color: Colors.white,
    },
    headerActions: {
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
    },
    iconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.white,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    badge: {
        position: "absolute",
        top: 6,
        right: 6,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.error,
        borderWidth: 1.5,
        borderColor: Colors.white,
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
    },
    heroSubtitle: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.regular,
        color: "rgba(255,255,255,0.7)",
        marginTop: 1,
    },
    /* Today bar */
    todayBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.2)",
        borderRadius: 14,
        paddingVertical: 8,
        paddingHorizontal: 14,
    },
    todayItem: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    todayIconWrap: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: "rgba(235,217,192,0.15)",
        alignItems: "center",
        justifyContent: "center",
    },
    rupeeIcon: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: "#EBD9C0",
    },
    todayLabel: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.medium,
        color: "rgba(235,217,192,0.7)",
    },
    todayValue: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.white,
    },
    todayDivider: {
        width: 1,
        height: 26,
        backgroundColor: "rgba(235,217,192,0.2)",
        marginHorizontal: 6,
    },
});
