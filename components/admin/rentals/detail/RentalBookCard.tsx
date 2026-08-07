import { FontSizes, Fonts } from "@/constants/fonts";
import { Colors } from "@/constants/theme";
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

function RentalBookCard({ bookId, coverUri, title, author, rentPerDay }: RentalBookCardProps) {
    const router = useRouter();

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.headerTitleRow}>
                    <Ionicons name="book" size={16} color={Colors.primary} />
                    <Text style={styles.cardHeaderTitle}>Rented Book</Text>
                </View>
                <View style={styles.priceTag}>
                    <Text style={styles.priceTagText}>₹{rentPerDay}/day</Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.bookRow}
                activeOpacity={0.75}
                onPress={() => router.push(`/(admin)/book-details?bookId=${bookId}`)}
            >
                {coverUri ? (
                    <ExpoImage source={{ uri: coverUri }} style={styles.bookCover} cachePolicy="disk" />
                ) : (
                    <View style={styles.bookPlaceholder}>
                        <Ionicons name="book" size={26} color={Colors.textLight} />
                    </View>
                )}
                <View style={styles.bookMeta}>
                    <Text style={styles.bookTitle} numberOfLines={2}>{title || "Book Title"}</Text>
                    <Text style={styles.bookAuthor} numberOfLines={1}>{author || "Author"}</Text>
                    <View style={styles.tapDetailsRow}>
                        <Text style={styles.tapDetailsText}>Tap for full book details</Text>
                        <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
}

export default React.memo(RentalBookCard);

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 16,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.04)",
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.04)",
    },
    headerTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    cardHeaderTitle: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.text,
        letterSpacing: 0.2,
    },
    priceTag: {
        backgroundColor: Colors.primary + "12",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    priceTagText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
    bookRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    bookCover: {
        width: 52,
        height: 76,
        borderRadius: 10,
    },
    bookPlaceholder: {
        width: 52,
        height: 76,
        borderRadius: 10,
        backgroundColor: Colors.background,
        alignItems: "center",
        justifyContent: "center",
    },
    bookMeta: {
        flex: 1,
    },
    bookTitle: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 2,
    },
    bookAuthor: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        marginBottom: 6,
    },
    tapDetailsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    tapDetailsText: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
});
