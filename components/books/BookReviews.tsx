import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, scale, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import React, { useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Button from "../ui/core/Button";
import ConfirmActionModal from "../ui/feedback/ConfirmActionModal";
import ReviewCard from "../ui/cards/ReviewCard";

interface Props {
    bookId: string;
    limit?: number;
    hasMore?: boolean;
    onLoadMore?: () => void;
    isAdmin?: boolean;
}

interface Review {
    _id: Id<"reviews">;
    rating: number;
    reviewText?: string;
    createdAt: number;
    userName: string;
    userAvatar?: string;
    userId: Id<"users">;
    rentalId?: Id<"rentals">;
    helpfulCount: number;
    unhelpfulCount: number;
    userVote: "helpful" | "unhelpful" | null;
}

interface ReviewSummary {
    averageRating: number;
    totalReviews: number;
    distribution: Record<number, number>;
}

function StarIcons({ rating, size = 14 }: { rating: number; size?: number }) {
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

export default function BookReviews({ bookId, limit, hasMore, onLoadMore, isAdmin }: Props) {
    const { accessToken, userId } = useAuth();
    const { showToast } = useToast();
    
    const reviewsData = useQuery(api.reviews.getBookReviews, {
        bookId: bookId as Id<"books">,
        accessToken: accessToken ?? undefined,
        ...(limit ? { limit } : {})
    });
    const reviews = reviewsData as Review[] | undefined;
    
    const summaryData = useQuery(api.reviews.getBookReviewSummary, { bookId: bookId as Id<"books"> });
    const summary = summaryData as ReviewSummary | undefined;
    
    const reportReviewMutation = useMutation(api.reviews.reportReview);
    const updateReviewMutation = useMutation(api.reviews.updateReview);
    const deleteReviewMutation = useMutation(api.reviews.deleteReview);
    const voteReviewMutation = useMutation(api.reviews.voteReview);

    const [editingReview, setEditingReview] = useState<{ id: Id<"reviews">; rating: number; text: string } | null>(null);
    const [deletingReviewId, setDeletingReviewId] = useState<Id<"reviews"> | null>(null);
    const [reportingReviewId, setReportingReviewId] = useState<Id<"reviews"> | null>(null);
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [reportDetails, setReportDetails] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const REPORT_REASONS = [
        "Spam or fake review",
        "Inappropriate language",
        "Misleading content",
        "Not relevant to the book",
        "Harassment or bullying",
        "Other",
    ];

    const handleReport = (reviewId: Id<"reviews">) => {
        if (!accessToken) {
            showToast("Please sign in to report a review.", "error");
            return;
        }
        setReportingReviewId(reviewId);
        setSelectedReason(null);
        setReportDetails("");
    };

    const handleSubmitReport = async () => {
        if (!reportingReviewId || !accessToken || !selectedReason) return;
        setIsSubmitting(true);
        try {
            const reason = reportDetails.trim()
                ? `${selectedReason}: ${reportDetails.trim()}`
                : selectedReason;
            await reportReviewMutation({
                reviewId: reportingReviewId,
                reason,
                accessToken,
            });
            setReportingReviewId(null);
            showToast("Review reported. We'll review it shortly.", "success");
        } catch (error: any) {
            showToast(error.message || "Failed to report review.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateReview = async () => {
        if (!editingReview || !accessToken) return;
        setIsSubmitting(true);
        try {
            await updateReviewMutation({
                reviewId: editingReview.id,
                rating: editingReview.rating,
                reviewText: editingReview.text,
                accessToken
            });
            setEditingReview(null);
            showToast("Review updated.", "success");
        } catch (error: any) {
            showToast(error.message || "Failed to update review.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVote = async (reviewId: Id<"reviews">, voteType: "helpful" | "unhelpful") => {
        if (!accessToken) {
            showToast("Please sign in to vote.", "info");
            return;
        }
        try {
            await voteReviewMutation({ reviewId, voteType, accessToken });
        } catch (error: any) {
            showToast(error.message || "Failed to submit vote.", "error");
        }
    };

    const handleDeleteReview = async () => {
        if (!deletingReviewId || !accessToken) return;
        setIsSubmitting(true);
        try {
            await deleteReviewMutation({
                reviewId: deletingReviewId,
                accessToken
            });
            setDeletingReviewId(null);
            showToast("Review deleted.", "info");
        } catch (error: any) {
            showToast(error.message || "Failed to delete review.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!reviews || !summary) return null;
    if (summary.totalReviews === 0) {
        if (isAdmin) {
            return (
                <View style={styles.container}>
                    <Text style={styles.sectionTitle}>Ratings & Reviews</Text>
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>There are no reviews yet.</Text>
                    </View>
                </View>
            );
        }
        return null;
    }

    const maxDist = Math.max(...Object.values(summary.distribution), 1);

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Ratings & Reviews</Text>

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
                            <Ionicons name="star" size={10} color={Colors.warning} style={{ marginHorizontal: 4 }} />
                            <View style={styles.distBarBg}>
                                <View
                                    style={[
                                        styles.distBarFill,
                                        { width: `${(summary.distribution[star] / maxDist) * 100}%` },
                                    ]}
                                />
                            </View>
                            <Text style={styles.distCount}>{summary.distribution[star]}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {reviews.map((review) => (
                <ReviewCard
                    key={review._id.toString()}
                    review={{
                        ...review,
                        _id: review._id.toString(),
                        userId: review.userId.toString(),
                    }}
                    isAdmin={isAdmin}
                    currentUserId={userId?.toString()}
                    onVote={(voteType) => handleVote(review._id, voteType)}
                    onFlag={() => handleReport(review._id)}
                    onDelete={() => setDeletingReviewId(review._id)}
                    onEdit={() => setEditingReview({
                        id: review._id,
                        rating: review.rating,
                        text: review.reviewText || ""
                    })}
                />
            ))}

            {hasMore && onLoadMore && (
                <TouchableOpacity style={styles.loadMoreBtn} onPress={onLoadMore} activeOpacity={0.8}>
                    <Text style={styles.loadMoreText}>View All Reviews</Text>
                </TouchableOpacity>
            )}

            <Modal
                visible={!!editingReview}
                transparent
                animationType="slide"
                onRequestClose={() => setEditingReview(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.editCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Review</Text>
                            <TouchableOpacity onPress={() => setEditingReview(null)}>
                                <Ionicons name="close" size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Rating</Text>
                        <View style={styles.editStars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => setEditingReview(prev => prev ? { ...prev, rating: star } : null)}
                                    style={{ marginRight: 8 }}
                                >
                                    <Ionicons
                                        name={editingReview && editingReview.rating >= star ? "star" : "star-outline"}
                                        size={32}
                                        color={Colors.warning}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.inputLabel}>Your review</Text>
                        <TextInput
                            style={styles.textInput}
                            multiline
                            placeholder="Share your thoughts..."
                            value={editingReview?.text}
                            onChangeText={(text) => setEditingReview(prev => prev ? { ...prev, text } : null)}
                            maxLength={500}
                        />

                        <View style={styles.modalActions}>
                            <Button
                                title="Cancel"
                                variant="outline"
                                onPress={() => setEditingReview(null)}
                                containerStyle={{ flex: 1, marginRight: 16 }}
                            />
                            <Button
                                title="Save Changes"
                                onPress={handleUpdateReview}
                                loading={isSubmitting}
                                containerStyle={{ flex: 2 }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Report Review Modal */}
            <Modal
                visible={!!reportingReviewId}
                transparent
                animationType="slide"
                onRequestClose={() => setReportingReviewId(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.editCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Report Review</Text>
                            <TouchableOpacity onPress={() => setReportingReviewId(null)}>
                                <Ionicons name="close" size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.reportSubtitle}>Why are you reporting this review?</Text>

                        <ScrollView style={styles.reasonList} showsVerticalScrollIndicator={false}>
                            {REPORT_REASONS.map((reason) => (
                                <TouchableOpacity
                                    key={reason}
                                    style={[
                                        styles.reasonItem,
                                        selectedReason === reason && styles.reasonItemSelected,
                                    ]}
                                    onPress={() => setSelectedReason(reason)}
                                >
                                    <View style={[
                                        styles.reasonRadio,
                                        selectedReason === reason && styles.reasonRadioSelected,
                                    ]}>
                                        {selectedReason === reason && <View style={styles.reasonRadioDot} />}
                                    </View>
                                    <Text style={[
                                        styles.reasonText,
                                        selectedReason === reason && styles.reasonTextSelected,
                                    ]}>{reason}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {selectedReason && (
                            <>
                                <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>Additional details (optional)</Text>
                                <TextInput
                                    style={styles.textInput}
                                    multiline
                                    placeholder="Tell us more about the issue..."
                                    value={reportDetails}
                                    onChangeText={setReportDetails}
                                    maxLength={300}
                                />
                            </>
                        )}

                        <View style={styles.modalActions}>
                            <Button
                                title="Cancel"
                                variant="outline"
                                onPress={() => setReportingReviewId(null)}
                                containerStyle={{ flex: 1, marginRight: 16 }}
                            />
                            <Button
                                title="Submit Report"
                                onPress={handleSubmitReport}
                                loading={isSubmitting}
                                disabled={!selectedReason}
                                containerStyle={{ flex: 2 }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            <ConfirmActionModal
                visible={!!deletingReviewId}
                title="Delete Review"
                message="Are you sure you want to delete this review?"
                confirmLabel="Delete"
                tone="danger"
                onConfirm={handleDeleteReview}
                onCancel={() => setDeletingReviewId(null)}
                loading={isSubmitting}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: Spacing.xl,
    },
    starRow: {
        flexDirection: "row",
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
    },
    ratingBig: {
        alignItems: "center",
        justifyContent: "center",
        minWidth: scale(80),
        marginRight: Spacing.lg,
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
    },
    distRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 3,
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
        marginLeft: 4,
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
        marginLeft: "auto",
    },
    reviewText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.text,
        lineHeight: 20,
        marginTop: Spacing.sm,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    editCard: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: Spacing.lg,
        paddingBottom: Spacing.xl + 20,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: Spacing.lg,
    },
    modalTitle: {
        fontSize: FontSizes.titleLarge,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    inputLabel: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: Spacing.sm,
    },
    editStars: {
        flexDirection: "row",
        marginBottom: Spacing.lg,
    },
    textInput: {
        backgroundColor: Colors.background,
        borderRadius: Layout.cardRadius,
        padding: Spacing.md,
        height: 120,
        textAlignVertical: "top",
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.text,
        marginBottom: Spacing.xl,
    },
    modalActions: {
        flexDirection: "row",
    },
    authorActions: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 16,
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
    reviewFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginTop: Spacing.md,
    },
    userInfoCol: {
        flex: 1,
    },
    verifiedRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 2,
    },
    verifiedCheck: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 4,
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
    flagBtn: {
        padding: 4,
        marginLeft: 12,
    },
    reportSubtitle: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        marginBottom: Spacing.md,
    },
    reasonList: {
        maxHeight: 260,
    },
    reasonItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: Spacing.sm,
        borderRadius: Layout.borderRadius,
        marginBottom: 4,
    },
    reasonItemSelected: {
        backgroundColor: Colors.primaryLight,
    },
    reasonRadio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: Colors.border,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    reasonRadioSelected: {
        borderColor: Colors.primary,
    },
    reasonRadioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.primary,
    },
    reasonText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.text,
    },
    reasonTextSelected: {
        fontFamily: Fonts.medium,
        color: Colors.primary,
    },
    loadMoreBtn: {
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: "center",
        marginTop: Spacing.sm,
        borderRadius: Layout.borderRadius,
        backgroundColor: Colors.primaryLight,
    },
    loadMoreText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
    emptyContainer: {
        paddingVertical: Spacing.lg,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyText: {
        fontSize: FontSizes.body,
        color: Colors.textLight,
        fontFamily: Fonts.regular,
    },
});
