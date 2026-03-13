import SearchInput from "@/components/shared/SearchInput";
import { Colors, Spacing } from "@/constants/theme";
import { useAdminBooksScreen } from "@/hooks/useAdminBooksScreen";
import { useFadeSlideIn } from "@/hooks/useFadeSlideIn";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function AdminBooksScreen() {
    const router = useRouter();
    const { books, search, setSearch, filteredBooks } = useAdminBooksScreen();
    const { fadeAnim, slideAnim } = useFadeSlideIn({ slideFrom: 20, duration: 400 });

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
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                ]}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>Manage Books</Text>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => router.push("/(admin)/add-book")}
                >
                    <Ionicons name="add" size={20} color={Colors.white} />
                    <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.searchBox, { opacity: fadeAnim }]}>
                <SearchInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search by title or author..."
                    icon="ðŸ”"
                    containerStyle={styles.searchInputContainer}
                    inputStyle={styles.searchInput}
                />
            </Animated.View>

            <FlatList
                data={filteredBooks}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                renderItem={({ item, index }) => (
                    <Animated.View
                        style={{
                            opacity: fadeAnim,
                            transform: [
                                {
                                    translateY: fadeAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [20 + index * 5, 0],
                                    }),
                                },
                            ],
                        }}
                    >
                        <TouchableOpacity
                            style={styles.card}
                            onPress={() => router.push(`/(admin)/edit-book?bookId=${item._id}`)}
                            activeOpacity={0.8}
                        >
                            {item.coverUrl ? (
                                <Image source={{ uri: item.coverUrl }} style={styles.cover} />
                            ) : (
                                <View style={[styles.cover, styles.coverPlaceholder]}>
                                    <Ionicons name="book-outline" size={SCREEN_WIDTH * 0.08} color={Colors.primary} />
                                </View>
                            )}
                            <View style={styles.info}>
                                <Text style={styles.bookTitle} numberOfLines={1}>
                                    {item.title}
                                </Text>
                                <Text style={styles.bookAuthor} numberOfLines={1}>
                                    {item.author}
                                </Text>
                               <View style={styles.statsRow}>
  <Text style={styles.statText}>₹{item.rentPerDay}/day</Text>
  <Text style={styles.statText}>{item.availableCopies} available</Text>
  <Text style={styles.statText}>{item.totalCopies} total</Text>
</View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
                        </TouchableOpacity>
                    </Animated.View>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="book-outline" size={SCREEN_WIDTH * 0.15} color={Colors.textLight} style={{ marginBottom: Spacing.md }} />
                        <Text style={styles.emptyText}>No books found</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.background,
    },
   statText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "600",
    marginRight: 8
},
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: SCREEN_WIDTH * 0.06,
        paddingVertical: Spacing.md,
    },
    backBtn: {
        padding: 4,
        marginLeft: -4,
    },
    back: { fontSize: 16, color: Colors.primary, fontWeight: "600" },
    title: {
        fontSize: SCREEN_WIDTH * 0.055,
        fontWeight: "800",
        color: Colors.text,
    },
    addBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    addBtnText: { color: Colors.white, fontWeight: "700", fontSize: 13 },
    searchBox: {
        marginHorizontal: SCREEN_WIDTH * 0.06,
        marginBottom: Spacing.sm,
    },
    searchInputContainer: {
        borderWidth: 1.5,
        height: 44,
    },
    searchInput: {
        paddingVertical: 0,
        fontSize: 14,
    },
    list: {
        paddingHorizontal: SCREEN_WIDTH * 0.06,
        paddingBottom: 20,
        gap: 10,
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 14,
        padding: Spacing.md,
        flexDirection: "row",
        alignItems: "center",
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
        gap: 12,
    },
    cover: {
        width: SCREEN_WIDTH * 0.14,
        height: SCREEN_WIDTH * 0.14 * 1.4,
        borderRadius: 8,
    },
    coverPlaceholder: {
        backgroundColor: Colors.primaryLight,
        justifyContent: "center",
        alignItems: "center",
    },
    coverEmoji: { fontSize: SCREEN_WIDTH * 0.06 },
    info: { flex: 1 },
    bookTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: Colors.text,
        marginBottom: 2,
    },
    bookAuthor: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
    },
   statsRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
},
stat: {
    flex: 1,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
},
    statValue: { fontSize: 13, fontWeight: "700", color: Colors.primary },
    statLabel: { fontSize: 10, color: Colors.textSecondary },
    chevron: {
        fontSize: 22,
        color: Colors.textLight,
        fontWeight: "600",
    },
    empty: {
        alignItems: "center",
        paddingTop: SCREEN_HEIGHT * 0.12,
    },
    emptyIcon: { fontSize: SCREEN_WIDTH * 0.12, marginBottom: Spacing.md },
    emptyText: { fontSize: 16, color: Colors.textSecondary },
});
