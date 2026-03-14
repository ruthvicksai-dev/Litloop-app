import SearchInput from "@/components/shared/SearchInput";
import BookCard from "@/components/ui/BookCard";
import BookLoader from "@/components/ui/BookLoader";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useHomeEntrance } from "@/hooks/useHomeEntrance";
import { useHomeScreen } from "@/hooks/useHomeScreen";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Animated,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { responsiveFont } from "@/utils/responsiveFont";

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { books, search, setSearch, genreSections } = useHomeScreen();
  const { fadeAnim, slideAnim, searchFade } = useHomeEntrance();

  if (books === undefined) {
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
        <Text style={styles.title}>Discover Books</Text>
      </Animated.View>

      <Animated.View style={[styles.searchContainer, { opacity: searchFade }]}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search books or authors..."
        />
      </Animated.View>

      <FlatList
        data={genreSections}
        keyExtractor={(item) => item.genre}
        renderItem={({ item, index }) => (
          <Animated.View
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 30],
                      outputRange: [0, 30 + index * 8],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>{item.genre}</Text>
            <FlatList
              data={item.books}
              horizontal
              keyExtractor={(book) => book._id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.genreRow}
              renderItem={({ item: book }) => (
                <BookCard
                  title={book.title}
                  author={book.author}
                  rentPerDay={book.rentPerDay}
                  availableCopies={book.availableCopies}
                  coverUrl={book.coverUrl}
                  coverUrls={book.coverUrls}
                  style={styles.genreCard}
                  onViewDetails={() => router.push(`/book/${book._id}`)}
                  onRequestBook={() =>
                    router.push(`/rental/request?bookId=${book._id}`)
                  }
                />
              )}
            />
          </Animated.View>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={60} color={Colors.textLight} style={{ marginBottom: Spacing.md }} />
            <Text style={styles.emptyText}>No books available yet</Text>
          </View>
        }
      />
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
  title: {
    fontSize: responsiveFont(24),
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: Spacing.md,
  },
  list: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    marginBottom: Spacing.sm,
    fontSize: FontSizes.titleLarge,
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  genreRow: {
    paddingLeft: 20,
    paddingRight: 10,
    paddingBottom: 20,
    alignItems: "stretch",
  },
  genreCard: {
    width: 320,
    maxWidth: 360,
    marginRight: Spacing.md,
    marginBottom: 0,
    alignSelf: "stretch",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 56,
  },
  emptyIcon: {
    fontSize: FontSizes.display,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.subtitle,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
  },
});
