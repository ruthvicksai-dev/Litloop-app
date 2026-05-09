import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, scale, Spacing } from "@/constants/theme";
import { useFavorites } from "@/hooks";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

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

    const cardScale = useRef(new Animated.Value(1)).current;
    const heartScale = useRef(new Animated.Value(1)).current;

    const imageUri =
        coverUrls && coverUrls.length > 0 ? coverUrls[0] : coverUrl ?? undefined;

    const handleToggleFavorite = () => {
        toggleFavorite(_id);
        Animated.sequence([
            Animated.spring(heartScale, {
                toValue: 1.3,
                friction: 3,
                useNativeDriver: true,
            }),
            Animated.spring(heartScale, {
                toValue: 1,
                friction: 3,
                useNativeDriver: true,
            }),
        ]).start();
    };

    return (
        <Animated.View style={[styles.card, { transform: [{ scale: cardScale }] }]}>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={onPress ?? (() => router.push(`/book/${_id}` as any))}
                onPressIn={() =>
                    Animated.spring(cardScale, { toValue: 0.96, useNativeDriver: true }).start()
                }
                onPressOut={() =>
                    Animated.spring(cardScale, { toValue: 1, friction: 4, useNativeDriver: true }).start()
                }
            >
                <View style={styles.coverWrap}>
                    <LinearGradient
                        colors={["#FFFFFF", `${Colors.primary}10`, Colors.primaryLight]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[StyleSheet.absoluteFillObject, styles.coverGradient]}
                    />
                    {imageUri ? (
                        <Image
                            source={imageUri}
                            style={styles.cover}
                            cachePolicy="disk"
                            contentFit="cover"
                        />
                    ) : (
                        <View style={[styles.cover, styles.placeholder]}>
                            <Ionicons name="book" size={scale(30)} color={Colors.primary} />
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
                        <TouchableOpacity
                            style={styles.bookmarkBtn}
                            onPress={handleToggleFavorite}
                            activeOpacity={0.7}
                        >
                            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                                <Ionicons
                                    name={isLiked ? "heart" : "heart-outline"}
                                    size={scale(18)}
                                    color={isLiked ? Colors.error : Colors.white}
                                />
                            </Animated.View>
                        </TouchableOpacity>
                    )}
                </View>

                <Text style={styles.title} numberOfLines={2} allowFontScaling={false}>
                    {title}
                </Text>
                <Text style={styles.author} numberOfLines={1} allowFontScaling={false}>
                    {author}
                </Text>
            </TouchableOpacity>
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
        borderRadius: scale(14),
        overflow: "hidden", // Change to hidden to keep it clean
        backgroundColor: Colors.white,
        position: "relative",
        borderWidth: 1, // Add subtle border as fallback
        borderColor: "rgba(0,0,0,0.05)",
    },
    coverGradient: {
        borderRadius: scale(14),
    },
    cover: {
        width: CARD_WIDTH,
        height: COVER_H,
        borderRadius: scale(14),
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
        backgroundColor: "rgba(0,0,0,0.4)",
        width: scale(32),
        height: scale(32),
        borderRadius: scale(10),
        alignItems: "center",
        justifyContent: "center",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "rgba(255,255,255,0.2)",
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
        marginTop: scale(10),
        lineHeight: scale(18),
    },
    author: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        marginTop: Spacing.xs / 2,
        marginBottom: Spacing.sm,
    },
});
