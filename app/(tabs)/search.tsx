import GenreChip from "@/components/search/GenreChip";
import SearchResultList from "@/components/search/SearchResultList";
import SearchInput from "@/components/shared/SearchInput";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing } from "@/constants/theme";
import { useSearchScreen } from "@/hooks";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
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

    const visibleGenres = useMemo(() => {
        if (!selectedGenre) return [...popularGenres];
        if (popularGenres.includes(selectedGenre as any)) return [...popularGenres];
        return [selectedGenre, ...popularGenres];
    }, [popularGenres, selectedGenre]);

    return (
        <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
            <View style={styles.header}>
                <Text style={styles.title}>Search</Text>
                <Text style={styles.subtitle}>Discover books by title, author, or genre</Text>
            </View>

            <View style={styles.searchRow}>
                <SearchInput
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholder="Search books, authors, genres..."
                    containerStyle={styles.searchInputWrap}
                />
            </View>

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

            <SearchResultList
                books={searchResults}
                status={status}
                loadingFirstPage={loadingFirstPage}
                hasActiveSearch={hasActiveSearch}
                onEndReached={() => loadMore(8)}
                onBookPress={(bookId) => router.push(`/book/${bookId}`)}
            />

            <Modal visible={showAllGenres} transparent animationType="fade" onRequestClose={() => setShowAllGenres(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setShowAllGenres(false)}>
                    <Pressable style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>All Genres</Text>
                            <TouchableOpacity onPress={() => setShowAllGenres(false)}>
                                <Ionicons name="close" size={20} color={Colors.text} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalBody}>
                            {allGenres.map((genre) => (
                                <GenreChip
                                    key={genre}
                                    label={genre}
                                    selected={selectedGenre === genre}
                                    onPress={() => {
                                        toggleGenre(genre);
                                        setShowAllGenres(false);
                                    }}
                                />
                            ))}
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        paddingHorizontal: Layout.screenPaddingWide,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md,
    },
    title: {
        color: Colors.text,
        fontFamily: Fonts.bold,
        fontSize: FontSizes.heading,
        letterSpacing: -0.3,
    },
    subtitle: {
        marginTop: Spacing.xs,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        fontSize: FontSizes.body,
    },
    searchRow: {
        paddingHorizontal: Layout.screenPaddingWide,
        gap: Spacing.sm,
    },
    searchInputWrap: {
        minHeight: 48,
    },
    chipsWrap: {
        marginTop: Spacing.sm,
    },
    chipsContent: {
        paddingHorizontal: Layout.screenPaddingWide,
        paddingBottom: Spacing.xs,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(20,15,12,0.35)",
        justifyContent: "center",
        paddingHorizontal: Layout.screenPaddingWide,
    },
    modalCard: {
        borderRadius: 22,
        padding: Spacing.md,
        backgroundColor: Colors.surfaceCard,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: Spacing.md,
    },
    modalTitle: {
        fontFamily: Fonts.bold,
        color: Colors.text,
        fontSize: FontSizes.title,
    },
    modalBody: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.sm,
    },
});
