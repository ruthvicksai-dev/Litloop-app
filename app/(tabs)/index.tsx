import SearchInput from "@/components/shared/SearchInput";
import BookLoader from "@/components/ui/BookLoader";
import DiscoverSectionRow from "@/components/ui/DiscoverSectionRow";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useDiscoverSections } from "@/hooks/useDiscoverSections";
import { useHomeEntrance } from "@/hooks/useHomeEntrance";
import { responsiveFont } from "@/utils/responsiveFont";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { fadeAnim, slideAnim, searchFade } = useHomeEntrance();
  const { topPicks, top10Books, trendingBooks, famousBooks, seriesBooks, newlyAddedBooks } = useDiscoverSections();
  const [search, setSearch] = useState("");

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
        <Text style={styles.greeting}>
          Hello, {user?.name?.split(" ")[0] || "Reader"}
        </Text>
        <Text style={styles.pageTitle}>Discover Books</Text>
      </Animated.View>

      <Animated.View style={[styles.searchContainer, { opacity: searchFade }]}>
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
        <DiscoverSectionRow
          title="Book Series"
          subtitle="Continue where you left off"
          books={seriesBooks ?? []}
          seeAllKey="series"
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
    paddingHorizontal: 20,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  greeting: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontFamily: Fonts.regular,
  },
  pageTitle: {
    fontSize: responsiveFont(24),
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: Spacing.md,
  },
  scroll: {
    paddingTop: Spacing.xs,
    paddingBottom: 32,
  },
});
