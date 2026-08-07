import React from "react";
import { StyleSheet, Text, View, Platform, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing, scale } from "@/constants/theme";
import { Doc } from "@/convex/_generated/dataModel";

interface AdminBookHeroProps {
    book: Doc<"books">;
    images: string[];
    genre: string;
    onBack?: () => void;
}

export default function AdminBookHero({ book, images, genre, onBack }: AdminBookHeroProps) {
    const coverUri = images.length > 0 ? images[0] : null;
    const rating = book.avgRating ?? book.rating ?? 0;
    const isAvailable = book.availableCopies > 0;

    return (
        <View style={styles.heroWrapper}>
            {/* Blurred background cover image */}
            {coverUri && (
                <Image
                    source={{ uri: coverUri }}
                    style={styles.bgCover}
                    blurRadius={Platform.OS === "ios" ? 25 : 15}
                    cachePolicy="disk"
                />
            )}
            {/* Dark overlay gradient */}
            <LinearGradient
                colors={["rgba(90,47,50,0.85)", "rgba(90,47,50,0.95)", Colors.background]}
                locations={[0, 0.7, 1]}
                style={styles.bgOverlay}
            />

            {/* Content */}
            <SafeAreaView edges={["top"]}>
            {onBack && (
                <TouchableOpacity
                    style={styles.backBtn}
                    activeOpacity={0.8}
                    onPress={onBack}
                >
                    <Ionicons name="chevron-back" size={22} color={Colors.white} />
                </TouchableOpacity>
            )}
            <View style={styles.heroContent}>
                {/* Cover + Shadow */}
                <View style={styles.coverContainer}>
                    {coverUri ? (
                        <Image source={{ uri: coverUri }} style={styles.heroCover} cachePolicy="disk" />
                    ) : (
                        <View style={[styles.heroCover, styles.heroCoverPlaceholder]}>
                            <Ionicons name="book-outline" size={44} color="rgba(255,255,255,0.4)" />
                        </View>
                    )}
                </View>

                {/* Book Info */}
                <View style={styles.infoContainer}>
                    <Text style={styles.heroTitle} numberOfLines={2}>{book.title}</Text>
                    <Text style={styles.heroAuthor} numberOfLines={1}>by {book.author}</Text>

                    {/* Badges Row */}
                    <View style={styles.badgeRow}>
                        <View style={styles.genreBadge}>
                            <Text style={styles.genreBadgeText}>{genre}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: isAvailable ? "rgba(76,175,80,0.2)" : "rgba(244,67,54,0.2)" }]}>
                            <View style={[styles.statusDot, { backgroundColor: isAvailable ? Colors.success : Colors.error }]} />
                            <Text style={[styles.statusBadgeText, { color: isAvailable ? Colors.success : Colors.error }]}>
                                {isAvailable ? "Available" : "Out of Stock"}
                            </Text>
                        </View>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statChip}>
                            <Ionicons name="pricetag" size={13} color={Colors.white} />
                            <Text style={styles.statChipText}>₹{book.rentPerDay}/day</Text>
                        </View>
                        <View style={styles.statChip}>
                            <Ionicons name="library" size={13} color={Colors.white} />
                            <Text style={styles.statChipText}>{book.totalCopies} Copies</Text>
                        </View>
                        {rating > 0 && (
                            <View style={styles.statChip}>
                                <Ionicons name="star" size={13} color="#FFD700" />
                                <Text style={styles.statChipText}>{rating.toFixed(1)}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    heroWrapper: {
        overflow: "hidden",
        borderBottomLeftRadius: scale(28),
        borderBottomRightRadius: scale(28),
        zIndex: 10,
        elevation: 4,
        backgroundColor: Colors.primaryDark,
    },
    backBtn: {
        marginLeft: 16,
        marginTop: 4,
        padding: 4,
        alignSelf: "flex-start",
    },
    bgCover: {
        ...StyleSheet.absoluteFillObject,
        width: "100%",
        height: "100%",
    },
    bgOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    heroContent: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingHorizontal: 20,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.lg + 4,
        gap: 16,
    },
    coverContainer: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 10,
    },
    heroCover: {
        width: scale(100),
        aspectRatio: 2 / 3,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.1)",
    },
    heroCoverPlaceholder: {
        justifyContent: "center",
        alignItems: "center",
    },
    infoContainer: {
        flex: 1,
        paddingTop: 2,
    },
    heroTitle: {
        fontSize: FontSizes.title,
        color: Colors.white,
        fontFamily: Fonts.bold,
        lineHeight: 26,
        marginBottom: 3,
    },
    heroAuthor: {
        fontSize: FontSizes.caption,
        color: "rgba(255,255,255,0.7)",
        fontFamily: Fonts.medium,
        marginBottom: 10,
    },
    badgeRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginBottom: 10,
    },
    genreBadge: {
        backgroundColor: "rgba(255,255,255,0.15)",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    genreBadgeText: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.bold,
        color: Colors.white,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 5,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusBadgeText: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.bold,
    },
    statsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
    },
    statChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "rgba(255,255,255,0.12)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statChipText: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.bold,
        color: Colors.white,
    },
});
