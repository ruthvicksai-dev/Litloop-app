import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors } from "@/constants/theme";
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

export default function Top10BookCard({
    _id,
    title,
    author,
    coverUrl,
    coverUrls,
    rank,
}: Top10BookCardProps) {
    const router = useRouter();
    const scale = useRef(new Animated.Value(1)).current;

    const imageUri =
        coverUrls && coverUrls.length > 0 ? coverUrls[0] : coverUrl ?? undefined;

    const getRankStyles = (rank: number) => {
        if (rank === 1) return { colors: ["#FFD700", "#FFA500"] as const, label: "#1" };
        if (rank === 2) return { colors: ["#E5E4E2", "#B4B4B4"] as const, label: "#2" };
        if (rank === 3) return { colors: ["#CD7F32", "#A0522D"] as const, label: "#3" };
        return { colors: [Colors.primary, "#8B4513"] as const, label: `#${rank}` };
    };

    const rankStyle = getRankStyles(rank);

    return (
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
            <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => router.push((`/book/${_id}`) as any)}
                onPressIn={() =>
                    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start()
                }
                onPressOut={() =>
                    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start()
                }
            >
                <View style={styles.coverWrap}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.cover} />
                    ) : (
                        <View style={[styles.cover, styles.placeholder]}>
                            <Ionicons name="book" size={26} color={Colors.primary} />
                        </View>
                    )}

                    {/* Rank Badge Overlay */}
                    <LinearGradient
                        colors={rankStyle.colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.badge}
                    >
                        <Text style={styles.badgeText}>{rankStyle.label}</Text>
                    </LinearGradient>
                </View>

                {/* Title & author below */}
                <Text style={styles.title} numberOfLines={2}>{title}</Text>
                <Text style={styles.author} numberOfLines={1}>{author}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

const COVER_W = 120;
const COVER_H = COVER_W * 1.5;

const styles = StyleSheet.create({
    card: {
        width: COVER_W,
        marginRight: 16,
        backgroundColor: "transparent",
    },
    coverWrap: {
        borderRadius: 14,
        overflow: "visible",
        backgroundColor: Colors.white,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
        position: "relative",
    },
    cover: {
        width: COVER_W,
        height: COVER_H,
        borderRadius: 14,
        backgroundColor: Colors.primaryLight,
    },
    badge: {
        position: "absolute",
        top: 10,
        left: 10,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: "rgba(255,255,255,0.4)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    badgeText: {
        color: Colors.white,
        fontSize: 13,
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
        marginTop: 10,
        lineHeight: 18,
    },
    author: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        marginTop: 2,
        marginBottom: 8,
    },
});
