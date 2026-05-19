import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing } from "@/constants/theme";
import { Doc } from "@/convex/_generated/dataModel";

interface AdminBookHeroProps {
    book: Doc<"books">;
    images: string[];
    genre: string;
}

export default function AdminBookHero({ book, images, genre }: AdminBookHeroProps) {
    return (
        <View style={styles.heroSection}>
            <View style={styles.heroLeftCol}>
                {images.length > 0 ? (
                    <Image source={{ uri: images[0] }} style={styles.heroCover} cachePolicy="disk" />
                ) : (
                    <View style={[styles.heroCover, styles.heroCoverPlaceholder]}>
                        <Ionicons name="book-outline" size={40} color={Colors.textLight} />
                    </View>
                )}
            </View>

            <View style={styles.heroInfo}>
                <Text style={styles.heroTitle} numberOfLines={2}>{book.title}</Text>
                <Text style={styles.heroAuthor} numberOfLines={1}>by {book.author}</Text>

                <View style={styles.heroBadgeRow}>
                    <View style={styles.genreBadge}>
                        <Text style={styles.genreBadgeText}>{genre}</Text>
                    </View>
                    <View style={[
                        styles.statusBadge,
                        { backgroundColor: book.availableCopies > 0 ? Colors.success + "18" : Colors.error + "18" },
                    ]}>
                        <View style={[
                            styles.statusDot,
                            { backgroundColor: book.availableCopies > 0 ? Colors.success : Colors.error },
                        ]} />
                        <Text style={[
                            styles.statusBadgeText,
                            { color: book.availableCopies > 0 ? Colors.success : Colors.error },
                        ]}>
                            {book.availableCopies > 0 ? "Available" : "Out of Stock"}
                        </Text>
                    </View>
                </View>

                <View style={styles.priceRow}>
                    <Ionicons name="pricetag-outline" size={16} color={Colors.primary} />
                    <Text style={styles.priceText}>₹{book.rentPerDay}/day</Text>
                </View>

                <View style={styles.heroMetaRow}>
                    <View style={styles.heroMetaItem}>
                        <Ionicons name="library-outline" size={14} color={Colors.textSecondary} />
                        <Text style={styles.heroMetaText}>{book.totalCopies} Copies</Text>
                    </View>
                    {(book.avgRating ?? book.rating ?? 0) > 0 && (
                        <View style={styles.heroMetaItem}>
                            <Ionicons name="star" size={14} color={Colors.warning} />
                            <Text style={styles.heroMetaText}>{(book.avgRating ?? book.rating ?? 0).toFixed(1)}</Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    heroSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.xs,
        gap: Spacing.md,
    },
    heroLeftCol: {
        width: '25%',
        alignItems: 'center',
        gap: 5,
    },
    heroCover: {
        width: '100%',
        aspectRatio: 2 / 3,
        borderRadius: Layout.cardRadius,
        backgroundColor: Colors.border,
    },
    heroCoverPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroInfo: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    heroTitle: {
        fontSize: FontSizes.titleLarge,
        color: Colors.text,
        fontFamily: Fonts.bold,
        lineHeight: 28,
        marginBottom: 4,
    },
    heroAuthor: {
        fontSize: FontSizes.small,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
        marginBottom: Spacing.sm,
    },
    heroBadgeRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.xs,
        marginBottom: Spacing.sm,
    },
    genreBadge: {
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    genreBadgeText: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.medium,
        color: Colors.primary,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
    },
    statusBadgeText: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.medium,
    },
    priceRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: Spacing.lg,
    },
    priceText: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
    heroMetaRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    heroMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    heroMetaText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
    },
});
