import BookCard from "@/components/ui/BookCard";
import SearchInput from "@/components/shared/SearchInput";
import { Colors, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useHomeEntrance } from "@/hooks/useHomeEntrance";
import { useHomeScreen } from "@/hooks/useHomeScreen";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { books, search, setSearch, filteredBooks } = useHomeScreen();
  const { fadeAnim, slideAnim, searchFade } = useHomeEntrance();

  if (books === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
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
          Hello, {user?.name?.split(" ")[0] || "Reader"} ðŸ‘‹
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
        data={filteredBooks}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 30],
                    outputRange: [0, 30 + index * 8],
                  }),
                },
              ],
            }}
          >
            <BookCard
              title={item.title}
              author={item.author}
              rentPerDay={item.rentPerDay}
              availableCopies={item.availableCopies}
              coverUrl={item.coverUrl}
              coverUrls={item.coverUrls}
              onViewDetails={() => router.push(`/book/${item._id}`)}
              onRequestBook={() =>
                router.push(`/rental/request?bookId=${item._id}`)
              }
            />
          </Animated.View>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>ðŸ“–</Text>
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
    paddingHorizontal: SCREEN_WIDTH * 0.06,
    paddingTop: SCREEN_HEIGHT * 0.02,
    paddingBottom: Spacing.sm,
  },
  greeting: {
    fontSize: SCREEN_WIDTH * 0.035,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  title: {
    fontSize: SCREEN_WIDTH * 0.065,
    fontWeight: "800",
    color: Colors.text,
  },
  searchContainer: {
    paddingHorizontal: SCREEN_WIDTH * 0.06,
    paddingBottom: Spacing.md,
  },
  list: {
    paddingHorizontal: SCREEN_WIDTH * 0.06,
    paddingBottom: 20,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: SCREEN_HEIGHT * 0.1,
  },
  emptyIcon: {
    fontSize: SCREEN_WIDTH * 0.12,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
