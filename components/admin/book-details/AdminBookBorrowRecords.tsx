import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, RENTAL_STATUS_LABELS, Spacing, STATUS_COLORS } from "@/constants/theme";
import BookLoader from "@/components/ui/feedback/BookLoader";
import { Id } from "@/convex/_generated/dataModel";

interface AdminBookBorrowRecordsProps {
    bookRentals: {
        _id: Id<"rentals">;
        userName: string;
        userEmail: string;
        status: string;
        deliveryDate?: string;
        pickupDate?: string;
        createdAt: number;
    }[] | undefined;
    rentalsLimit: number;
    onLoadMore: () => void;
}

export default function AdminBookBorrowRecords({
    bookRentals,
    rentalsLimit,
    onLoadMore,
}: AdminBookBorrowRecordsProps) {
    return (
        <View>
            {/* Header */}
            <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                    <Ionicons name="people" size={16} color={Colors.primary} />
                    <Text style={styles.headerTitle}>Borrow Records</Text>
                </View>
                {bookRentals && (
                    <View style={styles.countBadge}>
                        <Text style={styles.countBadgeText}>{bookRentals.length}</Text>
                    </View>
                )}
            </View>

            {bookRentals === undefined ? (
                <View style={styles.loadingContainer}>
                    <BookLoader label="Loading records..." />
                </View>
            ) : bookRentals.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconCircle}>
                        <Ionicons name="document-text-outline" size={28} color={Colors.primary} />
                    </View>
                    <Text style={styles.emptyText}>No borrow records yet</Text>
                </View>
            ) : (
                <View style={styles.recordsList}>
                    {bookRentals.map((rental) => {
                        const statusLabel = RENTAL_STATUS_LABELS[rental.status as keyof typeof RENTAL_STATUS_LABELS] ?? rental.status;
                        const statusColor = STATUS_COLORS[rental.status as keyof typeof STATUS_COLORS] ?? Colors.textSecondary;

                        return (
                            <View key={rental._id} style={styles.recordRow}>
                                <View style={styles.recordAvatarCircle}>
                                    <Text style={styles.recordAvatarText}>
                                        {rental.userName?.charAt(0)?.toUpperCase() || "?"}
                                    </Text>
                                </View>
                                <View style={styles.recordInfo}>
                                    <Text style={styles.recordName} numberOfLines={1}>{rental.userName}</Text>
                                    <Text style={styles.recordDate}>
                                        {rental.deliveryDate
                                            ? `Borrowed: ${rental.deliveryDate}`
                                            : `Requested: ${new Date(rental.createdAt).toLocaleDateString()}`}
                                    </Text>
                                </View>
                                <View style={[styles.recordStatusBadge, { backgroundColor: statusColor + "15" }]}>
                                    <Text style={[styles.recordStatusText, { color: statusColor }]}>
                                        {statusLabel}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                    {bookRentals.length === rentalsLimit && (
                        <TouchableOpacity style={styles.loadMoreBtn} onPress={onLoadMore} activeOpacity={0.8}>
                            <Text style={styles.loadMoreText}>Load More Records</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.04)",
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    headerTitle: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.text,
        letterSpacing: 0.2,
    },
    countBadge: {
        backgroundColor: Colors.primary + "15",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    countBadgeText: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
    loadingContainer: {
        paddingVertical: Spacing.lg,
        alignItems: "center",
    },
    emptyContainer: {
        alignItems: "center",
        paddingVertical: Spacing.lg,
        gap: 8,
    },
    emptyIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primary + "12",
        alignItems: "center",
        justifyContent: "center",
    },
    emptyText: {
        fontSize: FontSizes.caption,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
    },
    recordsList: {
        gap: 8,
    },
    recordRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.02)",
        borderRadius: 12,
        padding: 10,
        gap: 10,
    },
    recordAvatarCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primary + "15",
        alignItems: "center",
        justifyContent: "center",
    },
    recordAvatarText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
    recordInfo: {
        flex: 1,
    },
    recordName: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 1,
    },
    recordDate: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
    },
    recordStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    recordStatusText: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.bold,
    },
    loadMoreBtn: {
        paddingVertical: 10,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 4,
        borderRadius: 12,
        backgroundColor: Colors.primary + "12",
    },
    loadMoreText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
});
