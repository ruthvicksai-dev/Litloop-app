import DiscoverSectionRow from "@/components/ui/cards/DiscoverSectionRow";
import { HomeSkeleton } from "@/components/ui/skeletons/HomeSkeleton";
import SeriesSectionRow from "@/components/ui/cards/SeriesSectionRow";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing } from "@/constants/theme";
import { useAuthState } from "@/context/AuthContext";
import { api } from "@/convex/_generated/api";
import { useDiscoverSections, useHomeEntrance } from "@/hooks";
import { triggerHaptic } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
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

export default function HomeScreen() {
  const { user, accessToken } = useAuthState();
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);
  const { fadeAnim, slideAnim } = useHomeEntrance();
  const { topPicks, top10Books, trendingBooks, famousBooks, seriesBooks, newlyAddedBooks } = useDiscoverSections();
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    accessToken ? { accessToken } : "skip"
  ) ?? 0;

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    triggerHaptic("light");
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

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
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting} allowFontScaling={false}>
              {user ? (user.role === "admin" ? "Hello, Admin" : `Hello, ${user.name.split(" ")[0]}`) : "Hello, Reader"}
            </Text>
            <Text style={styles.pageTitle} allowFontScaling={false}>
              Discover Books
            </Text>
          </View>

          {user ? (
            user.role !== "admin" ? (
              <TouchableOpacity
                style={styles.notifBtn}
                activeOpacity={0.7}
                onPress={() => {
                  triggerHaptic("light");
                  router.push("/notifications" as any);
                }}
              >
                <Ionicons name={unreadCount > 0 ? "notifications" : "notifications-outline"} size={24} color={Colors.primary} />
                {unreadCount > 0 && <View style={styles.notifBadge} />}
              </TouchableOpacity>
            ) : null
          ) : (
            <TouchableOpacity
              style={styles.loginBtn}
              activeOpacity={0.7}
              onPress={() => {
                triggerHaptic("light");
                router.push("/(auth)/sign-in");
              }}
            >
              <Ionicons name="log-in-outline" size={26} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>


      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  header: {
    paddingHorizontal: Layout.screenPaddingWide,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  loginBtn: {
    width: Layout.touchSize,
    height: Layout.touchSize,
    borderRadius: Layout.touchSize / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary + "08",
  },
  notifBtn: {
    width: Layout.touchSize,
    height: Layout.touchSize,
    borderRadius: Layout.touchSize / 2,
    backgroundColor: Colors.primary + "08",
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadge: {
    position: "absolute",
    top: Layout.badgeInset,
    right: Layout.badgeInset,
    width: Layout.badgeSize,
    height: Layout.badgeSize,
    borderRadius: Layout.badgeSize / 2,
    backgroundColor: Colors.error,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  greeting: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    marginBottom: 3,
    fontFamily: Fonts.regular,
  },
  pageTitle: {
    fontSize: FontSizes.heading,
    color: Colors.text,
    fontFamily: Fonts.bold,
    letterSpacing: -0.3,
  },
  scroll: {
    paddingTop: Spacing.sm,
    paddingBottom: Layout.tabBarHeight + Spacing.lg,
  },
});
