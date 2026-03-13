import {
    Colors,
    RENTAL_STATUS_LABELS,
    Spacing,
    STATUS_COLORS,
} from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Fonts, FontSizes } from "@/constants/fonts";

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
            const interval = setInterval(updateTimer, 60000);
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
                {deliveryDate ? (
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Delivery</Text>
                        <Text style={styles.detailValue}>{deliveryDate}</Text>
                    </View>
                ) : null}
                {pickupDate ? (
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Pickup</Text>
                        <Text style={styles.detailValue}>{pickupDate}</Text>
                    </View>
                ) : null}
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Rate</Text>
                    <Text style={styles.detailValue}>₹{rentPerDay}/day</Text>
                </View>

                {status === "delivered" && deliveryDate ? (
                    <View style={styles.timerContainer}>
                        <View style={styles.timerHeader}>
                            <Ionicons
                                name="stopwatch-outline"
                                size={14}
                                color={Colors.primaryDark}
                            />
                            <Text style={styles.timerLabel}>Live Timer</Text>
                        </View>
                        <Text style={styles.timerDays}>{currentDays} days</Text>
                        <Text style={styles.timerRent}>₹{currentRent}</Text>
                    </View>
                ) : null}

                {totalRent !== undefined && totalRent > 0 ? (
                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, styles.totalLabel]}>
                            Total Rent
                        </Text>
                        <Text style={[styles.detailValue, styles.totalValue]}>
                            ₹{totalRent}
                        </Text>
                    </View>
                ) : null}
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
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    author: {
        fontSize: FontSizes.small,
        color: Colors.textSecondary,
        marginTop: 2,
        fontFamily: Fonts.regular,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
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
        fontSize: FontSizes.small,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
    },
    detailValue: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.medium,
        color: Colors.text,
    },
    totalLabel: {
        fontFamily: Fonts.medium,
        color: Colors.text,
    },
    totalValue: {
        color: Colors.primary,
        fontFamily: Fonts.bold,
        fontSize: FontSizes.bodyLarge,
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
    timerHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    timerLabel: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: Colors.primaryDark,
    },
    timerDays: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    timerRent: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
});
