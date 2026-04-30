import { Fonts, FontSizes } from "@/constants/fonts";
import {
    Colors,
    Layout,
    RENTAL_STATUS_LABELS,
    Spacing,
    STATUS_COLORS,
    scale,
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
                        <Ionicons name="book-outline" size={scale(22)} color={Colors.textLight} />
                    </View>
                )}

                <View style={styles.cardBody}>
                    <View style={styles.cardTopRow}>
                        <Text numberOfLines={1} style={styles.cardTitle}>
                            {bookTitle}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + "18" }]}>
                            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                            <Text
                                style={[styles.statusText, { color: statusColor }]}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.8}
                            >
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
                        {deliveryDate ? (
                            <View style={styles.metaPill}>
                                <Ionicons name="calendar-outline" size={12} color={Colors.textSecondary} />
                                <Text style={styles.metaPillText}>{deliveryDate}</Text>
                            </View>
                        ) : null}
                        {pickupDate ? (
                            <View style={styles.metaPill}>
                                <Ionicons name="calendar-outline" size={12} color={Colors.textSecondary} />
                                <Text style={styles.metaPillText}>{pickupDate}</Text>
                            </View>
                        ) : null}
                    </View>

                    {deliveryTime && status === "delivery_scheduled" ? (
                        <View style={styles.timeRow}>
                            <Ionicons name="time-outline" size={12} color={Colors.primary} />
                            <Text style={styles.timeText}>Estimated: {deliveryTime}</Text>
                        </View>
                    ) : null}

                    {status === "delivery_scheduled" ? (
                        <View style={styles.disclaimerBox}>
                            <Ionicons name="information-circle-outline" size={12} color={Colors.textSecondary} />
                            <Text style={styles.disclaimerText}>
                                Delivery time may vary based on availability.
                            </Text>
                        </View>
                    ) : null}

                    <View style={styles.cardFooter}>
                        <Text style={styles.cardRate}>{`\u20B9${rentPerDay} / day`}</Text>
                        {totalRent !== undefined && totalRent > 0 ? (
                            <Text style={styles.totalRent}>{`Total: \u20B9 ${totalRent}`}</Text>
                        ) : null}
                    </View>

                    {status === "delivered" && deliveryDate ? (
                        <View style={styles.timerContainer}>
                            <View style={styles.timerHeader}>
                                <Ionicons name="stopwatch-outline" size={14} color={Colors.primaryDark} />
                                <Text style={styles.timerLabel}>Live Timer</Text>
                            </View>
                            <View style={styles.timerValues}>
                                <Text style={styles.timerDays}>{currentDays}d</Text>
                                <Text style={styles.timerRent}>{`\u20B9 ${currentRent}`}</Text>
                            </View>
                        </View>
                    ) : null}
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,
        borderRadius: Layout.cardRadiusLarge,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        minHeight: scale(122),
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
        width: scale(72),
        height: scale(104),
        borderRadius: scale(14),
        backgroundColor: Colors.border,
    },
    coverFallback: {
        justifyContent: "center",
        alignItems: "center",
    },
    cardBody: {
        flex: 1,
        justifyContent: "space-between",
        gap: Spacing.xs,
        minWidth: 0,
    },
    cardTopRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
    },
    cardTitle: {
        flex: 1,
        fontSize: FontSizes.subtitle,
        color: Colors.text,
        fontFamily: Fonts.bold,
        minWidth: 0,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: scale(4),
        paddingHorizontal: scale(7),
        paddingVertical: scale(2),
        borderRadius: 999,
        borderWidth: 1,
        borderColor: Colors.border,
        width: scale(102),
        minHeight: scale(24),
        flexShrink: 0,
    },
    statusDot: {
        width: scale(6),
        height: scale(6),
        borderRadius: scale(3),
    },
    statusText: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.bold,
        flex: 1,
        textAlign: "center",
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
        marginTop: Spacing.xs / 2,
    },
    metaPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: 999,
        backgroundColor: Colors.background,
        maxWidth: "100%",
    },
    metaPillText: {
        fontSize: FontSizes.tiny,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
        flexShrink: 1,
    },
    timeRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
        marginTop: Spacing.xs / 2,
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
        padding: scale(6),
        borderRadius: scale(8),
        marginTop: Spacing.xs,
        gap: Spacing.xs,
    },
    disclaimerText: {
        fontSize: FontSizes.tiny,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
        flex: 1,
    },
    timerContainer: {
        backgroundColor: Colors.primaryLight,
        borderRadius: scale(10),
        padding: Spacing.sm,
        marginTop: scale(6),
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    timerHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
    },
    timerLabel: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.bold,
        color: Colors.primaryDark,
    },
    timerValues: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
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
        marginTop: Spacing.xs,
        gap: Spacing.sm,
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
        textAlign: "right",
    },
});
