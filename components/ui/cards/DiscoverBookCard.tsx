import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, scale, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from "react-native-reanimated";

const SPRING = { damping: 16, stiffness: 350, mass: 0.8 };

export interface DiscoverBookCardProps {
    _id: string;
    title: string;
    author: string;
    rentPerDay?: number;
    availableCopies?: number;
    coverUrl: string | null;
    coverUrls?: string[];
    genre?: string;
    bookViews?: number;
    top10Position?: number;
    rating?: number;
    onPress?: () => void;
}

const CARD_WIDTH = scale(105);
const COVER_H = CARD_WIDTH * 1.45;

export default function DiscoverBookCard({
    _id,
    title,
    author,
    coverUrl,
    coverUrls,
    top10Position,
    rating,
    onPress,
}: DiscoverBookCardProps) {
    const router = useRouter();
    const cardScale = useSharedValue(1);

    const imageUri =
        coverUrls && coverUrls.length > 0 ? coverUrls[0] : coverUrl ?? undefined;

    const cardAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: cardScale.value }],
    }));

    return (
        <Animated.View style={[styles.card, cardAnimStyle]}>
            <Pressable
                onPress={onPress ?? (() => router.push(`/book/${_id}` as any))}
                onPressIn={() => { cardScale.value = withSpring(0.96, SPRING); }}
                onPressOut={() => { cardScale.value = withSpring(1, SPRING); }}
            >
                <View style={styles.coverWrap}>
                    {imageUri ? (
                        <Image
                            source={imageUri}
                            style={styles.cover}
                            cachePolicy="disk"
                            contentFit="cover"
                        />
                    ) : (
                        <View style={[styles.cover, styles.placeholder]}>
                            <Ionicons name="book" size={scale(28)} color={Colors.primary} />
                        </View>
                    )}

                    {top10Position ? (
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
                            <Text style={styles.top10Text} allowFontScaling={false}>
                                #{top10Position}
                            </Text>
                        </LinearGradient>
                    ) : null}

                    {rating && rating > 0 ? (
                        <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={scale(10)} color="#FFD700" />
                            <Text style={styles.ratingText} allowFontScaling={false}>
                                {rating.toFixed(1)}
                            </Text>
                        </View>
                    ) : null}
                </View>

                <Text style={styles.title} numberOfLines={2} allowFontScaling={false}>
                    {title}
                </Text>
                <Text style={styles.author} numberOfLines={1} allowFontScaling={false}>
                    {author}
                </Text>
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        marginRight: Spacing.md,
        backgroundColor: "transparent",
    },
    coverWrap: {
        borderRadius: scale(12),
        overflow: "hidden",
        backgroundColor: Colors.primaryLight,
        position: "relative",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.04)",
    },
    cover: {
        width: CARD_WIDTH,
        height: COVER_H,
        backgroundColor: Colors.primaryLight,
    },
    placeholder: {
        alignItems: "center",
        justifyContent: "center",
    },
    top10Badge: {
        position: "absolute",
        top: Spacing.sm,
        left: Spacing.sm,
        paddingHorizontal: Spacing.sm,
        paddingVertical: scale(3),
        borderRadius: scale(6),
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.4)",
    },
    top10Text: {
        color: Colors.white,
        fontSize: FontSizes.small,
        fontFamily: Fonts.bold,
        letterSpacing: -0.4,
    },
    ratingBadge: {
        position: "absolute",
        bottom: scale(6),
        left: scale(6),
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.65)",
        paddingHorizontal: scale(6),
        paddingVertical: scale(2),
        borderRadius: scale(10),
        gap: 3,
    },
    ratingText: {
        fontSize: FontSizes.tiny,
        color: Colors.white,
        fontFamily: Fonts.bold,
    },
    title: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginTop: scale(8),
        lineHeight: scale(17),
    },
    author: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        marginTop: 2,
        marginBottom: Spacing.sm,
    },
});
