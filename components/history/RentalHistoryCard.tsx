import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, RENTAL_STATUS_LABELS, Spacing, STATUS_COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { AnimatedPressable } from "../ui/core/AnimatedPressable";
import { HistoryDetailTile } from "./HistoryDetailTile";

type RentalItem = {
    _id: string;
    status: string;
    coverUrl?: string;
    book?: {
        title: string;
        author: string;
    };
    pickupDate?: string;
    deliveryDate?: string;
    deliveryTime?: string;
    pickupTime?: string;
    zone: string;
    totalRent?: number;
    rentPerDay?: number;
    lateFee?: number;
};

type RentalHistoryCardProps = {
    item: RentalItem;
    index: number;
    isExpanded: boolean;
    onToggleExpand: (id: string) => void;
    fadeAnim: Animated.Value;
    slideAnim: Animated.AnimatedInterpolation<number>;
};

export function RentalHistoryCard({
    item,
    index,
    isExpanded,
    onToggleExpand,
    fadeAnim,
    slideAnim,
}: RentalHistoryCardProps) {
    const statusLabel = RENTAL_STATUS_LABELS[item.status as keyof typeof RENTAL_STATUS_LABELS] || item.status;
    const statusColor = STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || Colors.textSecondary;

    return (
        <Animated.View
            style={{
                opacity: fadeAnim,
                transform: [
                    {
                        translateY: slideAnim.interpolate({
                            inputRange: [0, 30],
                            outputRange: [0, 20 + index * 4],
                        }),
                    },
                ],
            }}
        >
            <View style={styles.compactCard}>
                <LinearGradient
                    pointerEvents="none"
                    colors={["#FFFFFF", `${Colors.primary}0D`, Colors.primaryLight]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                />

                <View style={styles.cardMainRow}>
                    {item.coverUrl ? (
                        <Image source={{ uri: item.coverUrl }} style={styles.coverImage} />
                    ) : (
                        <View style={[styles.coverImage, styles.coverFallback]}>
                            <Ionicons name="book-outline" size={22} color={Colors.textLight} />
                        </View>
                    )}

                    <View style={styles.cardBody}>
                        <View style={styles.cardTopRow}>
                            <Text numberOfLines={1} style={styles.cardTitle} allowFontScaling={false}>
                                {item.book?.title || "Unknown Book"}
                            </Text>
                            <View style={[styles.statusBadge, { backgroundColor: statusColor + "18" }]}>
                                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                                <Text style={[styles.statusText, { color: statusColor }]} allowFontScaling={false}>
                                    {statusLabel}
                                </Text>
                            </View>
                        </View>

                        <Text numberOfLines={1} style={styles.cardAuthor} allowFontScaling={false}>
                            {item.book?.author || "Unknown Author"}
                        </Text>

                        <View style={styles.metaRow}>
                            <View style={styles.metaPill}>
                                <Ionicons name="calendar-outline" size={12} color={Colors.textSecondary} />
                                <Text style={styles.metaPillText} allowFontScaling={false}>
                                    {item.pickupDate
                                        ? item.pickupDate
                                        : item.deliveryDate || "Date unavailable"}
                                </Text>
                            </View>
                            <View style={styles.metaPill}>
                                <Ionicons name="location-outline" size={12} color={Colors.textSecondary} />
                                <Text style={styles.metaPillText} allowFontScaling={false}>
                                    {item.zone}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.cardFooter}>
                            <Text style={styles.cardRent} allowFontScaling={false}>
                                ₹ {item.totalRent ?? 0}
                            </Text>
                            <AnimatedPressable
                                style={styles.detailsButton}
                                onPress={() => onToggleExpand(item._id)}
                            >
                                <Text style={styles.detailsButtonText} allowFontScaling={false}>
                                    {isExpanded ? "Hide Details" : "View Details"}
                                </Text>
                                <Ionicons
                                    name={isExpanded ? "chevron-up" : "chevron-down"}
                                    size={14}
                                    color={Colors.white}
                                />
                            </AnimatedPressable>
                        </View>
                    </View>
                </View>

                {isExpanded ? (
                    <View style={styles.detailsSection}>
                        <View style={styles.detailsHeaderRow}>
                            <Text style={styles.detailsTitle} allowFontScaling={false}>
                                Rental Breakdown
                            </Text>
                            <View style={styles.detailsTag}>
                                <Text style={styles.detailsTagText} allowFontScaling={false}>
                                    {statusLabel}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.detailsGrid}>
                            <HistoryDetailTile label="Book" value={item.book?.title || "Unknown Book"} />
                            <HistoryDetailTile label="Author" value={item.book?.author || "Unknown Author"} />
                            <HistoryDetailTile label="Zone" value={item.zone} />
                            <HistoryDetailTile label="Delivery" value={item.deliveryDate || "-"} />
                            <HistoryDetailTile label="Delivery Time" value={item.deliveryTime || "-"} />
                            <HistoryDetailTile label="Pickup" value={item.pickupDate || "-"} />
                            <HistoryDetailTile label="Pickup Time" value={item.pickupTime || "-"} />
                            <HistoryDetailTile label="Rate Per Day" value={`₹ ${item.rentPerDay}`} />
                            <HistoryDetailTile label="Total Rent" value={`₹ ${item.totalRent ?? 0}`} highlight />
                            <HistoryDetailTile label="Late Fee" value={`₹ ${item.lateFee ?? 0}`} />
                        </View>
                    </View>
                ) : null}
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    compactCard: {
        backgroundColor: Colors.white,
        borderRadius: 18,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        minHeight: 122,
        borderWidth: 1,
        borderColor: "rgba(117,64,67,0.10)",
        overflow: "hidden",
    },
    cardMainRow: {
        flexDirection: "row",
        gap: Spacing.sm,
    },
    coverImage: {
        width: 68,
        height: 98,
        borderRadius: 12,
        backgroundColor: Colors.border,
    },
    coverFallback: {
        justifyContent: "center",
        alignItems: "center",
    },
    cardBody: {
        flex: 1,
        justifyContent: "space-between",
        gap: 6,
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
        marginTop: 2,
    },
    metaRow: {
        flexDirection: "row",
        gap: Spacing.xs,
        flexWrap: "wrap",
        marginTop: 4,
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
    cardFooter: {
        marginTop: Spacing.xs,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    cardRent: {
        fontSize: FontSizes.body,
        color: Colors.primary,
        fontFamily: Fonts.bold,
    },
    detailsButton: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: Colors.primary,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    detailsButtonText: {
        color: Colors.white,
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
    },
    detailsSection: {
        marginTop: Spacing.sm,
        paddingTop: Spacing.sm + 2,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    detailsHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: Spacing.xs,
    },
    detailsTitle: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.bold,
        color: Colors.text,
        letterSpacing: 0.2,
    },
    detailsTag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: Colors.primaryLight,
    },
    detailsTagText: {
        fontSize: FontSizes.tiny,
        color: Colors.primaryDark,
        fontFamily: Fonts.bold,
    },
    detailsGrid: {
        marginTop: Spacing.xs,
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        rowGap: 12,
    },
});
