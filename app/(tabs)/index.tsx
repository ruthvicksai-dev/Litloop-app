import BookLoader from "@/components/ui/BookLoader";
import DiscoverSectionRow from "@/components/ui/DiscoverSectionRow";
import SeriesSectionRow from "@/components/ui/SeriesSectionRow";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing, scale } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useDiscoverSections } from "@/hooks/useDiscoverSections";
import { useHomeEntrance } from "@/hooks/useHomeEntrance";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { fadeAnim, slideAnim } = useHomeEntrance();
  const { topPicks, top10Books, trendingBooks, famousBooks, seriesBooks, newlyAddedBooks } = useDiscoverSections();

  const isLoading =
    topPicks === undefined &&
    top10Books === undefined &&
    trendingBooks === undefined &&
    famousBooks === undefined &&
    seriesBooks === undefined &&
    newlyAddedBooks === undefined;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <BookLoader label="Loading books..." />
      </View>
    );
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
            <Text style={styles.greeting}>
              Hello, {user?.name?.split(" ")[0] || "Reader"}
            </Text>
            <Text style={styles.pageTitle}>Discover Books</Text>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            activeOpacity={0.7}
            onPress={() => router.push("/notifications" as any)}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.primary} />
            <View style={styles.notifBadge} />
          </TouchableOpacity>
        </View>
      </Animated.View>


      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
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
    paddingBottom: Spacing.sm,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notifBtn: {
    width: Layout.touchSize,
    height: Layout.touchSize,
    borderRadius: Layout.borderRadius,
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadge: {
    position: "absolute",
    top: scale(12),
    right: scale(12),
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
    backgroundColor: Colors.error,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  greeting: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontFamily: Fonts.regular,
  },
  pageTitle: {
    fontSize: FontSizes.heading,
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  scroll: {
    paddingTop: Spacing.md,
    paddingBottom: scale(90),
  },
});
