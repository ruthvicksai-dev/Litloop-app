import SearchInput from "@/components/shared/SearchInput";
import { Colors, Spacing } from "@/constants/theme";
import { useAdminBooksScreen } from "@/hooks/useAdminBooksScreen";
import { useFadeSlideIn } from "@/hooks/useFadeSlideIn";
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
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.back}>â† Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Manage Books</Text>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => router.push("/(admin)/add-book")}
                >
                    <Text style={styles.addBtnText}>+ Add</Text>
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
                                    <Text style={styles.coverEmoji}>ðŸ“–</Text>
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
                                    <View style={styles.stat}>
                                        <Text style={styles.statValue}>â‚¹{item.rentPerDay}</Text>
                                        <Text style={styles.statLabel}>/day</Text>
                                    </View>
                                    <View style={styles.stat}>
                                        <Text style={styles.statValue}>{item.availableCopies}</Text>
                                        <Text style={styles.statLabel}>avail</Text>
                                    </View>
                                    <View style={styles.stat}>
                                        <Text style={styles.statValue}>{item.totalCopies}</Text>
                                        <Text style={styles.statLabel}>total</Text>
                                    </View>
                                </View>
                            </View>
                            <Text style={styles.chevron}>â€º</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyIcon}>ðŸ“š</Text>
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
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: SCREEN_WIDTH * 0.06,
        paddingVertical: Spacing.md,
    },
    back: { fontSize: 16, color: Colors.primary, fontWeight: "600" },
    title: {
        fontSize: SCREEN_WIDTH * 0.055,
        fontWeight: "800",
        color: Colors.text,
    },
    addBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
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
    statsRow: { flexDirection: "row", gap: 12 },
    stat: { flexDirection: "row", alignItems: "baseline", gap: 2 },
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
