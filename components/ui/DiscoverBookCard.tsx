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
    availableCopies,
}: DiscoverBookCardProps) {
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
                {/* Cover image */}
                <View style={styles.coverWrap}>
                    <LinearGradient
                        colors={["#FFFFFF", `${Colors.primary}10`, Colors.primaryLight]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                    />
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.cover} />
                    ) : (
                        <View style={[styles.cover, styles.placeholder]}>
                            <Ionicons name="book" size={30} color={Colors.primary} />
                        </View>
                    )}
                </View>

                {/* Availability dot indicator */}
                <View style={styles.availabilityDot}>
                    <View
                        style={[
                            styles.dot,
                            { backgroundColor: availableCopies > 0 ? Colors.success : Colors.error },
                        ]}
                    />
                </View>

                {/* Book title below cover */}
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

const CARD_WIDTH = 115;

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        marginRight: 12,
    },
    coverWrap: {
        width: CARD_WIDTH,
        height: CARD_WIDTH * 1.52,
        borderRadius: 12,
        overflow: "hidden",
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    cover: {
        width: CARD_WIDTH,
        height: CARD_WIDTH * 1.52,
        borderRadius: 10,
        backgroundColor: Colors.primaryLight,
    },
    placeholder: {
        alignItems: "center",
        justifyContent: "center",
    },
    availabilityDot: {
        position: "absolute",
        top: 6,
        right: 6,
        backgroundColor: "rgba(255,255,255,0.85)",
        borderRadius: 8,
        padding: 3,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 4,
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
