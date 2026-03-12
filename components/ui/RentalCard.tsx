import {
    Colors,
    RENTAL_STATUS_LABELS,
    Spacing,
    STATUS_COLORS,
} from "@/constants/theme";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface RentalCardProps {
    bookTitle: string;
    bookAuthor: string;
    status: string;
    deliveryDate?: string;
    pickupDate?: string;
    rentPerDay: number;
    totalRent?: number;
    zone: string;
    onPress?: () => void;
}

export default function RentalCard({
    bookTitle,
    bookAuthor,
    status,
    deliveryDate,
    pickupDate,
    rentPerDay,
    totalRent,
    zone,
    onPress,
}: RentalCardProps) {
    const [currentDays, setCurrentDays] = useState(0);
    const [currentRent, setCurrentRent] = useState(0);

    // Live rent timer for delivered status
    useEffect(() => {
        if (status === "delivered" && deliveryDate) {
            const updateTimer = () => {
                const delivery = new Date(deliveryDate);
                const now = new Date();
                const diffMs = now.getTime() - delivery.getTime();
                const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                setCurrentDays(days);
                setCurrentRent(days * rentPerDay);
            };

            updateTimer();
            const interval = setInterval(updateTimer, 60000); // Update every minute
            return () => clearInterval(interval);
        }
    }, [status, deliveryDate, rentPerDay]);

    const statusColor = STATUS_COLORS[status] || Colors.textSecondary;
    const statusLabel = RENTAL_STATUS_LABELS[status] || status;

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.85}
            disabled={!onPress}
        >
            <View style={styles.header}>
                <View style={styles.bookInfo}>
                    <Text style={styles.title} numberOfLines={1}>
                        {bookTitle}
                    </Text>
                    <Text style={styles.author}>{bookAuthor}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: statusColor + "20" }]}>
                    <Text style={[styles.badgeText, { color: statusColor }]}>
                        {statusLabel}
                    </Text>
                </View>
            </View>

            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Zone</Text>
                    <Text style={styles.detailValue}>{zone}</Text>
                </View>
                {deliveryDate && (
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Delivery</Text>
                        <Text style={styles.detailValue}>{deliveryDate}</Text>
                    </View>
                )}
                {pickupDate && (
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Pickup</Text>
                        <Text style={styles.detailValue}>{pickupDate}</Text>
                    </View>
                )}
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Rate</Text>
                    <Text style={styles.detailValue}>₹{rentPerDay}/day</Text>
                </View>

                {/* Live timer for delivered books */}
                {status === "delivered" && deliveryDate && (
                    <View style={styles.timerContainer}>
                        <Text style={styles.timerLabel}>📍 Live Timer</Text>
                        <Text style={styles.timerDays}>{currentDays} days</Text>
                        <Text style={styles.timerRent}>₹{currentRent}</Text>
                    </View>
                )}

                {totalRent !== undefined && totalRent > 0 && (
                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, styles.totalLabel]}>
                            Total Rent
                        </Text>
                        <Text style={[styles.detailValue, styles.totalValue]}>
                            ₹{totalRent}
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: Spacing.sm,
    },
    bookInfo: {
        flex: 1,
        marginRight: Spacing.sm,
    },
    title: {
        fontSize: 16,
        fontWeight: "700",
        color: Colors.text,
    },
    author: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: "700",
    },
    details: {
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingTop: Spacing.sm,
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
    },
    detailLabel: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    detailValue: {
        fontSize: 13,
        fontWeight: "600",
        color: Colors.text,
    },
    totalLabel: {
        fontWeight: "600",
        color: Colors.text,
    },
    totalValue: {
        color: Colors.primary,
        fontWeight: "700",
        fontSize: 15,
    },
    timerContainer: {
        backgroundColor: Colors.primaryLight,
        borderRadius: 10,
        padding: Spacing.sm,
        marginVertical: Spacing.xs,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
    },
    timerLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.primaryDark,
    },
    timerDays: {
        fontSize: 14,
        fontWeight: "700",
        color: Colors.text,
    },
    timerRent: {
        fontSize: 16,
        fontWeight: "700",
        color: Colors.primary,
    },
});
