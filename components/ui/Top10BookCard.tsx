import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
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
                {/* Rank number stands beside cover */}
                <View style={styles.row}>
                    {/* Big rank number to the left, now in FRONT of the cover */}
                    <Text style={styles.rankNum}>{rank}</Text>

                    {/* Cover */}
                    <View style={styles.coverWrap}>
                        {imageUri ? (
                            <Image source={{ uri: imageUri }} style={styles.cover} />
                        ) : (
                            <View style={[styles.cover, styles.placeholder]}>
                                <Ionicons name="book" size={26} color={Colors.primary} />
                            </View>
                        )}
                    </View>
                </View>

                {/* Title & author below */}
                <Text style={styles.title} numberOfLines={2}>{title}</Text>
                <Text style={styles.author} numberOfLines={1}>{author}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

const COVER_W = 100;
const COVER_H = COVER_W * 1.52;

const styles = StyleSheet.create({
    card: {
        width: 140, // Slightly wider to accommodate bigger number
        marginRight: 12,
    },
    row: {
        flexDirection: "row",
        alignItems: "flex-end",
        position: "relative",
    },
    // Large rank — overlapping the cover in front
    rankNum: {
        fontSize: 66,
        fontFamily: Fonts.bold,
        color: Colors.primaryDark,
        lineHeight: 70,
        marginRight: -22, // overlap into the cover
        zIndex: 10, // Bring to front
    },
    coverWrap: {
        borderRadius: 10,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.08)",
        zIndex: 1, // Behind the number
    },
    cover: {
        width: COVER_W,
        height: COVER_H,
        backgroundColor: Colors.primaryLight,
    },
    placeholder: {
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginTop: 7,
        lineHeight: 17,
    },
    author: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        marginTop: 2,
    },
});
