import { Fonts, FontSizes } from "@/constants/fonts";
import {
    Colors,
    RENTAL_STATUS_LABELS,
    Spacing,
    STATUS_COLORS,
} from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface RentalCardProps {
    bookTitle: string;
    bookAuthor: string;
    status: string;
    coverUrl?: string | null;
    deliveryDate?: string;
    deliveryTime?: string;
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
    coverUrl,
    deliveryDate,
    deliveryTime,
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
            <LinearGradient
                pointerEvents="none"
                colors={["#FFFFFF", `${Colors.primary}0D`, Colors.primaryLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.cardMainRow}>
                {coverUrl ? (
                    <Image source={{ uri: coverUrl }} style={styles.coverImage} />
                ) : (
                    <View style={[styles.coverImage, styles.coverFallback]}>
                        <Ionicons name="book-outline" size={22} color={Colors.textLight} />
                    </View>
                )}

                <View style={styles.cardBody}>
                    <View style={styles.cardTopRow}>
                        <Text numberOfLines={1} style={styles.cardTitle}>
                            {bookTitle}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + "18" }]}>
                            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                            <Text style={[styles.statusText, { color: statusColor }]}>
                                {statusLabel}
                            </Text>
                        </View>
                    </View>

                    <Text numberOfLines={1} style={styles.cardAuthor}>
                        {bookAuthor}
                    </Text>

                    <View style={styles.metaRow}>
                        <View style={styles.metaPill}>
                            <Ionicons name="location-outline" size={12} color={Colors.textSecondary} />
                            <Text style={styles.metaPillText}>{zone}</Text>
                        </View>
                        {deliveryDate && (
                            <View style={styles.metaPill}>
                                <Ionicons name="calendar-outline" size={12} color={Colors.textSecondary} />
                                <Text style={styles.metaPillText}>{deliveryDate}</Text>
                            </View>
                        )}
                        {pickupDate && (
                            <View style={styles.metaPill}>
                                <Ionicons name="calendar-outline" size={12} color={Colors.textSecondary} />
                                <Text style={styles.metaPillText}>{pickupDate}</Text>
                            </View>
                        )}
                    </View>

                    {deliveryTime && status === "delivery_scheduled" && (
                        <View style={styles.timeRow}>
                            <Ionicons name="time-outline" size={12} color={Colors.primary} />
                            <Text style={styles.timeText}>Estimated: {deliveryTime}</Text>
                        </View>
                    )}

                    {status === "delivery_scheduled" && (
                        <View style={styles.disclaimerBox}>
                            <Ionicons name="information-circle-outline" size={12} color={Colors.textSecondary} />
                            <Text style={styles.disclaimerText}>
                                Delivery time may vary based on availability.
                            </Text>
                        </View>
                    )}

                    {status === "delivered" && deliveryDate && (
                        <View style={styles.timerContainer}>
                            <View style={styles.timerHeader}>
                                <Ionicons name="stopwatch-outline" size={14} color={Colors.primaryDark} />
                                <Text style={styles.timerLabel}>Live Timer</Text>
                            </View>
                            <View style={styles.timerValues}>
                                <Text style={styles.timerDays}>{currentDays}d</Text>
                                <Text style={styles.timerRent}>₹{currentRent}</Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.cardFooter}>
                        <Text style={styles.cardRate}>₹{rentPerDay}/day</Text>
                        {totalRent !== undefined && totalRent > 0 && (
                            <Text style={styles.totalRent}>Total: ₹{totalRent}</Text>
                        )}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,
        borderRadius: 22,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        minHeight: 122,
        borderWidth: 1,
        borderColor: "rgba(117,64,67,0.10)",
        overflow: "hidden",
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    cardMainRow: {
        flexDirection: "row",
        gap: Spacing.sm,
    },
    coverImage: {
        width: 72,
        height: 104,
        borderRadius: 14,
        backgroundColor: Colors.border,
    },
    coverFallback: {
        justifyContent: "center",
        alignItems: "center",
    },
    cardBody: {
        flex: 1,
        justifyContent: "space-between",
        gap: 4,
    },
    cardTopRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: Spacing.xs,
    },
    cardTitle: {
        flex: 1,
        fontSize: FontSizes.subtitle,
        color: Colors.text,
        fontFamily: Fonts.bold,
        marginTop: 1,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.bold,
    },
    cardAuthor: {
        fontSize: FontSizes.small,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
    },
    metaRow: {
        flexDirection: "row",
        gap: Spacing.xs,
        flexWrap: "wrap",
        marginTop: 2,
    },
    metaPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: Colors.background,
    },
    metaPillText: {
        fontSize: FontSizes.tiny,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
    },
    timeRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 2,
    },
    timeText: {
        fontSize: FontSizes.tiny,
        color: Colors.primary,
        fontFamily: Fonts.bold,
    },
    disclaimerBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(117,64,67,0.05)",
        padding: 6,
        borderRadius: 8,
        marginTop: 4,
        gap: 4,
    },
    disclaimerText: {
        fontSize: 10,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
        flex: 1,
    },
    timerContainer: {
        backgroundColor: Colors.primaryLight,
        borderRadius: 10,
        padding: 8,
        marginTop: 6,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    timerHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    timerLabel: {
        fontSize: 10,
        fontFamily: Fonts.bold,
        color: Colors.primaryDark,
    },
    timerValues: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    timerDays: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    timerRent: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
    cardFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 4,
    },
    cardRate: {
        fontSize: FontSizes.caption,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
    },
    totalRent: {
        fontSize: FontSizes.body,
        color: Colors.primary,
        fontFamily: Fonts.bold,
    },
});

