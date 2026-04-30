import SearchInput from "@/components/shared/SearchInput";
import BookCard from "@/components/ui/cards/BookCard";
import ConfirmActionModal from "@/components/ui/feedback/ConfirmActionModal";
import BookLoader from "@/components/ui/feedback/BookLoader";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { useAdminBooksScreen, useFadeSlideIn } from "@/hooks";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import {
    Alert,
    Animated,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "@/convex/_generated/api";

export default function AdminBooksScreen() {
    const router = useRouter();
    const { accessToken } = useAuth();
    const removeBook = useMutation(api.books.remove);
    const [refreshing, setRefreshing] = React.useState(false);
    const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; title: string } | null>(null);
    const [deleting, setDeleting] = React.useState(false);
    const { books, search, setSearch, genreSections } = useAdminBooksScreen();
    const { fadeAnim, slideAnim } = useFadeSlideIn({ slideFrom: 20, duration: 400 });

    const handleDeleteBook = (bookId: string, bookTitle: string) => {
        setDeleteTarget({ id: bookId, title: bookTitle });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            setDeleting(true);
            if (!accessToken) throw new Error("Unauthenticated");
            await removeBook({ accessToken, bookId: deleteTarget.id as any });
            setDeleteTarget(null);
        } catch (error: any) {
            Alert.alert("Error", error.message ?? "Failed to delete book.");
        } finally {
            setDeleting(false);
        }
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

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
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                ]}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={Colors.primary} />
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
                    icon="search"
                    containerStyle={styles.searchInputContainer}
                    inputStyle={styles.searchInput}
                />
            </Animated.View>

            <FlatList
                data={genreSections}
                keyExtractor={(item) => item.genre}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[Colors.primary]}
                    />
                }
                renderItem={({ item, index }) => (
                    <Animated.View
                        style={[
                            styles.section,
                            {
                                opacity: fadeAnim,
                                transform: [
                                    {
                                        translateY: fadeAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [20 + index * 5, 0],
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
                                    viewDetailsLabel="Manage"
                                    requestLabel="Delete"
                                    showRequestButton={true}
                                    isRequestDestructive={true}
                                    onViewDetails={() =>
                                        router.push(`/(admin)/edit-book?bookId=${book._id}`)
                                    }
                                    onRequestBook={() =>
                                        handleDeleteBook(book._id, book.title)
                                    }
                                />
                            )}
                        />
                    </Animated.View>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons
                            name="book-outline"
                            size={60}
                            color={Colors.textLight}
                            style={{ marginBottom: Spacing.md }}
                        />
                        <Text style={styles.emptyText}>No books found</Text>
                    </View>
                }
            />

            <ConfirmActionModal
                visible={deleteTarget !== null}
                title="Delete Book"
                message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                icon="trash-outline"
                tone="danger"
                loading={deleting}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
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
        paddingHorizontal: 20,
        paddingVertical: Spacing.md,
        gap: 12,
    },
    backBtn: {
        padding: 4,
        marginLeft: -4,
    },
    back: { fontSize: FontSizes.subtitle, color: Colors.primary, fontFamily: Fonts.medium },
    title: {
        flex: 1,
        fontSize: FontSizes.title,
        color: Colors.text,
        textAlign: 'center',
        fontFamily: Fonts.bold,
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
    addBtnText: { color: Colors.white, fontFamily: Fonts.bold, fontSize: FontSizes.small },
    searchBox: {
        marginHorizontal: 25,
        marginBottom: Spacing.lg,
    },
    searchInputContainer: {
        borderWidth: 1.5,
        height: 44,
    },
    searchInput: {
        paddingVertical: 0,
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
    },
    list: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    section: {
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        paddingHorizontal: 25,
        marginBottom: Spacing.sm,
        fontSize: FontSizes.titleLarge,
        color: Colors.text,
        fontFamily: Fonts.bold,
    },
    genreRow: {
        paddingLeft: 20,
        paddingRight: 10,
        paddingBottom: 8,
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
        alignItems: "center",
        paddingHorizontal: 24,
        paddingVertical: 72,
    },
    emptyIcon: { fontSize: FontSizes.display, marginBottom: Spacing.md },
    emptyText: {
        fontSize: FontSizes.subtitle,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
    },
});
