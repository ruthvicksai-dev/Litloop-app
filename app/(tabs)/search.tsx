import GenreChip from "@/components/search/GenreChip";
import SearchResultList from "@/components/search/SearchResultList";
import SearchInput from "@/components/shared/SearchInput";
import { Shadows } from "@/constants/designTokens";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, scale, Spacing } from "@/constants/theme";
import { useFadeSlideIn, useSearchScreen } from "@/hooks";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
    Animated,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SearchScreen() {
  const router = useRouter();
  const {
    searchText,
    setSearchText,
    selectedGenre,
    toggleGenre,
    showAllGenres,
    setShowAllGenres,
    popularGenres,
    allGenres,
    hasActiveSearch,
    searchResults,
    status,
    loadMore,
    loadingFirstPage,
  } = useSearchScreen();

  const { fadeAnim, slideAnim } = useFadeSlideIn();

  const visibleGenres = useMemo(() => {
    if (!selectedGenre) return [...popularGenres];
    if (popularGenres.includes(selectedGenre as any)) return [...popularGenres];
    return [selectedGenre, ...popularGenres];
  }, [popularGenres, selectedGenre]);

  return (
    <View style={styles.container}>
      {/* ─── Premium Search Header with Illustration Background ──── */}
      <View style={styles.headerWrap}>
        {/* Full-cover illustration background */}
        <Image
          source={require("@/assets/images/search illustration.png")}
          style={styles.headerBgIllustration}
          contentFit="cover"
          cachePolicy="memory-disk"
        />

        <SafeAreaView edges={["top"]}>
          <Animated.View
            style={[
              styles.headerContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.title} allowFontScaling={false}>
              Search
            </Text>
            <Text style={styles.subtitle} allowFontScaling={false}>
              Discover books by title, author or genre
            </Text>
          </Animated.View>
        </SafeAreaView>
      </View>

      {/* ─── Search Bar ──────────────────────────────────────────── */}
      <View style={styles.searchRow}>
        <SearchInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search books, authors, genres..."
          containerStyle={styles.searchInputWrap}
        />
      </View>

      {/* ─── Genre Chips ─────────────────────────────────────────── */}
      <View style={styles.chipsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContent}
        >
          {visibleGenres.map((genre) => (
            <GenreChip
              key={genre}
              label={genre}
              selected={selectedGenre === genre}
              onPress={() => toggleGenre(genre)}
            />
          ))}
          <GenreChip label="View All" onPress={() => setShowAllGenres(true)} />
        </ScrollView>
      </View>

      {/* ─── Search Results / Empty State ────────────────────────── */}
      <SearchResultList
        books={searchResults}
        status={status}
        loadingFirstPage={loadingFirstPage}
        hasActiveSearch={hasActiveSearch}
        onEndReached={() => loadMore(8)}
        onBookPress={(bookId) => router.push(`/book/${bookId}`)}
      />

      {/* ─── All Genres Modal ────────────────────────────────────── */}
      <Modal
        visible={showAllGenres}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAllGenres(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAllGenres(false)}
        >
          <Pressable style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>All Genres</Text>
              <TouchableOpacity
                onPress={() => setShowAllGenres(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {allGenres.map((genre) => (
                <View key={genre} style={styles.modalChipCell}>
                  <GenreChip
                    label={genre}
                    compact
                    selected={selectedGenre === genre}
                    onPress={() => {
                      toggleGenre(genre);
                      setShowAllGenres(false);
                    }}
                  />
                </View>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/* ─── Styles ───────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  /* ── Header ─────────────────────────────────────────────────────────── */
  headerWrap: {
    overflow: "hidden",
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.primary}08`,
    minHeight: scale(250),
  },
  headerBgIllustration: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContent: {
    paddingHorizontal: Layout.screenPaddingWide,
    paddingTop: Spacing.lg,
    paddingBottom: scale(52),
  },
  title: {
    color: Colors.text,
    fontFamily: Fonts.bold,
    fontSize: FontSizes.heading,
    letterSpacing: -0.4,
    marginBottom: Spacing.xs / 2,
  },
  subtitle: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
    letterSpacing: 0.1,
  },

  /* ── Search Bar ─────────────────────────────────────────────────────── */
  searchRow: {
    paddingHorizontal: Layout.screenPaddingWide,
    marginTop: -scale(100),
    gap: Spacing.sm,
  },
  searchInputWrap: {
    minHeight: scale(52),
  },

  /* ── Genre Chips ────────────────────────────────────────────────────── */
  chipsWrap: {
    marginTop: Spacing.md,
  },
  chipsContent: {
    paddingHorizontal: Layout.screenPaddingWide,
    paddingBottom: Spacing.xs,
  },

  /* ── Modal ───────────────────────────────────────────────────────────── */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(20,15,12,0.35)",
    justifyContent: "center",
    paddingHorizontal: scale(12),
  },
  modalCard: {
    borderRadius: Layout.cardRadiusLarge + 4,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.elevated,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm + 4,
    paddingHorizontal: scale(2),
  },
  modalTitle: {
    fontFamily: Fonts.bold,
    color: Colors.text,
    fontSize: FontSizes.title,
  },
  modalCloseBtn: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: `${Colors.primary}0A`,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: scale(8),
  },
  modalChipCell: {
    width: "31.8%",
  },
});
