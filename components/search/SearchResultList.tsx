import BookCard from "@/components/search/BookCard";
import BookLoader from "@/components/ui/feedback/BookLoader";
import { Shadows } from "@/constants/designTokens";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, scale, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { memo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

export type SearchBook = {
  _id: string;
  title: string;
  author: string;
  rating: number;
  coverUrl: string | null;
  rentPerDay: number;
  availableCopies: number;
  bookViews: number;
  bookRentals: number;
  top10Position?: number;
};

type SearchResultListProps = {
  books: SearchBook[];
  status: string;
  onEndReached: () => void;
  onBookPress: (bookId: string) => void;
  loadingFirstPage: boolean;
  hasActiveSearch: boolean;
};

/* ─── Skeleton Loader ──────────────────────────────────────────────────── */

function SearchResultSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      {Array.from({ length: 4 }).map((_, index) => (
        <View key={index} style={styles.skeletonCard}>
          <View style={styles.skeletonCover} />
          <View style={styles.skeletonContent}>
            <View style={[styles.skeletonLine, { width: "86%" }]} />
            <View style={[styles.skeletonLine, { width: "68%" }]} />
            <View
              style={[styles.skeletonLine, { width: "30%", marginTop: 10 }]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

/* ─── Empty State ──────────────────────────────────────────────────────── */

function SearchEmptyState({ hasActiveSearch }: { hasActiveSearch: boolean }) {
  return (
    <View style={styles.empty}>
      <Ionicons
        name={hasActiveSearch ? "search-outline" : "sparkles-outline"}
        size={scale(36)}
        color={Colors.primary}
        style={styles.emptyIcon}
      />

      <Text style={styles.emptyTitle} allowFontScaling={false}>
        {hasActiveSearch ? "No matches found" : "Start with a search or genre"}
      </Text>

      {/* Decorative divider */}
      <View style={styles.emptyDividerRow}>
        <View style={styles.emptyDividerLine} />
        <Text style={styles.emptyDividerDiamond}>✦</Text>
        <View style={styles.emptyDividerLine} />
      </View>

      <Text style={styles.emptySubtitle} allowFontScaling={false}>
        {hasActiveSearch
          ? "Try another title, author, or genre."
          : "Use the search bar or pick a genre to discover your next favourite book."}
      </Text>
    </View>
  );
}

/* ─── Main Component ───────────────────────────────────────────────────── */

function SearchResultList({
  books,
  status,
  onEndReached,
  onBookPress,
  loadingFirstPage,
  hasActiveSearch,
}: SearchResultListProps) {
  if (loadingFirstPage) {
    return <SearchResultSkeleton />;
  }

  return (
    <FlatList
      data={books}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <BookCard
          bookId={item._id}
          title={item.title}
          author={item.author}
          rating={item.rating}
          coverUrl={item.coverUrl}
          rentPerDay={item.rentPerDay}
          availableCopies={item.availableCopies}
          bookViews={item.bookViews}
          bookRentals={item.bookRentals}
          top10Position={item.top10Position}
          onPress={() => onBookPress(item._id)}
        />
      )}
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (status === "CanLoadMore") {
          onEndReached();
        }
      }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <SearchEmptyState hasActiveSearch={hasActiveSearch} />
      }
      ListFooterComponent={
        status === "LoadingMore" ? (
          <View style={styles.footerLoader}>
            <BookLoader label="Loading more..." />
          </View>
        ) : (
          <View style={styles.footerSpacer} />
        )
      }
    />
  );
}

export default memo(SearchResultList);

/* ─── Styles ───────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: Layout.screenPaddingWide,
    paddingTop: Spacing.sm,
    paddingBottom: scale(90),
    flexGrow: 1,
  },

  /* ── Empty State ───────────────────────────────────────────────────── */
  empty: {
    marginTop: scale(100),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Layout.screenPadding,
  },
  emptyIcon: {
    marginBottom: Spacing.md,
    alignSelf: "center",
  },
  emptyTitle: {
    color: Colors.text,
    fontFamily: Fonts.bold,
    fontSize: FontSizes.subtitle,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  emptyDividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.xs + 2,
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
  emptySubtitle: {
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
    fontSize: FontSizes.caption,
    textAlign: "center",
    lineHeight: FontSizes.caption * 1.5,
    paddingHorizontal: Spacing.md,
  },

  /* ── Footer ────────────────────────────────────────────────────────── */
  footerLoader: {
    paddingVertical: Spacing.md,
  },
  footerSpacer: {
    height: Spacing.xl,
  },

  /* ── Skeleton ───────────────────────────────────────────────────────── */
  skeletonWrap: {
    paddingHorizontal: Layout.screenPaddingWide,
    paddingTop: Spacing.sm,
  },
  skeletonCard: {
    flexDirection: "row",
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.subtle,
  },
  skeletonCover: {
    width: scale(56),
    height: scale(80),
    borderRadius: scale(10),
    backgroundColor: Colors.border,
  },
  skeletonContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  skeletonLine: {
    height: scale(12),
    borderRadius: scale(6),
    backgroundColor: Colors.border,
    marginBottom: Spacing.sm,
  },
});
