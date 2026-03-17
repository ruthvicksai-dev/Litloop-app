import BookCard from "@/components/search/BookCard";
import BookLoader from "@/components/ui/BookLoader";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing, scale } from "@/constants/theme";
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

function SearchResultSkeleton() {
    return (
        <View style={styles.skeletonWrap}>
            {Array.from({ length: 4 }).map((_, index) => (
                <View key={index} style={styles.skeletonCard}>
                    <View style={styles.skeletonCover} />
                    <View style={styles.skeletonContent}>
                        <View style={[styles.skeletonLine, { width: "86%" }]} />
                        <View style={[styles.skeletonLine, { width: "68%" }]} />
                        <View style={[styles.skeletonLine, { width: "30%", marginTop: 10 }]} />
                    </View>
                </View>
            ))}
        </View>
    );
}

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
                <View style={styles.empty}>
                    <Ionicons
                        name={hasActiveSearch ? "search-outline" : "sparkles-outline"}
                        size={48}
                        color={Colors.textLight}
                    />
                    <Text style={styles.emptyTitle}>
                        {hasActiveSearch ? "No matches found" : "Start with a search or genre"}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        {hasActiveSearch
                            ? "Try another title, author, or genre."
                            : "Use the search bar or pick a genre to discover books."}
                    </Text>
                </View>
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

const styles = StyleSheet.create({
    list: {
        paddingHorizontal: Layout.screenPaddingWide,
        paddingTop: Spacing.sm,
        paddingBottom: scale(90),
        flexGrow: 1,
    },
    empty: {
        marginTop: scale(72),
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: Layout.screenPadding,
    },
    emptyTitle: {
        marginTop: Spacing.sm,
        color: Colors.text,
        fontFamily: Fonts.bold,
        fontSize: FontSizes.subtitle,
    },
    emptySubtitle: {
        marginTop: Spacing.xs,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        fontSize: FontSizes.body,
        textAlign: "center",
    },
    footerLoader: {
        paddingVertical: Spacing.md,
    },
    footerSpacer: {
        height: Spacing.xl,
    },
    skeletonWrap: {
        paddingHorizontal: Layout.screenPaddingWide,
        paddingTop: Spacing.sm,
    },
    skeletonCard: {
        flexDirection: "row",
        borderRadius: scale(14),
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.white,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
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
