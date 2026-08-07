import { GuestView } from "@/components/profile/GuestProfileView";
import RentalFilterPanel from "@/components/rental/RentalFilterPanel";
import RentalCard from "@/components/ui/cards/RentalCard";
import BookLoader from "@/components/ui/feedback/BookLoader";
import { Shadows } from "@/constants/designTokens";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, scale, Spacing } from "@/constants/theme";
import { useAuthState } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { useFadeSlideIn, useRentalFilters } from "@/hooks";
import { triggerHaptic } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo } from "react";
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

/* ─── Feature Strip Data ───────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: "book-outline" as const,
    title: "Rent easily",
    desc: "Find and rent books in a few taps",
  },
  {
    icon: "reader-outline" as const,
    title: "Read anytime",
    desc: "Enjoy books at your own pace",
  },
  {
    icon: "heart-outline" as const,
    title: "Return easily",
    desc: "Hassle-free returns when you're done",
  },
];

/* ─── Screen ───────────────────────────────────────────────────────────── */

export default function MyRentalsScreen() {
  const { user, userId, accessToken, isLoading } = useAuthState();
  const { showToast } = useToast();
  const {
    statusFilter,
    setStatusFilter,
    timeframeFilter,
    setTimeframeFilter,
    showFilters,
    toggleFilters,
  } = useRentalFilters();

  const rentals = useQuery(
    api.rentals.getUserRentals,
    userId && accessToken ? { userId, accessToken } : "skip",
  );
  const router = useRouter();
  const { fadeAnim, slideAnim } = useFadeSlideIn();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    triggerHaptic("light");
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

  const filteredRentals = useMemo(() => {
    if (!rentals) return [];
    return rentals.filter((rental) => {
      // Status filter
      if (statusFilter === "paid" && rental.status !== "paid") return false;
      if (statusFilter === "returned" && rental.status !== "returned") return false;

      // Timeframe filter
      if (timeframeFilter !== "all" && rental._creationTime) {
        const now = Date.now();
        const rentalTime = rental._creationTime;
        if (
          timeframeFilter === "last_30_days" &&
          now - rentalTime > 30 * 24 * 60 * 60 * 1000
        )
          return false;
        if (timeframeFilter === "this_month") {
          const d = new Date(rentalTime);
          const n = new Date();
          if (
            d.getMonth() !== n.getMonth() ||
            d.getFullYear() !== n.getFullYear()
          )
            return false;
        }
        if (timeframeFilter === "this_year") {
          const d = new Date(rentalTime);
          const n = new Date();
          if (d.getFullYear() !== n.getFullYear()) return false;
        }
      }
      return true;
    });
  }, [rentals, statusFilter, timeframeFilter]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <BookLoader label="Loading rentals..." />
      </View>
    );
  }

  if (!user) {
    return (
      <GuestView
        title="Sign in to see rentals"
        subtitle="Manage your active book rentals, track deliveries, and more by signing in!"
        headerTitle="My Rentals"
        icon="book-outline"
      />
    );
  }

  if (user.role === "admin") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Admin Access</Text>
          <Text
            style={[
              styles.subtitle,
              { textAlign: "center", paddingHorizontal: 40 },
            ]}
          >
            User rentals are managed through the Admin Dashboard.
          </Text>
          <TouchableOpacity
            style={[styles.browseBtn, { marginTop: 20 }]}
            onPress={() => router.replace("/(admin)/dashboard")}
          >
            <Text style={styles.browseLink}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (rentals === undefined) {
    return (
      <View style={styles.center}>
        <BookLoader label="Loading rentals..." />
      </View>
    );
  }

  const handleRentalPress = (rental: (typeof rentals)[number]) => {
    if (rental.status === "delivered") {
      const deliveryTimestamp = rental.deliveredAt
        ? rental.deliveredAt
        : (rental.deliveryDate ? new Date(rental.deliveryDate).getTime() : 0);
      const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
      const elapsed = Date.now() - deliveryTimestamp;

      if (deliveryTimestamp > 0 && elapsed < TWELVE_HOURS_MS) {
        const hoursLeft = Math.ceil((TWELVE_HOURS_MS - elapsed) / (1000 * 60 * 60));
        showToast(
          `Pickup Will be enabled after 12 hours from delivery (${hoursLeft}h remaining).`,
          "info"
        );
        return;
      }
      router.push(`/rental/schedule-return?rentalId=${rental._id}`);
    } else if (rental.status === "pickup_scheduled") {
      router.push(`/rental/payment?rentalId=${rental._id}`);
    }
  };

  /* ── Has Rentals — show the FlatList with rental cards ─────────────── */
  if (rentals.length > 0) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" animated />
        {/* ─── Premium Hero Header ──────────────────────────────── */}
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
                    My Rentals
                  </Text>
                  <Text style={styles.heroSubtitle} allowFontScaling={false}>
                    Active book rentals
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

        <RentalFilterPanel
          visible={showFilters}
          statusFilter={statusFilter}
          timeframeFilter={timeframeFilter}
          onFilterChange={handleFilterPress}
        />

        <FlatList
          data={filteredRentals}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => (
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 30],
                      outputRange: [0, 30 + index * 6],
                    }),
                  },
                ],
              }}
            >
              <RentalCard
                bookTitle={item.book?.title || "Unknown Book"}
                bookAuthor={item.book?.author || "Unknown Author"}
                coverUrl={item.coverUrl || item.book?.coverUrl}
                status={item.status}
                deliveredAt={item.deliveredAt}
                deliveryDate={item.deliveryDate}
                deliveryTime={item.deliveryTime}
                pickupDate={item.pickupDate}
                rentPerDay={item.rentPerDay}
                totalRent={item.totalRent}
                zone={item.zone}
                onPress={() => handleRentalPress(item)}
              />
            </Animated.View>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
        />
      </View>
    );
  }

  /* ── Empty State — premium redesigned layout ──────────────────────── */
  return (
    <View style={styles.container}>
      <StatusBar style="light" animated />
      {/* ─── Premium Hero Header ──────────────────────────────────── */}
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
                  My Rentals
                </Text>
                <Text style={styles.heroSubtitle} allowFontScaling={false}>
                  Active book rentals
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
      >
        {/* ─── Empty State Card ─────────────────────────────────── */}
        <View style={styles.emptyCard}>
          {/* Left Side */}
          <View style={styles.emptyCardLeft}>
            {/* Icon Badge */}
            <View style={styles.emptyIconBadge}>
              <Ionicons
                name="clipboard-outline"
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
              No active rentals
            </Text>

            {/* Decorative divider */}
            <View style={styles.emptyDividerRow}>
              <View style={styles.emptyDividerLine} />
              <Text style={styles.emptyDividerDiamond}>✦</Text>
              <View style={styles.emptyDividerLine} />
            </View>

            {/* Description */}
            <Text style={styles.emptyCardDesc} allowFontScaling={false}>
              You haven&apos;t rented any books yet. Start exploring our collection
              and begin your reading journey!
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
              source={require("@/assets/images/reading-illustration.png")}
              style={styles.illustrationImage}
              contentFit="cover"
              cachePolicy="disk"
            />
          </View>
        </View>

        {/* ─── Feature Strip ────────────────────────────────────── */}
        <View style={styles.featureStrip}>
          {FEATURES.map((feat) => (
            <View key={feat.title} style={styles.featureItem}>
              <View style={styles.featureIconWrap}>
                <Ionicons
                  name={feat.icon}
                  size={scale(16)}
                  color={Colors.primary}
                />
              </View>
              <Text style={styles.featureTitle} allowFontScaling={false}>
                {feat.title}
              </Text>
              <Text style={styles.featureDesc} allowFontScaling={false}>
                {feat.desc}
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

  /* ── Feature Strip ───────────────────────────────────────────────────── */
  featureStrip: {
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
  featureItem: {
    flex: 1,
    alignItems: "center",
  },
  featureIconWrap: {
    width: FEATURE_ICON_SIZE,
    height: FEATURE_ICON_SIZE,
    borderRadius: FEATURE_ICON_SIZE / 2,
    backgroundColor: `${Colors.primary}0A`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  featureTitle: {
    fontSize: FontSizes.caption,
    color: Colors.text,
    fontFamily: Fonts.bold,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  featureDesc: {
    fontSize: FontSizes.tiny,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
    textAlign: "center",
    lineHeight: FontSizes.tiny * 1.5,
  },

  /* ── Preserved styles (admin, loading states) ────────────────────────── */
  title: {
    fontSize: FontSizes.heading,
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  subtitle: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontFamily: Fonts.regular,
  },
  list: {
    flexGrow: 1,
    paddingHorizontal: Layout.screenPaddingWide,
    paddingTop: Spacing.sm,
    paddingBottom: Layout.touchSize * 2,
  },
  emptyTitle: {
    fontSize: FontSizes.subtitle,
    color: Colors.text,
    fontFamily: Fonts.bold,
    textAlign: "center",
  },
  browseBtn: {
    marginTop: Spacing.sm,
  },
  browseLink: {
    fontSize: FontSizes.subtitle,
    color: Colors.primary,
    fontFamily: Fonts.medium,
  },
});
function showToast(arg0: string, arg1: string) {
  throw new Error("Function not implemented.");
}

