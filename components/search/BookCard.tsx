import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, scale, Spacing } from "@/constants/theme";
import { useFavorites, useReadLater } from "@/hooks";
import { triggerHaptic } from "@/utils";
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
    top10Position?: number;
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
    onPress,
    top10Position
}: SearchBookCardProps) {
    const scale = useSharedValue(1);

    // Global Favorites logic
    const { isFavorite, toggleFavorite } = useFavorites();
    const isWishlisted = isFavorite(bookId);

    // Global Read Later logic
    const { isReadLater, toggleReadLater } = useReadLater();
    const isMarkedReadLater = isReadLater(bookId);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }]
        };
    });

    const handlePressIn = () => {
        triggerHaptic("light");
        scale.value = withSpring(0.97, { stiffness: 400, damping: 20 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { stiffness: 400, damping: 20 });
    };

    const handleToggleFavorite = () => {
        triggerHaptic("medium");
        toggleFavorite(bookId);
    };

    const handleToggleReadLater = () => {
        triggerHaptic("light");
        toggleReadLater(bookId);
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

                    {/* Top 10 Tag Overlay */}
                    {top10Position && (
                        <LinearGradient
                            colors={
                                top10Position === 1 ? ["#FFD700", "#FFA500"] :
                                    top10Position === 2 ? ["#E5E4E2", "#B4B4B4"] :
                                        top10Position === 3 ? ["#CD7F32", "#A0522D"] :
                                            [Colors.primary, "#8B4513"]
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.top10Badge}
                        >
                            <Text style={styles.top10Text}>#{top10Position}</Text>
                        </LinearGradient>
                    )}

                    {/* Info Section */}
                    <View style={styles.info}>
                        <View style={styles.headerRow}>
                            <Text numberOfLines={1} style={styles.title}>
                                {title}
                            </Text>
                            <View style={styles.actionsRow}>
                                <Pressable
                                    onPress={handleToggleReadLater}
                                    style={styles.actionBtn}
                                    hitSlop={10}
                                >
                                    <Ionicons
                                        name={isMarkedReadLater ? "bookmark" : "bookmark-outline"}
                                        size={20}
                                        color={isMarkedReadLater ? Colors.primary : Colors.textLight}
                                    />
                                </Pressable>
                                <Pressable
                                    onPress={handleToggleFavorite}
                                    style={styles.actionBtn}
                                    hitSlop={10}
                                >
                                    <Ionicons
                                        name={isWishlisted ? "heart" : "heart-outline"}
                                        size={22}
                                        color={isWishlisted ? "red" : Colors.textLight}
                                    />
                                </Pressable>
                            </View>
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
    },
    card: {
        padding: Spacing.md,
        borderRadius: Layout.cardRadius,
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
        width: scale(74),
        height: scale(108),
        borderRadius: Layout.borderRadius,
        backgroundColor: Colors.primaryLight,
    },
    coverPlaceholder: {
        alignItems: "center",
        justifyContent: "center",
    },
    info: {
        flex: 1,
        marginLeft: Spacing.md,
        justifyContent: "center",
        gap: scale(6),
        minWidth: 0,
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
        lineHeight: scale(20),
        marginRight: Spacing.sm,
    },
    actionsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: scale(6),
    },
    actionBtn: {
        padding: scale(6),
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
        gap: Spacing.sm,
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
        paddingHorizontal: scale(7),
        paddingVertical: scale(3),
        borderRadius: scale(12),
        borderWidth: 1,
        gap: Spacing.xs,
    },
    availabilityDot: {
        width: scale(6),
        height: scale(6),
        borderRadius: scale(3),
    },
    availabilityText: {
        fontFamily: Fonts.medium,
        fontSize: FontSizes.caption,
    },
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        marginTop: Spacing.xs / 2,
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
        marginRight: scale(6),
    },
    dotSeparator: {
        width: scale(3),
        height: scale(3),
        borderRadius: scale(1.5),
        backgroundColor: Colors.border,
        marginRight: Spacing.sm,
    },
    top10Badge: {
        position: "absolute",
        top: scale(6),
        left: scale(6),
        paddingHorizontal: scale(7),
        paddingVertical: scale(3),
        borderRadius: scale(6),
        borderWidth: 1.2,
        borderColor: "rgba(255,255,255,0.4)",
    },
    top10Text: {
        color: Colors.white,
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.bold,
        letterSpacing: -0.4,
    },
});
