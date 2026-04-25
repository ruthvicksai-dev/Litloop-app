import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, scale, Spacing } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

interface Props {
    bookId: string;
}

function StarIcons({ rating, size = 14 }: { rating: number; size?: number }) {
    return (
        <View style={{ flexDirection: "row", gap: 2 }}>
            {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                    key={star}
                    name={rating >= star ? "star" : rating >= star - 0.5 ? "star-half" : "star-outline"}
                    size={size}
                    color={Colors.warning}
                />
            ))}
        </View>
    );
}

function timeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
}

export default function BookReviews({ bookId }: Props) {
    const reviews = useQuery(api.reviews.getBookReviews, { bookId: bookId as Id<"books"> });
    const summary = useQuery(api.reviews.getBookReviewSummary, { bookId: bookId as Id<"books"> });

    if (reviews === undefined || summary === undefined) return null;
    if (summary.totalReviews === 0) return null;

    const maxDistribution = Math.max(...Object.values(summary.distribution), 1);

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Ratings & Reviews</Text>

            {/* Summary Row */}
            <View style={styles.summaryRow}>
                <View style={styles.ratingBig}>
                    <Text style={styles.ratingNumber}>{summary.averageRating.toFixed(1)}</Text>
                    <StarIcons rating={Math.round(summary.averageRating)} size={16} />
                    <Text style={styles.totalText}>{summary.totalReviews} {summary.totalReviews === 1 ? "review" : "reviews"}</Text>
                </View>
                <View style={styles.distributionCol}>
                    {[5, 4, 3, 2, 1].map((star) => (
                        <View key={star} style={styles.distRow}>
                            <Text style={styles.distStar}>{star}</Text>
                            <Ionicons name="star" size={10} color={Colors.warning} />
                            <View style={styles.distBarBg}>
                                <View
                                    style={[
                                        styles.distBarFill,
                                        { width: `${(summary.distribution[star] / maxDistribution) * 100}%` },
                                    ]}
                                />
                            </View>
                            <Text style={styles.distCount}>{summary.distribution[star]}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Review Cards */}
            {reviews.map((review) => (
                <View key={review._id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                        {review.userAvatar ? (
                            <Image source={{ uri: review.userAvatar }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarLetter}>
                                    {review.userName.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <View style={styles.reviewMeta}>
                            <Text style={styles.userName}>{review.userName}</Text>
                            <Text style={styles.reviewDate}>{timeAgo(review.createdAt)}</Text>
                        </View>
                        <StarIcons rating={review.rating} />
                    </View>
                    {review.reviewText ? (
                        <Text style={styles.reviewText}>{review.reviewText}</Text>
                    ) : null}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: Spacing.xl,
    },
    sectionTitle: {
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: Spacing.md,
    },
    summaryRow: {
        flexDirection: "row",
        backgroundColor: Colors.white,
        borderRadius: Layout.cardRadiusLarge,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
        marginBottom: Spacing.md,
        gap: Spacing.lg,
    },
    ratingBig: {
        alignItems: "center",
        justifyContent: "center",
        minWidth: scale(80),
    },
    ratingNumber: {
        fontSize: scale(32),
        fontFamily: Fonts.bold,
        color: Colors.text,
        lineHeight: scale(36),
    },
    totalText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    distributionCol: {
        flex: 1,
        justifyContent: "center",
        gap: 3,
    },
    distRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    distStar: {
        fontSize: 11,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        width: 10,
        textAlign: "right",
    },
    distBarBg: {
        flex: 1,
        height: 6,
        backgroundColor: Colors.border,
        borderRadius: 3,
        overflow: "hidden",
    },
    distBarFill: {
        height: 6,
        backgroundColor: Colors.warning,
        borderRadius: 3,
    },
    distCount: {
        fontSize: 11,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        width: 18,
        textAlign: "right",
    },
    reviewCard: {
        backgroundColor: Colors.white,
        borderRadius: Layout.cardRadius,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.04)",
    },
    reviewHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    avatarPlaceholder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primaryLight,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarLetter: {
        fontSize: 16,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
    reviewMeta: {
        flex: 1,
    },
    userName: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.text,
    },
    reviewDate: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.regular,
        color: Colors.textLight,
    },
    reviewText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.text,
        lineHeight: 20,
        marginTop: Spacing.sm,
    },
});
