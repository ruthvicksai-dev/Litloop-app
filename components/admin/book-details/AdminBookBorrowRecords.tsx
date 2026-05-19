import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, RENTAL_STATUS_LABELS, Spacing, STATUS_COLORS } from "@/constants/theme";
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
        <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
                <Ionicons name="people-outline" size={20} color={Colors.primary} />
                <Text style={styles.sectionLabel}>Borrow Records</Text>
                {bookRentals && (
                    <Text style={styles.recordCount}>{bookRentals.length}</Text>
                )}
            </View>

            {bookRentals === undefined ? (
                <View style={styles.recordsLoading}>
                    <BookLoader label="Loading records..." />
                </View>
            ) : bookRentals.length === 0 ? (
                <View style={styles.emptyRecords}>
                    <Ionicons name="document-text-outline" size={36} color={Colors.textLight} />
                    <Text style={styles.emptyRecordsText}>No borrow records yet</Text>
                </View>
            ) : (
                <View style={styles.recordsList}>
                    {bookRentals.map((rental) => {
                        const statusLabel = RENTAL_STATUS_LABELS[rental.status as keyof typeof RENTAL_STATUS_LABELS] ?? rental.status;
                        const statusColor = STATUS_COLORS[rental.status as keyof typeof STATUS_COLORS] ?? Colors.textSecondary;

                        return (
                            <View key={rental._id} style={styles.recordRow}>
                                <View style={styles.recordInfo}>
                                    <Text style={styles.recordName} numberOfLines={1}>{rental.userName}</Text>
                                    <Text style={styles.recordDate}>
                                        {rental.deliveryDate
                                            ? `Borrowed: ${rental.deliveryDate}`
                                            : `Requested: ${new Date(rental.createdAt).toLocaleDateString()}`}
                                    </Text>
                                    {rental.pickupDate && (
                                        <Text style={styles.recordDate}>Return: {rental.pickupDate}</Text>
                                    )}
                                </View>
                                <View style={[styles.recordStatusBadge, { backgroundColor: statusColor + "18" }]}>
                                    <Text style={[styles.recordStatusText, { color: statusColor }]}>
                                        {statusLabel}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                    {bookRentals.length === rentalsLimit && (
                        <TouchableOpacity style={styles.loadMoreBtn} onPress={onLoadMore} activeOpacity={0.8}>
                            <Text style={styles.loadMoreText}>Load More</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    sectionCard: {
        paddingTop: Spacing.xs,
        paddingBottom: Spacing.md,
        paddingHorizontal: Spacing.xs,
        marginBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.05)",
    },
    sectionHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: Spacing.md,
    },
    sectionLabel: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.text,
        flex: 1,
    },
    recordCount: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.bold,
        color: Colors.textSecondary,
        backgroundColor: Colors.background,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
        overflow: "hidden",
    },
    recordsLoading: {
        paddingVertical: Spacing.xl,
        alignItems: "center",
    },
    emptyRecords: {
        alignItems: "center",
        paddingVertical: Spacing.xl,
        gap: Spacing.sm,
    },
    emptyRecordsText: {
        fontSize: FontSizes.body,
        color: Colors.textLight,
        fontFamily: Fonts.regular,
    },
    recordsList: {
        gap: Spacing.sm,
    },
    recordRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "rgba(255, 255, 255, 0.5)",
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.02)",
    },
    recordInfo: {
        flex: 1,
        marginRight: Spacing.sm,
    },
    recordName: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 2,
    },
    recordDate: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        marginTop: 1,
    },
    recordStatusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    recordStatusText: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.bold,
        textTransform: "uppercase",
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
});
