import BookCard from "@/components/search/BookCard";
import BookLoader from "@/components/ui/BookLoader";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SECTION_CONFIG: Record<string, { title: string; subtitle: string }> = {
    topPicks: {
        title: "Top Picks For You",
        subtitle: "Highly rated books curated for readers",
    },
    top10: {
        title: "Top 10 in India",
        subtitle: "The most popular books right now",
    },
    trending: {
        title: "Trending Books",
        subtitle: "What everyone's reading this week",
    },
    famous: {
        title: "Famous Books",
        subtitle: "Timeless classics and celebrated titles",
    },
    newlyAdded: {
        title: "Newly Added",
        subtitle: "Fresh arrivals in our library",
    },
    series: {
        title: "Book Series",
        subtitle: "Continue where you left off",
    },
};

export default function SectionBooksScreen() {
    const router = useRouter();
    const { section, title } = useLocalSearchParams<{
        section: string;
        title?: string;
    }>();

    const topPicks = useQuery(
        api.books.getTopPicks,
        section === "topPicks" ? {} : "skip"
    );
    const top10Books = useQuery(
        api.books.getTop10Books,
        section === "top10" ? {} : "skip"
    );
    const trendingBooks = useQuery(
        api.books.getTrendingBooks,
        section === "trending" ? {} : "skip"
    );
    const famousBooks = useQuery(
        api.books.getFamousBooks,
        section === "famous" ? {} : "skip"
    );
    const seriesBooks = useQuery(
        api.books.getSeriesBooks,
        section === "series" ? {} : "skip"
    );
    const newlyAddedBooks = useQuery(
        api.books.getNewlyAddedBooks,
        section === "newlyAdded" ? {} : "skip"
    );

    const books =
        topPicks ?? top10Books ?? trendingBooks ?? famousBooks ?? seriesBooks ?? newlyAddedBooks;

    const config = SECTION_CONFIG[section ?? ""] ?? {
        title: title ?? "Books",
        subtitle: "",
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={styles.screenTitle}>{config.title}</Text>
                    {config.subtitle ? (
                        <Text style={styles.screenSubtitle}>{config.subtitle}</Text>
                    ) : null}
                </View>
            </View>

            {books === undefined ? (
                <View style={styles.center}>
                    <BookLoader label="Loading books..." />
                </View>
            ) : books.length === 0 ? (
                <View style={styles.empty}>
                    <Ionicons
                        name="book-outline"
                        size={60}
                        color={Colors.textLight}
                        style={{ marginBottom: Spacing.md }}
                    />
                    <Text style={styles.emptyText}>No books in this section yet</Text>
                </View>
            ) : (
                <FlatList
                    data={books}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <BookCard
                            bookId={item._id}
                            title={item.title}
                            author={item.author}
                            rating={item.rating ?? 0}
                            coverUrl={item.coverUrl}
                            rentPerDay={item.rentPerDay}
                            availableCopies={item.availableCopies}
                            bookViews={item.bookViews ?? 0}
                            bookRentals={item.bookRentals ?? 0}
                            top10Position={item.top10Position}
                            onPress={() =>
                                router.push(`/book/${item._id}` as any)
                            }
                        />
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md,
        gap: Spacing.sm,
    },
    backBtn: {
        padding: 4,
    },
    headerText: {
        flex: 1,
    },
    screenTitle: {
        fontSize: FontSizes.titleLarge,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    screenSubtitle: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    empty: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    emptyText: {
        fontSize: FontSizes.subtitle,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        textAlign: "center",
    },
    list: {
        paddingHorizontal: 16,
        paddingBottom: 32,
        paddingTop: Spacing.sm,
    },
});
