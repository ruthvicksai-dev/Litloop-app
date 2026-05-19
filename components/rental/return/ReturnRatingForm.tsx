import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";

interface ReturnRatingFormProps {
    userRating: number;
    setUserRating: (val: number) => void;
    reviewText: string;
    setReviewText: (val: string) => void;
}

export default function ReturnRatingForm({
    userRating,
    setUserRating,
    reviewText,
    setReviewText,
}: ReturnRatingFormProps) {
    return (
        <View style={styles.ratingCard}>
            <Text style={styles.ratingTitle}>Rate this book</Text>
            <Text style={styles.ratingSubtitle}>
                Your rating will be shown to other readers in book cards.
            </Text>
            <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                        key={star}
                        onPress={() => setUserRating(star)}
                        activeOpacity={0.8}
                        style={styles.starButton}
                    >
                        <Ionicons
                            name={userRating >= star ? "star" : "star-outline"}
                            size={30}
                            color={userRating >= star ? Colors.warning : Colors.textLight}
                        />
                    </TouchableOpacity>
                ))}
            </View>
            <TextInput
                style={styles.reviewInput}
                placeholder="Share your experience with this book (optional)"
                placeholderTextColor={Colors.textLight}
                value={reviewText}
                onChangeText={setReviewText}
                multiline
                numberOfLines={3}
                maxLength={500}
                textAlignVertical="top"
            />
            {reviewText.length > 0 && (
                <Text style={styles.charCount}>{reviewText.length}/500</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    ratingCard: {
        backgroundColor: Colors.surfaceCard,
        borderRadius: 12,
        padding: Spacing.md,
        marginTop: Spacing.md,
    },
    ratingTitle: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    ratingSubtitle: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        marginTop: 4,
    },
    starsRow: {
        flexDirection: "row",
        marginTop: Spacing.sm,
        gap: 8,
    },
    starButton: {
        paddingVertical: 4,
    },
    reviewInput: {
        marginTop: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        padding: Spacing.sm,
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.text,
        minHeight: 80,
        backgroundColor: Colors.background,
    },
    charCount: {
        fontSize: FontSizes.caption,
        color: Colors.textLight,
        textAlign: "right",
        marginTop: 2,
        fontFamily: Fonts.regular,
    },
});
