import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing, scale } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef } from "react";
import {
    Animated,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Top10BookCardProps {
    _id: string;
    title: string;
    author: string;
    rentPerDay: number;
    availableCopies: number;
    coverUrl: string | null;
    coverUrls?: string[];
    genre?: string;
    bookViews?: number;
    rank: number;
}

const COVER_W = scale(120);
const COVER_H = COVER_W * 1.5;

export default function Top10BookCard({
    _id,
    title,
    author,
    coverUrl,
    coverUrls,
    rank,
}: Top10BookCardProps) {
    const router = useRouter();
    const cardScale = useRef(new Animated.Value(1)).current;

    const imageUri =
        coverUrls && coverUrls.length > 0 ? coverUrls[0] : coverUrl ?? undefined;

    const getRankStyles = (currentRank: number) => {
        if (currentRank === 1) return { colors: ["#FFD700", "#FFA500"] as const, label: "#1" };
        if (currentRank === 2) return { colors: ["#E5E4E2", "#B4B4B4"] as const, label: "#2" };
        if (currentRank === 3) return { colors: ["#CD7F32", "#A0522D"] as const, label: "#3" };
        return { colors: [Colors.primary, "#8B4513"] as const, label: `#${currentRank}` };
    };

    const rankStyle = getRankStyles(rank);

    return (
        <Animated.View style={[styles.card, { transform: [{ scale: cardScale }] }]}>
            <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => router.push((`/book/${_id}`) as any)}
                onPressIn={() =>
                    Animated.spring(cardScale, { toValue: 0.95, useNativeDriver: true }).start()
                }
                onPressOut={() =>
                    Animated.spring(cardScale, { toValue: 1, friction: 4, useNativeDriver: true }).start()
                }
            >
                <View style={styles.coverWrap}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.cover} />
                    ) : (
                        <View style={[styles.cover, styles.placeholder]}>
                            <Ionicons name="book" size={scale(26)} color={Colors.primary} />
                        </View>
                    )}

                    <LinearGradient
                        colors={rankStyle.colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.badge}
                    >
                        <Text style={styles.badgeText} allowFontScaling={false}>
                            {rankStyle.label}
                        </Text>
                    </LinearGradient>
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
        width: COVER_W,
        marginRight: Spacing.md,
        backgroundColor: "transparent",
    },
    coverWrap: {
        borderRadius: scale(14),
        overflow: "hidden",
        backgroundColor: Colors.white,
        position: "relative",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
    },
    cover: {
        width: COVER_W,
        height: COVER_H,
        borderRadius: scale(14),
        backgroundColor: Colors.primaryLight,
    },
    badge: {
        position: "absolute",
        top: scale(10),
        left: scale(10),
        paddingHorizontal: scale(10),
        paddingVertical: Spacing.xs,
        borderRadius: scale(10),
        borderWidth: 1.5,
        borderColor: "rgba(255,255,255,0.4)",
    },
    badgeText: {
        color: Colors.white,
        fontSize: FontSizes.small,
        fontFamily: Fonts.bold,
        letterSpacing: -0.5,
    },
    placeholder: {
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginTop: scale(10),
        lineHeight: scale(18),
    },
    author: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        marginTop: Spacing.xs / 2,
        marginBottom: Spacing.sm,
    },
});
