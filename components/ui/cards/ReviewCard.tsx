import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Layout, Spacing } from '@/constants/theme';
import { Fonts, FontSizes } from '@/constants/fonts';
import { timeAgo } from '@/utils/common/date';

interface ReviewCardProps {
    review: {
        _id: string;
        rating: number;
        reviewText?: string;
        createdAt: number;
        userName: string;
        userAvatar?: string;
        userId: string;
        helpfulCount?: number;
        unhelpfulCount?: number;
        userVote?: "helpful" | "unhelpful" | null;
        isFlagged?: boolean;
        bookTitle?: string;
    };
    isAdmin?: boolean;
    currentUserId?: string;
    onVote?: (type: "helpful" | "unhelpful") => void;
    onFlag?: () => void;
    onUnflag?: () => void;
    onDelete?: () => void;
    onEdit?: () => void;
    style?: any;
}

export function StarIcons({ rating, size = 14 }: { rating: number; size?: number }) {
    return (
        <View style={styles.starRow}>
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

export default function ReviewCard({
    review,
    isAdmin,
    currentUserId,
    onVote,
    onFlag,
    onUnflag,
    onDelete,
    onEdit,
    style,
}: ReviewCardProps) {
    const isOwner = currentUserId && review.userId === currentUserId;

    return (
        <View style={[styles.reviewCard, review.isFlagged && isAdmin && styles.flaggedCard, style]}>
            {review.bookTitle && (
                <Text style={styles.bookTitle} numberOfLines={1}>
                    {review.bookTitle}
                </Text>
            )}
            <View style={styles.reviewHeader}>
                <View style={styles.ratingBadge}>
                    <Text style={styles.ratingBadgeText}>{review.rating}</Text>
                    <Ionicons name="star" size={10} color={Colors.white} />
                </View>
                <Text style={styles.reviewHeadline}>
                    {review.rating >= 4 ? "Excellent" : review.rating >= 3 ? "Good" : "Average"}
                </Text>
                <Text style={styles.reviewDate}>{timeAgo(review.createdAt)}</Text>
            </View>

            {review.reviewText ? (
                <Text style={styles.reviewText} numberOfLines={isAdmin ? 10 : 4}>
                    {review.reviewText}
                </Text>
            ) : null}

            <View style={styles.reviewFooter}>
                <View style={styles.userInfoCol}>
                    <Text style={styles.verifiedText}>Reviewed by {review.userName}</Text>
                </View>

                <View style={styles.reviewActions}>
                    {!isAdmin ? (
                        <>
                            <TouchableOpacity
                                style={styles.voteBtn}
                                onPress={() => onVote?.("helpful")}
                            >
                                <Ionicons
                                    name={review.userVote === "helpful" ? "thumbs-up" : "thumbs-up-outline"}
                                    size={18}
                                    color={review.userVote === "helpful" ? Colors.primary : Colors.textSecondary}
                                />
                                <Text style={[styles.voteCount, review.userVote === "helpful" && { color: Colors.primary }]}>
                                    {review.helpfulCount || 0}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => onVote?.("unhelpful")}
                                style={[styles.voteBtn, { marginLeft: 16 }]}
                            >
                                <Ionicons
                                    name={review.userVote === "unhelpful" ? "thumbs-down" : "thumbs-down-outline"}
                                    size={18}
                                    color={review.userVote === "unhelpful" ? Colors.error : Colors.textSecondary}
                                />
                                <Text style={[styles.voteCount, review.userVote === "unhelpful" && { color: Colors.error }]}>
                                    {review.unhelpfulCount || 0}
                                </Text>
                            </TouchableOpacity>

                            {isOwner ? (
                                <View style={styles.authorActions}>
                                    <TouchableOpacity onPress={onEdit}>
                                        <Ionicons name="create-outline" size={18} color={Colors.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        onPress={onDelete}
                                        style={{ marginLeft: 12 }}
                                    >
                                        <Ionicons name="trash-outline" size={18} color={Colors.error} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={onFlag}
                                    style={styles.flagBtn}
                                >
                                    <Ionicons name="flag-outline" size={14} color={Colors.textLight} />
                                </TouchableOpacity>
                            )}
                        </>
                    ) : (
                        <View style={styles.authorActions}>
                            <TouchableOpacity onPress={review.isFlagged ? onUnflag : onFlag}>
                                <Ionicons 
                                    name={review.isFlagged ? "flag" : "flag-outline"} 
                                    size={18} 
                                    color={review.isFlagged ? Colors.warning : Colors.textLight} 
                                />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onDelete} style={{ marginLeft: 12 }}>
                                <Ionicons name="trash-outline" size={18} color={Colors.error} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    starRow: {
        flexDirection: "row",
    },
    reviewCard: {
        backgroundColor: Colors.white,
        borderRadius: Layout.cardRadius,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.04)",
    },
    flaggedCard: {
        borderColor: Colors.warning,
        backgroundColor: "rgba(255, 152, 0, 0.05)",
    },
    bookTitle: {
        fontSize: 12,
        fontFamily: Fonts.bold,
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    reviewHeader: {
        flexDirection: "row",
        alignItems: "center",
    },
    ratingBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    ratingBadgeText: {
        fontSize: 12,
        fontFamily: Fonts.bold,
        color: Colors.white,
        marginRight: 2,
    },
    reviewHeadline: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginLeft: Spacing.sm,
    },
    reviewDate: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.regular,
        color: Colors.textLight,
        marginLeft: "auto",
    },
    reviewText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.text,
        lineHeight: 20,
        marginTop: Spacing.sm,
    },
    reviewFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginTop: Spacing.md,
    },
    userInfoCol: {
        flex: 1,
    },
    verifiedText: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
    },
    reviewActions: {
        flexDirection: "row",
        alignItems: "center",
    },
    voteBtn: {
        flexDirection: "row",
        alignItems: "center",
    },
    voteCount: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        marginLeft: 4,
    },
    authorActions: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 16,
    },
    flagBtn: {
        padding: 4,
        marginLeft: 12,
    },
});
