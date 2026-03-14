import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type SearchBookCardProps = {
    title: string;
    author: string;
    rating: number;
    coverUrl: string | null;
    onPress: () => void;
};

function BookCard({ title, author, rating, coverUrl, onPress }: SearchBookCardProps) {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.86}>
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
                    <Ionicons name="book-outline" size={24} color={Colors.primary} />
                </View>
            )}

            <View style={styles.info}>
                <Text numberOfLines={2} style={styles.title}>
                    {title}
                </Text>
                <Text numberOfLines={1} style={styles.author}>
                    {author}
                </Text>
                <View style={styles.ratingRow}>
                    <Ionicons name="star" size={13} color={Colors.warning} />
                    <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default memo(BookCard);

const styles = StyleSheet.create({
    card: {
        flexDirection: "row",
        alignItems: "center",
        padding: Spacing.md,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.white,
        marginBottom: Spacing.sm,
        shadowColor: Colors.shadow,
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 2,
    },
    cover: {
        width: 56,
        height: 80,
        borderRadius: 10,
        backgroundColor: Colors.primaryLight,
    },
    coverPlaceholder: {
        alignItems: "center",
        justifyContent: "center",
    },
    info: {
        flex: 1,
        marginLeft: Spacing.md,
        minWidth: 0,
    },
    title: {
        color: Colors.text,
        fontFamily: Fonts.bold,
        fontSize: FontSizes.subtitle,
        marginBottom: 2,
    },
    author: {
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        fontSize: FontSizes.body,
        marginBottom: 8,
    },
    ratingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    ratingText: {
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
        fontSize: FontSizes.small,
    },
});
