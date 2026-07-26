import { RentalHistoryCard } from "@/components/history/RentalHistoryCard";
import { GuestView } from "@/components/profile/GuestProfileView";
import { RentalHistorySkeleton } from "@/components/ui/skeletons/RentalHistorySkeleton";
import { Skeleton } from "@/components/ui/skeletons/Skeleton";
import { Shadows } from "@/constants/designTokens";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, scale, Spacing } from "@/constants/theme";
import { useAuthState } from "@/context/AuthContext";
import { api } from "@/convex/_generated/api";
import RentalFilterPanel from "@/components/rental/RentalFilterPanel";
import { useFadeSlideIn, useRentalFilters } from "@/hooks";
import { triggerHaptic } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    Animated,
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* ─── Constants ────────────────────────────────────────────────────────── */

const ILLUSTRATION_SIZE = scale(145);
const FEATURE_ICON_SIZE = scale(36);

/* ─── Information Strip Data ───────────────────────────────────────────── */

const INFO_ITEMS = [
    {
        icon: "book-outline" as const,
        title: "Completed Rentals",
        desc: "All your finished rentals appear here.",
    },
    {
        icon: "star-outline" as const,
        title: "Reading Progress",
        desc: "Track every book you've completed.",
    },
    {
        icon: "time-outline" as const,
        title: "History Forever",
        desc: "Access previous rentals anytime.",
    },
];

/* ─── Screen ───────────────────────────────────────────────────────────── */

export default function RentalHistoryScreen() {
    const { user, userId, accessToken, isLoading } = useAuthState();
    const [refreshing, setRefreshing] = useState(false);
    const {
        statusFilter,
        setStatusFilter,
        timeframeFilter,
        setTimeframeFilter,
        showFilters,
        toggleFilters,
    } = useRentalFilters();

    const history = useQuery(
        api.rentals.getRentalHistory,
        userId && accessToken
            ? { userId, accessToken, status: statusFilter, timeframe: timeframeFilter }
            : "skip"
    );
    const { fadeAnim, slideAnim } = useFadeSlideIn();
    const [expandedRentalId, setExpandedRentalId] = useState<string | null>(null);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        triggerHaptic("light");
        // Convex queries auto-refresh, so we just simulate a delay for UX
        setTimeout(() => setRefreshing(false), 800);
    }, []);

    const handleFilterPress = (type: "status" | "time", value: string) => {
        triggerHaptic("light");
        if (type === "status") {
            setStatusFilter(value as any);
        } else {
            setTimeframeFilter(value as any);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.skeletonHeader}>
                    <Skeleton width={180} height={32} style={{ marginBottom: 8 }} />
                    <Skeleton width={150} height={16} />
                </View>
                <View style={styles.list}>
                    <RentalHistorySkeleton />
                    <RentalHistorySkeleton />
                    <RentalHistorySkeleton />
                </View>
            </SafeAreaView>
        );
    }

    if (!user) {
        return (
            <GuestView
                title="Sign in for history"
                subtitle="View your past rentals and returned books by signing in to your account!"
                headerTitle="Rental History"
                icon="time-outline"
            />
        );
    }

    if (user.role === "admin") {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <Text style={styles.adminTitle}>Admin Access</Text>
                    <Text style={[styles.adminSubtitle, { textAlign: "center", paddingHorizontal: 40, marginTop: 8 }]}>
                        Rental history is managed through the Admin Dashboard.
                    </Text>
                    <TouchableOpacity
                        style={{ marginTop: 24 }}
                        onPress={() => router.replace("/(admin)/dashboard")}
                    >
                        <Text style={{ color: Colors.primary, fontFamily: Fonts.bold, fontSize: FontSizes.subtitle }}>
                            Go to Dashboard
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (history === undefined) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.skeletonHeader}>
                    <Skeleton width={180} height={32} style={{ marginBottom: 8 }} />
                    <Skeleton width={150} height={16} />
                </View>
                <View style={styles.list}>
                    <RentalHistorySkeleton />
                    <RentalHistorySkeleton />
                    <RentalHistorySkeleton />
                </View>
            </SafeAreaView>
        );
    }

    /* ── Render Hero Header ────────────────────────────────────────────── */
    const renderHeroHeader = () => (
        <LinearGradient
            colors={[Colors.primaryDark, Colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroHeader}
        >
            {/* Decorative background shapes */}
            <View style={styles.heroDecor} pointerEvents="none">
                <View style={styles.heroDecorShape1} />
                <View style={styles.heroDecorShape2} />
                <View style={styles.heroDecorShape3} />
                <Image
                    source={require("@/assets/images/bookshelf-pattern.png")}
                    style={styles.heroBookshelfBg}
                    contentFit="cover"
                />
            </View>

            <SafeAreaView edges={["top"]}>
                <Animated.View
                    style={[
                        styles.heroContent,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <View style={styles.heroTopRow}>
                        <View style={styles.heroTextWrap}>
                            <Text style={styles.heroTitle} allowFontScaling={false}>
                                Rental History
                            </Text>
                            <Text style={styles.heroSubtitle} allowFontScaling={false}>
                                Past completed rentals
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.heroActionBtn}
                            onPress={() => {
                                triggerHaptic("light");
                                toggleFilters();
                            }}
                            activeOpacity={0.85}
                        >
                            <Ionicons
                                name={showFilters ? "options" : "options-outline"}
                                size={scale(18)}
                                color={Colors.primary}
                            />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </SafeAreaView>
        </LinearGradient>
    );

    /* ── Has History — show the FlatList with rental history cards ─────── */
    if (history.length > 0) {
        return (
            <View style={styles.container}>
                {renderHeroHeader()}

                <RentalFilterPanel
                    visible={showFilters}
                    statusFilter={statusFilter}
                    timeframeFilter={timeframeFilter}
                    onFilterChange={handleFilterPress}
                />

                <FlatList
                    data={history}
                    keyExtractor={(item) => item._id}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
                    }
                    renderItem={({ item, index }) => (
                        <RentalHistoryCard
                            item={item}
                            index={index}
                            isExpanded={expandedRentalId === item._id}
                            onToggleExpand={(id) => {
                                triggerHaptic("light");
                                setExpandedRentalId(prev => prev === id ? null : id);
                            }}
                            fadeAnim={fadeAnim}
                            slideAnim={slideAnim}
                        />
                    )}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        );
    }

    /* ── Empty State — premium redesigned layout ──────────────────────── */
    return (
        <View style={styles.container}>
            {renderHeroHeader()}

            <RentalFilterPanel
                visible={showFilters}
                statusFilter={statusFilter}
                timeframeFilter={timeframeFilter}
                onFilterChange={handleFilterPress}
            />

            {/* ─── Scrollable Content ───────────────────────────────────── */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
                }
            >

                {/* ─── Empty State Card ─────────────────────────────────── */}
                <View style={styles.emptyCard}>
                    {/* Left Side */}
                    <View style={styles.emptyCardLeft}>
                        {/* Icon Badge */}
                        <View style={styles.emptyIconBadge}>
                            <Ionicons
                                name="time-outline"
                                size={scale(18)}
                                color={Colors.primary}
                            />
                        </View>

                        {/* Headline */}
                        <Text
                            style={styles.emptyCardTitle}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.85}
                            allowFontScaling={false}
                        >
                            No rental history
                        </Text>

                        {/* Decorative divider */}
                        <View style={styles.emptyDividerRow}>
                            <View style={styles.emptyDividerLine} />
                            <Text style={styles.emptyDividerDiamond}>✦</Text>
                            <View style={styles.emptyDividerLine} />
                        </View>

                        {/* Description */}
                        <Text style={styles.emptyCardDesc} allowFontScaling={false}>
                            Your completed rentals will appear here once you return books. Track your reading journey and revisit your favourite reads anytime.
                        </Text>

                        {/* Browse Books CTA */}
                        <TouchableOpacity
                            style={styles.emptyCardCta}
                            activeOpacity={0.85}
                            onPress={() => router.push("/(tabs)")}
                        >
                            <Text style={styles.emptyCardCtaText} allowFontScaling={false}>
                                Browse Books
                            </Text>
                            <Ionicons
                                name="arrow-forward"
                                size={scale(14)}
                                color={Colors.white}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Right Side — Illustration */}
                    <View style={styles.emptyCardRight}>
                        <View style={styles.illustrationCircle} />
                        <Image
                            source={require("@/assets/images/history-illustration.png")}
                            style={styles.illustrationImage}
                            contentFit="cover"
                            cachePolicy="disk"
                        />
                    </View>
                </View>

                {/* ─── Feature / Info Strip ──────────────────────────────── */}
                <View style={styles.infoStrip}>
                    {INFO_ITEMS.map((item) => (
                        <View key={item.title} style={styles.infoItem}>
                            <View style={styles.infoIconWrap}>
                                <Ionicons
                                    name={item.icon}
                                    size={scale(16)}
                                    color={Colors.primary}
                                />
                            </View>
                            <Text style={styles.infoTitle} allowFontScaling={false}>
                                {item.title}
                            </Text>
                            <Text style={styles.infoDesc} allowFontScaling={false}>
                                {item.desc}
                            </Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

/* ─── Styles ───────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
    /* ── Layout ──────────────────────────────────────────────────────────── */
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.background,
    },
    scroll: {
        paddingTop: scale(24),
        paddingBottom: Layout.tabBarHeight + Spacing.lg,
    },

    /* ── Skeleton Loading Header ─────────────────────────────────────────── */
    skeletonHeader: {
        paddingHorizontal: Layout.screenPaddingWide,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.background,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(109, 58, 61, 0.08)",
    },

    /* ── Hero Header ─────────────────────────────────────────────────────── */
    heroHeader: {
        borderBottomLeftRadius: Layout.cardRadiusLarge + scale(8),
        borderBottomRightRadius: Layout.cardRadiusLarge + scale(8),
        overflow: "hidden",
        ...Shadows.elevated,
    },
    heroContent: {
        paddingHorizontal: Layout.screenPaddingWide,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xl + Spacing.xs,
    },
    heroTopRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: Spacing.xs,
    },
    heroTextWrap: {
        flex: 1,
        paddingRight: Spacing.sm,
    },
    heroTitle: {
        fontSize: FontSizes.heading,
        color: Colors.white,
        fontFamily: Fonts.bold,
        letterSpacing: -0.4,
        marginBottom: Spacing.xs,
    },
    heroSubtitle: {
        fontSize: FontSizes.subtitle,
        color: "rgba(255,255,255,0.7)",
        fontFamily: Fonts.regular,
        letterSpacing: 0.1,
    },
    heroActionBtn: {
        width: scale(38),
        height: scale(38),
        borderRadius: scale(19),
        backgroundColor: Colors.white,
        alignItems: "center",
        justifyContent: "center",
        ...Shadows.card,
    },

    /* Hero — decorative background */
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
    heroBookshelfBg: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.06,
    },

    /* ── Filter Panel ────────────────────────────────────────────────────── */
    filterPanel: {
        marginHorizontal: Layout.screenPaddingWide,
        marginTop: Spacing.sm,
        marginBottom: Spacing.md,
        backgroundColor: Colors.surfaceCard,
        borderRadius: Layout.cardRadius,
        padding: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.borderSubtle,
        ...Shadows.subtle,
    },
    filterSectionTitle: {
        fontSize: FontSizes.tiny,
        color: Colors.textSecondary,
        fontFamily: Fonts.bold,
        marginBottom: 6,
    },
    filterRow: {
        flexDirection: "row",
        flexWrap: "nowrap",
        gap: 6,
        marginBottom: Spacing.sm,
    },
    filterChip: {
        flex: 1,
        minHeight: 38,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: Colors.surfaceCard,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    filterChipThird: {
        paddingHorizontal: 6,
    },
    filterChipHalf: {
        paddingHorizontal: 6,
    },
    filterChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterChipText: {
        fontSize: FontSizes.tiny,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
        textAlign: "center",
    },
    filterChipTextActive: {
        color: Colors.white,
    },

    /* ── Empty State Card ────────────────────────────────────────────────── */
    emptyCard: {
        flexDirection: "row",
        backgroundColor: Colors.surfaceCard,
        borderRadius: Layout.cardRadiusLarge,
        marginHorizontal: Layout.screenPaddingWide,
        paddingLeft: Spacing.md + 4,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.md,
        paddingRight: 0,
        ...Shadows.card,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.04)",
        overflow: "hidden",
    },
    emptyCardLeft: {
        flex: 1.25,
        paddingRight: Spacing.xs,
        justifyContent: "center",
    },
    emptyIconBadge: {
        width: scale(38),
        height: scale(38),
        borderRadius: scale(19),
        backgroundColor: "rgba(109, 58, 61, 0.07)",
        borderWidth: 1,
        borderColor: "rgba(109, 58, 61, 0.12)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: Spacing.xs + 2,
    },
    emptyCardTitle: {
        fontSize: FontSizes.title,
        color: Colors.text,
        fontFamily: Fonts.bold,
        letterSpacing: -0.3,
        marginBottom: Spacing.xs / 2,
    },
    emptyDividerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: Spacing.xs,
        gap: Spacing.xs,
    },
    emptyDividerLine: {
        width: scale(28),
        height: 1,
        backgroundColor: Colors.primaryLight,
    },
    emptyDividerDiamond: {
        fontSize: FontSizes.tiny,
        color: Colors.primary,
    },
    emptyCardDesc: {
        fontSize: FontSizes.caption,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        lineHeight: FontSizes.caption * 1.5,
        marginBottom: Spacing.md,
    },
    emptyCardCta: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.md + 2,
        paddingVertical: scale(10),
        borderRadius: scale(22),
        alignSelf: "flex-start",
        gap: Spacing.xs + 2,
        ...Shadows.primary,
    },
    emptyCardCtaText: {
        fontSize: FontSizes.body,
        color: Colors.white,
        fontFamily: Fonts.bold,
    },

    /* Empty card — right side illustration */
    emptyCardRight: {
        width: ILLUSTRATION_SIZE,
        alignItems: "center",
        justifyContent: "center",
        paddingRight: Spacing.sm,
    },
    illustrationCircle: {
        position: "absolute",
        width: ILLUSTRATION_SIZE - scale(15),
        height: ILLUSTRATION_SIZE - scale(15),
        borderRadius: (ILLUSTRATION_SIZE - scale(15)) / 2,
        backgroundColor: "rgba(235, 217, 192, 0.35)",
    },
    illustrationImage: {
        width: ILLUSTRATION_SIZE,
        height: ILLUSTRATION_SIZE,
    },

    /* ── Information Strip (Matched to My Rentals Feature Strip) ────────── */
    infoStrip: {
        flexDirection: "row",
        marginHorizontal: Layout.screenPaddingWide,
        marginTop: Spacing.md + 4,
        backgroundColor: Colors.surfaceCard,
        borderRadius: Layout.cardRadius,
        padding: Spacing.md,
        ...Shadows.subtle,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.04)",
    },
    infoItem: {
        flex: 1,
        alignItems: "center",
    },
    infoIconWrap: {
        width: FEATURE_ICON_SIZE,
        height: FEATURE_ICON_SIZE,
        borderRadius: FEATURE_ICON_SIZE / 2,
        backgroundColor: `${Colors.primary}0A`,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: Spacing.sm,
    },
    infoTitle: {
        fontSize: FontSizes.tiny,
        color: Colors.text,
        fontFamily: Fonts.bold,
        textAlign: "center",
        marginBottom: Spacing.xs,
    },
    infoDesc: {
        fontSize: FontSizes.tiny,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        textAlign: "center",
        lineHeight: FontSizes.tiny * 1.4,
    },

    /* ── List ────────────────────────────────────────────────────────────── */
    list: {
        flexGrow: 1,
        paddingHorizontal: Layout.screenPaddingWide,
        paddingTop: Spacing.sm,
        paddingBottom: Layout.tabBarHeight + Spacing.lg,
    },

    /* ── Admin / Loading States ──────────────────────────────────────────── */
    adminTitle: {
        fontSize: FontSizes.titleLarge,
        color: Colors.text,
        fontFamily: Fonts.bold,
        letterSpacing: -0.3,
    },
    adminSubtitle: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        marginTop: 4,
        fontFamily: Fonts.regular,
    },
});
