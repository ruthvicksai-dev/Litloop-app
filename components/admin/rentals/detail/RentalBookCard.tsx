import { FontSizes, Fonts } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface RentalBookCardProps {
    bookId: string;
    coverUri: string | null;
    title?: string;
    author?: string;
    rentPerDay: number;
}

export default function RentalBookCard({ bookId, coverUri, title, author, rentPerDay }: RentalBookCardProps) {
    const router = useRouter();

    return (
        <TouchableOpacity
            style={styles.bookRow}
            activeOpacity={0.7}
            onPress={() => router.push(`/(admin)/book-details?bookId=${bookId}`)}
        >
            {coverUri ? (
                <ExpoImage source={{ uri: coverUri }} style={styles.bookCover} cachePolicy="disk" />
            ) : (
                <View style={styles.bookPlaceholder}>
                    <Ionicons name="book" size={28} color={Colors.textLight} />
                </View>
            )}
            <View style={styles.bookMeta}>
                <Text style={styles.bookTitle} numberOfLines={2}>{title}</Text>
                <Text style={styles.bookAuthor}>{author}</Text>
                <Text style={styles.bookPrice}>₹{rentPerDay}/day</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    bookRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    bookCover: {
        width: 50,
        aspectRatio: 2 / 3,
        borderRadius: 6,
    },
    bookPlaceholder: {
        width: 50,
        aspectRatio: 2 / 3,
        borderRadius: 6,
        backgroundColor: Colors.primaryLight,
        justifyContent: "center",
        alignItems: "center",
    },
    bookMeta: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    bookTitle: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 2,
    },
    bookAuthor: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    bookPrice: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
});
