import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors } from "@/constants/theme";
import { useFavorites } from "@/hooks/useFavorites";
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
}

export default function DiscoverBookCard({
    _id,
    title,
    author,
    coverUrl,
    coverUrls,
}: DiscoverBookCardProps) {
    const router = useRouter();
    const { isFavorite, toggleFavorite } = useFavorites();
    const isLiked = isFavorite(_id);

    const scale = useRef(new Animated.Value(1)).current;
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
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.push(`/book/${_id}` as any)}
                onPressIn={() =>
                    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start()
                }
                onPressOut={() =>
                    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start()
                }
            >
                {/* Cover section */}
                <View style={styles.coverWrap}>
                    <LinearGradient
                        colors={["#FFFFFF", `${Colors.primary}10`, Colors.primaryLight]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[StyleSheet.absoluteFillObject, { borderRadius: 14 }]}
                    />
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.cover} />
                    ) : (
                        <View style={[styles.cover, styles.placeholder]}>
                            <Ionicons name="book" size={30} color={Colors.primary} />
                        </View>
                    )}

                    {/* Bookmark/Save Button Overlay */}
                    <TouchableOpacity
                        style={styles.bookmarkBtn}
                        onPress={handleToggleFavorite}
                        activeOpacity={0.7}
                    >
                        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                            <Ionicons
                                name={isLiked ? "bookmark" : "bookmark-outline"}
                                size={18}
                                color={isLiked ? "#FF9500" : Colors.white}
                            />
                        </Animated.View>
                    </TouchableOpacity>
                </View>

                {/* Book title */}
                <Text style={styles.title} numberOfLines={2}>
                    {title}
                </Text>
                {/* Author */}
                <Text style={styles.author} numberOfLines={1}>
                    {author}
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

const CARD_WIDTH = 120;
const COVER_H = CARD_WIDTH * 1.5;

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        marginRight: 16,
        backgroundColor: "transparent", // Remove white background from card
    },
    coverWrap: {
        borderRadius: 14,
        overflow: "visible", // Changed to visible for shadow to show
        backgroundColor: Colors.white,
        position: "relative",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
    },
    cover: {
        width: CARD_WIDTH,
        height: COVER_H,
        borderRadius: 14, // Added borderRadius here since container is visible
        backgroundColor: Colors.primaryLight,
    },
    placeholder: {
        alignItems: "center",
        justifyContent: "center",
    },
    bookmarkBtn: {
        position: "absolute",
        top: 8,
        right: 8,
        backgroundColor: "rgba(0,0,0,0.4)",
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "rgba(255,255,255,0.2)",
    },
    title: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginTop: 10,
        lineHeight: 18,
    },
    author: {
        fontSize: 11,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        marginTop: 2,
        marginBottom: 8,
    },
});
