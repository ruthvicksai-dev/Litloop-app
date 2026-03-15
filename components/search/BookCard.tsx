import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { useFavorites } from "@/hooks/useFavorites";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from "react-native-reanimated";

type SearchBookCardProps = {
    bookId: string;
    title: string;
    author: string;
    rating: number;
    coverUrl: string | null;
    rentPerDay: number;
    availableCopies: number;
    bookViews: number;
    bookRentals: number;
    onPress: () => void;
};

// Extracted badge component for availability
const AvailabilityBadge = ({ copies }: { copies: number }) => {
    let color = Colors.success;
    let text = "Available";

    if (copies === 0) {
        color = Colors.error;
        text = "Currently rented";
    } else if (copies <= 2) {
        color = Colors.warning;
        text = "Few left";
    }

    return (
        <View style={[styles.availabilityBadge, { borderColor: color, backgroundColor: `${color}15` }]}>
            <View style={[styles.availabilityDot, { backgroundColor: color }]} />
            <Text style={[styles.availabilityText, { color }]}>{text}</Text>
        </View>
    );
};

function BookCard({
    bookId,
    title,
    author,
    rating,
    coverUrl,
    rentPerDay,
    availableCopies,
    bookViews,
    bookRentals,
    onPress
}: SearchBookCardProps) {
    const scale = useSharedValue(1);

    // Global Favorites logic
    const { isFavorite, toggleFavorite } = useFavorites();
    const isWishlisted = isFavorite(bookId);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }]
        };
    });

    const handlePressIn = () => {
        scale.value = withSpring(0.97, { stiffness: 400, damping: 20 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { stiffness: 400, damping: 20 });
    };

    const handleToggleFavorite = () => {
        toggleFavorite(bookId);
    };

    return (
        <Animated.View style={[styles.cardWrapper, animatedStyle]}>
            <Pressable
                style={styles.card}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
            >
                <LinearGradient
                    colors={["#FFFFFF", `${Colors.primary}0D`, Colors.primaryLight]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.row}>
                    {/* Cover Section */}
                    {coverUrl ? (
                        <Image
                            source={coverUrl}
                            style={styles.cover}
                            contentFit="cover"
                            transition={180}
                            cachePolicy="memory-disk"
                        />
                    ) : (
                        <View style={[styles.cover, styles.coverPlaceholder]}>
                            <Ionicons name="book-outline" size={32} color={Colors.primary} />
                        </View>
                    )}

                    {/* Info Section */}
                    <View style={styles.info}>
                        <View style={styles.headerRow}>
                            <Text numberOfLines={1} style={styles.title}>
                                {title}
                            </Text>
                            {/* Wishlist toggle overlapping right corner */}
                            <Pressable
                                onPress={handleToggleFavorite}
                                style={styles.wishlistBtn}
                                hitSlop={10}
                            >
                                <Ionicons
                                    name={isWishlisted ? "heart" : "heart-outline"}
                                    size={22}
                                    color={isWishlisted ? "red" : Colors.textLight}
                                />
                            </Pressable>
                        </View>

                        <Text numberOfLines={1} style={styles.author}>
                            {author}
                        </Text>

                        {/* Price & Availability Row */}
                        <View style={styles.priceRow}>
                            <Text style={styles.priceText}>
                                ₹{rentPerDay} <Text style={styles.priceSubtext}>/ day</Text>
                            </Text>
                            <AvailabilityBadge copies={availableCopies} />
                        </View>

                        {/* Popularity Stats Row */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Ionicons name="star" size={14} color={Colors.warning} />
                                <Text style={styles.statText}>{rating > 0 ? rating.toFixed(1) : "New"}</Text>
                            </View>
                            {bookRentals > 0 && (
                                <View style={styles.statItem}>
                                    <View style={styles.dotSeparator} />
                                    <Ionicons name="flame" size={14} color={Colors.error} />
                                    <Text style={styles.statText}>{bookRentals} rented</Text>
                                </View>
                            )}
                            {bookViews > 0 && (
                                <View style={styles.statItem}>
                                    <View style={styles.dotSeparator} />
                                    <Ionicons name="eye" size={14} color={Colors.primary} />
                                    <Text style={styles.statText}>{bookViews}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
}

export default memo(BookCard);

const styles = StyleSheet.create({
    cardWrapper: {
        marginBottom: Spacing.sm,
        // Premium subtle floating shadow
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
        elevation: 4,
    },
    card: {
        padding: 12,
        borderRadius: 16,
        backgroundColor: Colors.white,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(117,64,67,0.10)",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    cover: {
        width: 74,
        height: 108,
        borderRadius: 12,
        backgroundColor: Colors.primaryLight,
    },
    coverPlaceholder: {
        alignItems: "center",
        justifyContent: "center",
    },
    info: {
        flex: 1,
        marginLeft: 12,
        justifyContent: "center",
        gap: 6,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    title: {
        flex: 1,
        color: Colors.text,
        fontFamily: Fonts.bold,
        fontSize: FontSizes.subtitle,
        lineHeight: 20,
        marginRight: 8,
    },
    wishlistBtn: {
        padding: 6,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.70)",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
    },
    author: {
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        fontSize: FontSizes.small,
    },
    priceRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
    },
    priceText: {
        color: Colors.primary,
        fontFamily: Fonts.bold,
        fontSize: FontSizes.subtitle,
    },
    priceSubtext: {
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        fontSize: FontSizes.small,
    },
    availabilityBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 12,
        borderWidth: 1,
        gap: 4,
    },
    availabilityDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    availabilityText: {
        fontFamily: Fonts.medium,
        fontSize: FontSizes.caption,
    },
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        marginTop: 2,
    },
    statItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    statText: {
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
        fontSize: FontSizes.caption,
        marginRight: 6,
    },
    dotSeparator: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: Colors.border,
        marginRight: 8,
    },
});
