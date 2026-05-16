import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, scale, Spacing } from "@/constants/theme";
import { useFavorites } from "@/hooks";
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
    rentPerDay: number;
    availableCopies: number;
    coverUrl: string | null;
    coverUrls?: string[];
    genre?: string;
    bookViews?: number;
    top10Position?: number;
    onPress?: () => void;
    hideFavorite?: boolean;
}

const CARD_WIDTH = scale(120);
const COVER_H = CARD_WIDTH * 1.5;

export default function DiscoverBookCard({
    _id,
    title,
    author,
    coverUrl,
    coverUrls,
    top10Position,
    onPress,
    hideFavorite,
}: DiscoverBookCardProps) {
    const router = useRouter();
    const { isFavorite, toggleFavorite } = useFavorites();
    const isLiked = isFavorite(_id);

    const cardScale = useSharedValue(1);
    const heartScale = useSharedValue(1);

    const imageUri =
        coverUrls && coverUrls.length > 0 ? coverUrls[0] : coverUrl ?? undefined;

    const handleToggleFavorite = () => {
        toggleFavorite(_id);
        heartScale.value = withSpring(1.35, { damping: 8, stiffness: 400 });
        setTimeout(() => {
            heartScale.value = withSpring(1, { damping: 12, stiffness: 300 });
        }, 150);
    };

    const cardAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: cardScale.value }],
    }));

    const heartAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: heartScale.value }],
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

                    {!hideFavorite && (
                        <Pressable
                            style={styles.bookmarkBtn}
                            onPress={handleToggleFavorite}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                            <Animated.View style={heartAnimStyle}>
                                <Ionicons
                                    name={isLiked ? "heart" : "heart-outline"}
                                    size={scale(16)}
                                    color={isLiked ? Colors.error : Colors.white}
                                />
                            </Animated.View>
                        </Pressable>
                    )}
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
    bookmarkBtn: {
        position: "absolute",
        top: Spacing.sm,
        right: Spacing.sm,
        backgroundColor: "rgba(0,0,0,0.32)",
        width: scale(30),
        height: scale(30),
        borderRadius: scale(15),
        alignItems: "center",
        justifyContent: "center",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "rgba(255,255,255,0.15)",
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
