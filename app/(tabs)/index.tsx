import BannerSlider from "@/components/home/BannerSlider";
import DiscoverSectionRow from "@/components/ui/cards/DiscoverSectionRow";
import SeriesSectionRow from "@/components/ui/cards/SeriesSectionRow";
import { HomeSkeleton } from "@/components/ui/skeletons/HomeSkeleton";
import { Shadows } from "@/constants/designTokens";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, scale, Spacing } from "@/constants/theme";
import { useAuthState } from "@/context/AuthContext";
import { api } from "@/convex/_generated/api";
import { useDiscoverSections, useHomeEntrance } from "@/hooks";
import { triggerHaptic } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* ─── Helpers ──────────────────────────────────────────────────────────── */

function formatRatingCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return String(count);
}

/* ─── Screen ───────────────────────────────────────────────────────────── */

export default function HomeScreen() {
  const { user, accessToken } = useAuthState();
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);
  const { fadeAnim, slideAnim } = useHomeEntrance();
  const {
    topPicks,
    top10Books,
    trendingBooks,
    famousBooks,
    seriesBooks,
    newlyAddedBooks,
    banners,
  } = useDiscoverSections();
  const unreadCount =
    useQuery(
      api.notifications.getUnreadCount,
      accessToken ? { accessToken } : "skip",
    ) ?? 0;

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    triggerHaptic("light");
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning,";
    if (hour >= 12 && hour < 17) return "Good Afternoon,";
    return "Good Evening,";
  }, []);

  const featuredBook = topPicks?.[0];

  const featuredImageUri = React.useMemo(() => {
    if (!featuredBook) return undefined;
    return featuredBook.coverUrls && featuredBook.coverUrls.length > 0
      ? featuredBook.coverUrls[0]
      : (featuredBook.coverUrl ?? undefined);
  }, [featuredBook]);

  const isLoading =
    topPicks === undefined &&
    top10Books === undefined &&
    trendingBooks === undefined &&
    famousBooks === undefined &&
    seriesBooks === undefined &&
    newlyAddedBooks === undefined;

  if (isLoading) {
    return <HomeSkeleton />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" animated />
      {/* ─── Premium Hero Header ──────────────────────────────────────── */}
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
        </View>

        <SafeAreaView edges={["top"]} style={styles.heroSafeArea}>
          <Animated.View
            style={[
              styles.heroContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Top Row: Avatar + Greeting | Notification */}
            <View style={styles.heroTopRow}>
              <View style={styles.heroLeft}>
                <View style={styles.avatarWrap}>
                  {user?.avatarUrl ? (
                    <Image
                      source={user.avatarUrl}
                      style={styles.avatar}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <Ionicons
                        name="person"
                        size={scale(17)}
                        color={Colors.primary}
                      />
                    </View>
                  )}
                </View>
                <View>
                  <Text style={styles.heroGreeting} allowFontScaling={false}>
                    {greeting}
                  </Text>
                  <Text style={styles.heroName} allowFontScaling={false}>
                    {user
                      ? user.role === "admin"
                        ? "Admin"
                        : user.name.split(" ")[0]
                      : "Reader"}{" "}
                    👋
                  </Text>
                </View>
              </View>

              {user ? (
                user.role !== "admin" ? (
                  <TouchableOpacity
                    style={styles.heroNotifBtn}
                    activeOpacity={0.7}
                    onPress={() => {
                      triggerHaptic("light");
                      router.push("/notifications" as any);
                    }}
                  >
                    <Ionicons
                      name={
                        unreadCount > 0
                          ? "notifications"
                          : "notifications-outline"
                      }
                      size={scale(18)}
                      color={Colors.primary}
                    />
                    {unreadCount > 0 && (
                      <View style={styles.heroNotifBadge}>
                        <Text
                          style={styles.heroNotifBadgeText}
                          allowFontScaling={false}
                        >
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ) : null
              ) : (
                <TouchableOpacity
                  style={styles.heroNotifBtn}
                  activeOpacity={0.7}
                  onPress={() => {
                    triggerHaptic("light");
                    router.push("/(auth)/sign-in");
                  }}
                >
                  <Ionicons
                    name="log-in-outline"
                    size={scale(18)}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.heroTitle} allowFontScaling={false}>
              Discover Books
            </Text>
            <Text style={styles.heroSubtitle} allowFontScaling={false}>
              Great stories. Anytime, anywhere.
            </Text>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>

      {/* ─── Scrollable Content ───────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
      >
        {/* ─── Sliding Banners / Featured Banner ─────────────────────── */}
        {banners && banners.length > 0 ? (
          <BannerSlider banners={banners} />
        ) : featuredBook ? (
          <View style={styles.bannerOuter}>
            <View style={styles.banner}>
              {/* Left — Info */}
              <View style={styles.bannerLeft}>
                <View style={styles.bannerBadge}>
                  <Text style={styles.bannerBadgeText} allowFontScaling={false}>
                    ★ BOOK OF THE WEEK
                  </Text>
                </View>

                <Text
                  style={styles.bannerTitle}
                  numberOfLines={3}
                  allowFontScaling={false}
                >
                  {featuredBook.title}
                </Text>

                {featuredBook.description ? (
                  <Text
                    style={styles.bannerDesc}
                    numberOfLines={2}
                    allowFontScaling={false}
                  >
                    {featuredBook.description}
                  </Text>
                ) : null}

                <View style={styles.bannerRatingRow}>
                  <Ionicons
                    name="star"
                    size={scale(14)}
                    color={Colors.warning}
                  />
                  <Text
                    style={styles.bannerRatingValue}
                    allowFontScaling={false}
                  >
                    {(featuredBook.rating ?? 0).toFixed(1)}
                  </Text>
                  <Text
                    style={styles.bannerRatingCount}
                    allowFontScaling={false}
                  >
                    ({formatRatingCount(featuredBook.ratingCount ?? 0)} ratings)
                  </Text>
                </View>

                {/* Decorative-only button */}
                <View style={styles.bannerCta}>
                  <Text style={styles.bannerCtaText} allowFontScaling={false}>
                    Rent Now
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={scale(14)}
                    color={Colors.white}
                  />
                </View>
              </View>

              {/* Right — Cover */}
              <View style={styles.bannerRight}>
                <View style={styles.bannerDecorCircle1} />
                <View style={styles.bannerDecorCircle2} />
                <View style={styles.bannerCoverWrap}>
                  {featuredImageUri ? (
                    <Image
                      source={featuredImageUri}
                      style={styles.bannerCoverImg}
                      contentFit="cover"
                      cachePolicy="disk"
                    />
                  ) : (
                    <View
                      style={[
                        styles.bannerCoverImg,
                        styles.bannerCoverFallback,
                      ]}
                    >
                      <Ionicons
                        name="book"
                        size={scale(32)}
                        color={Colors.primary}
                      />
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        ) : null}

        <DiscoverSectionRow
          title="Top Picks For You"
          subtitle="Highly rated books curated for readers"
          books={topPicks ?? []}
          seeAllKey="topPicks"
        />
        <DiscoverSectionRow
          title="Top 10 Rentals"
          subtitle="The most popular books right now"
          books={top10Books ?? []}
          seeAllKey="top10"
          isTop10
        />
        <DiscoverSectionRow
          title="Trending Books"
          subtitle="What everyone's reading this week"
          books={trendingBooks ?? []}
          seeAllKey="trending"
        />
        <DiscoverSectionRow
          title="Newly Added"
          subtitle="Fresh arrivals in our library"
          books={newlyAddedBooks ?? []}
          seeAllKey="newlyAdded"
        />
        <DiscoverSectionRow
          title="Famous Books"
          subtitle="Timeless classics and celebrated titles"
          books={famousBooks ?? []}
          seeAllKey="famous"
        />
        <SeriesSectionRow
          title="Book Series"
          subtitle="Explore our curated book collections"
          series={seriesBooks ?? []}
        />
      </ScrollView>
    </View>
  );
}

/* ─── Constants ────────────────────────────────────────────────────────── */

const AVATAR_SIZE = scale(34);
const BANNER_HEIGHT = scale(190);
const BANNER_COVER_W = scale(110);
const BANNER_COVER_H = scale(150);

/* ─── Styles ───────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  /* ── Layout ──────────────────────────────────────────────────────────── */
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingTop: Spacing.md,
    paddingBottom: Layout.tabBarHeight + Spacing.lg,
  },

  /* ── Hero Header ─────────────────────────────────────────────────────── */
  heroHeader: {
    borderBottomLeftRadius: Layout.cardRadiusLarge + scale(8),
    borderBottomRightRadius: Layout.cardRadiusLarge + scale(8),
    overflow: "hidden",
    ...Shadows.elevated,
  },
  heroSafeArea: {
    // SafeAreaView handles the top inset
  },
  heroContent: {
    paddingHorizontal: Layout.screenPaddingWide,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg + Spacing.xs,
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

  /* Hero — top row */
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md + Spacing.xs,
  },
  heroLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm + Spacing.xs,
  },
  avatarWrap: {
    ...Shadows.card,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatarPlaceholder: {
    backgroundColor: Colors.primaryLight,
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

  /* Hero — notification / login button */
  heroNotifBtn: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(17),
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
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

  /* Hero — title + subtitle */
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

  /* ── Book of the Week Banner ─────────────────────────────────────────── */
  bannerOuter: {
    paddingHorizontal: Layout.screenPaddingWide,
    marginBottom: Spacing.lg,
  },
  bannerImageContainer: {
    width: "100%",
    height: BANNER_HEIGHT,
    borderRadius: Layout.cardRadiusLarge,
    overflow: "hidden",
    ...Shadows.card,
  },
  fullBannerImage: {
    width: "100%",
    height: "100%",
    borderRadius: Layout.cardRadiusLarge,
  },
  banner: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceCard,
    borderRadius: Layout.cardRadiusLarge,
    padding: Spacing.md,
    minHeight: BANNER_HEIGHT,
    overflow: "hidden",
    ...Shadows.card,
  },
  bannerLeft: {
    flex: 1,
    justifyContent: "space-between",
    paddingRight: Spacing.sm,
  },
  bannerBadge: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.sm + Spacing.xs,
    paddingVertical: Spacing.xs + 1,
    borderRadius: scale(20),
    alignSelf: "flex-start",
  },
  bannerBadgeText: {
    fontSize: FontSizes.tiny,
    color: Colors.warning,
    fontFamily: Fonts.bold,
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: FontSizes.titleLarge,
    color: Colors.text,
    fontFamily: Fonts.bold,
    letterSpacing: -0.3,
    marginTop: Spacing.sm,
  },
  bannerDesc: {
    fontSize: FontSizes.caption,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
    lineHeight: FontSizes.caption * 1.4,
    marginTop: Spacing.xs,
  },
  bannerRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  bannerRatingValue: {
    fontSize: FontSizes.small,
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  bannerRatingCount: {
    fontSize: FontSizes.caption,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
  },
  bannerCta: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: scale(20),
    alignSelf: "flex-start",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    ...Shadows.primary,
  },
  bannerCtaText: {
    fontSize: FontSizes.small,
    color: Colors.white,
    fontFamily: Fonts.bold,
  },

  /* Banner — right (cover) */
  bannerRight: {
    width: BANNER_COVER_W + Spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  bannerDecorCircle1: {
    position: "absolute",
    width: scale(80),
    height: scale(80),
    borderRadius: scale(40),
    backgroundColor: Colors.primaryLight,
    opacity: 0.4,
    top: -Spacing.sm,
    right: -Spacing.sm,
  },
  bannerDecorCircle2: {
    position: "absolute",
    width: scale(60),
    height: scale(60),
    borderRadius: scale(30),
    backgroundColor: Colors.primaryAccent,
    opacity: 0.15,
    bottom: -Spacing.xs,
    left: -Spacing.sm,
  },
  bannerCoverWrap: {
    transform: [{ rotate: "-3deg" }],
    borderRadius: Layout.borderRadius,
    ...Shadows.elevated,
  },
  bannerCoverImg: {
    width: BANNER_COVER_W,
    height: BANNER_COVER_H,
    borderRadius: Layout.borderRadius,
  },
  bannerCoverFallback: {
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
});
