import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { memo } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import DiscoverBookCard from "./DiscoverBookCard";
import Top10BookCard from "./Top10BookCard";

export interface DiscoverBook {
    _id: string;
    title: string;
    author: string;
    rentPerDay: number;
    availableCopies: number;
    coverUrl: string | null;
    coverUrls?: string[];
    genre?: string;
    genres?: string[];
    bookViews?: number;
    top10Position?: number;
}

interface DiscoverSectionRowProps {
    title: string;
    subtitle?: string;
    books: DiscoverBook[];
    seeAllKey?: string;
    isTop10?: boolean;
}

function DiscoverSectionRow({
    title,
    subtitle,
    books,
    seeAllKey,
    isTop10 = false,
}: DiscoverSectionRowProps) {
    const router = useRouter();

    if (!books || books.length === 0) return null;

    return (
        <View style={styles.container}>
            {/* Section header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.titleText}>{title}</Text>
                    {subtitle ? (
                        <Text style={styles.subtitle}>{subtitle}</Text>
                    ) : null}
                </View>
                {seeAllKey ? (
                    <TouchableOpacity
                        style={styles.seeAll}
                        onPress={() =>
                            router.push(
                                (`/section-books?section=${encodeURIComponent(seeAllKey)}&title=${encodeURIComponent(title)}`) as any
                            )
                        }
                    >
                        <Text style={styles.seeAllText}>See All</Text>
                        <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* Horizontal scroll list */}
            <FlatList
                data={books}
                horizontal
                keyExtractor={(item) => item._id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.list}
                renderItem={({ item, index }) => {
                    const genre = item.genre ?? item.genres?.[0];
                    if (isTop10) {
                        return (
                            <Top10BookCard
                                _id={item._id}
                                title={item.title}
                                author={item.author}
                                rentPerDay={item.rentPerDay}
                                availableCopies={item.availableCopies}
                                coverUrl={item.coverUrl}
                                coverUrls={item.coverUrls}
                                genre={genre}
                                bookViews={item.bookViews}
                                rank={item.top10Position ?? index + 1}
                            />
                        );
                    }
                    return (
                        <DiscoverBookCard
                            _id={item._id}
                            title={item.title}
                            author={item.author}
                            rentPerDay={item.rentPerDay}
                            availableCopies={item.availableCopies}
                            coverUrl={item.coverUrl}
                            coverUrls={item.coverUrls}
                            genre={genre}
                            bookViews={item.bookViews}
                        />
                    );
                }}
            />
        </View>
    );
}

export default memo(DiscoverSectionRow);

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.lg,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        marginBottom: Spacing.sm,
    },
    headerLeft: {
        flex: 1,
        marginRight: Spacing.sm,
    },
    titleText: {
        fontSize: 22,
        color: Colors.primaryDark,
        fontFamily: Fonts.bold,
        letterSpacing: -0.4,
    },
    subtitle: {
        fontSize: FontSizes.caption,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
        marginTop: 2,
    },
    seeAll: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
    },
    seeAllText: {
        fontSize: FontSizes.small,
        color: Colors.primary,
        fontFamily: Fonts.medium,
    },
    list: {
        paddingLeft: 20,
        paddingRight: 10,
        paddingBottom: 8,
        alignItems: "flex-start",
    },
});
