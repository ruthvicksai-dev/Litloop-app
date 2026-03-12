import BookCard from "@/components/ui/BookCard";
import { Colors, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function HomeScreen() {
  const books = useQuery(api.books.list);
  const { user } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const searchFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(searchFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const filteredBooks = useMemo(() => {
    if (!books) return [];
    if (!search.trim()) return books;
    const query = search.toLowerCase();
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(query) ||
        b.author.toLowerCase().includes(query)
    );
  }, [books, search]);

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
          Hello, {user?.name?.split(" ")[0] || "Reader"} 👋
        </Text>
        <Text style={styles.title}>Discover Books</Text>
      </Animated.View>

      <Animated.View
        style={[styles.searchContainer, { opacity: searchFade }]}
      >
        <TextInput
          style={styles.searchInput}
          placeholder="Search books or authors..."
          placeholderTextColor={Colors.textLight}
          value={search}
          onChangeText={setSearch}
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
            <Text style={styles.emptyIcon}>📖</Text>
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
  searchInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: SCREEN_HEIGHT * 0.015,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
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
