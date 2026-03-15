import BookLoader from "@/components/ui/BookLoader";
import { Fonts, FontSizes } from "@/constants/fonts";
import {
    Colors,
    RENTAL_STATUS_LABELS,
    Spacing,
    STATUS_COLORS,
} from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/convex/_generated/api";
import { useFadeSlideIn } from "@/hooks/useFadeSlideIn";
import { responsiveFont } from "@/utils/responsiveFont";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
    Animated,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RentalHistoryScreen() {
    const { userId } = useAuth();
    const history = useQuery(api.rentals.getRentalHistory, userId ? { userId } : "skip");
    const { fadeAnim, slideAnim } = useFadeSlideIn();

    const [expandedRentalId, setExpandedRentalId] = useState<string | null>(null);

    if (history === undefined) {
        return (
            <View style={styles.center}>
                <BookLoader label="Loading history..." />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
            <Animated.View
                style={[
                    styles.header,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                <Text style={styles.title}>Rental History</Text>
                <Text style={styles.subtitle}>Past completed rentals</Text>
            </Animated.View>

            <FlatList
                data={history}
                keyExtractor={(item) => item._id}
                renderItem={({ item, index }) => {
                    const statusLabel = RENTAL_STATUS_LABELS[item.status] || item.status;
                    const statusColor = STATUS_COLORS[item.status] || Colors.textSecondary;
                    const isExpanded = expandedRentalId === item._id;

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
                                {item.coverUrl ? (
                                    <Image source={{ uri: item.coverUrl }} style={styles.coverImage} />
                                ) : (
                                    <View style={[styles.coverImage, styles.coverFallback]}>
                                        <Ionicons name="book-outline" size={22} color={Colors.textLight} />
                                    </View>
                                )}

                                <View style={styles.cardBody}>
                                    <View style={styles.cardTopRow}>
                                        <Text numberOfLines={1} style={styles.cardTitle}>
                                            {item.book?.title || "Unknown Book"}
                                        </Text>
                                        <View style={[styles.statusBadge, { backgroundColor: statusColor + "18" }]}>
                                            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                                            <Text style={[styles.statusText, { color: statusColor }]}>
                                                {statusLabel}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text numberOfLines={1} style={styles.cardAuthor}>
                                        {item.book?.author || "Unknown Author"}
                                    </Text>

                                    <View style={styles.metaRow}>
                                        <View style={styles.metaPill}>
                                            <Ionicons name="calendar-outline" size={12} color={Colors.textSecondary} />
                                            <Text style={styles.metaPillText}>
                                                {item.pickupDate
                                                    ? item.pickupDate
                                                    : item.deliveryDate || "Date unavailable"}
                                            </Text>
                                        </View>
                                        <View style={styles.metaPill}>
                                            <Ionicons name="location-outline" size={12} color={Colors.textSecondary} />
                                            <Text style={styles.metaPillText}>{item.zone}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.cardFooter}>
                                        <Text style={styles.cardRent}>Rs {item.totalRent ?? 0}</Text>
                                        <TouchableOpacity
                                            style={styles.detailsButton}
                                            onPress={() =>
                                                setExpandedRentalId((current) =>
                                                    current === item._id ? null : item._id
                                                )
                                            }
                                            activeOpacity={0.85}
                                        >
                                            <Text style={styles.detailsButtonText}>
                                                {isExpanded ? "Hide Details" : "View Details"}
                                            </Text>
                                            <Ionicons
                                                name={isExpanded ? "chevron-up" : "chevron-down"}
                                                size={14}
                                                color={Colors.white}
                                            />
                                        </TouchableOpacity>
                                    </View>

                                    {isExpanded ? (
                                        <View style={styles.detailsSection}>
                                            <View style={styles.detailsHeaderRow}>
                                                <Text style={styles.detailsTitle}>Rental Breakdown</Text>
                                                <View style={styles.detailsTag}>
                                                    <Text style={styles.detailsTagText}>{statusLabel}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.detailsGrid}>
                                                <DetailTile label="Book" value={item.book?.title || "Unknown Book"} />
                                                <DetailTile label="Author" value={item.book?.author || "Unknown Author"} />
                                                <DetailTile label="Zone" value={item.zone} />
                                                <DetailTile label="Delivery" value={item.deliveryDate || "-"} />
                                                <DetailTile label="Delivery Time" value={item.deliveryTime || "-"} />
                                                <DetailTile label="Pickup" value={item.pickupDate || "-"} />
                                                <DetailTile label="Pickup Time" value={item.pickupTime || "-"} />
                                                <DetailTile label="Rate Per Day" value={`Rs ${item.rentPerDay}`} />
                                                <DetailTile label="Total Rent" value={`Rs ${item.totalRent ?? 0}`} highlight />
                                                <DetailTile label="Late Fee" value={`Rs ${item.lateFee ?? 0}`} />
                                            </View>
                                        </View>
                                    ) : null}
                                </View>
                            </View>
                        </Animated.View>
                    );
                }}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons
                            name="time-outline"
                            size={48}
                            color={Colors.textLight}
                            style={{ marginBottom: Spacing.md }}
                        />
                        <Text style={styles.emptyText}>No rental history yet</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

type DetailRowProps = {
    label: string;
    value: string;
    highlight?: boolean;
};

function getDetailIcon(label: string) {
    switch (label) {
        case "Book":
            return "book-outline";
        case "Author":
            return "person-outline";
        case "Status":
            return "flag-outline";
        case "Zone":
            return "location-outline";
        case "Delivery":
        case "Pickup":
            return "calendar-outline";
        case "Delivery Time":
        case "Pickup Time":
            return "time-outline";
        default:
            return "wallet-outline";
    }
}

function DetailTile({ label, value, highlight = false }: DetailRowProps) {
    return (
        <View style={[styles.detailTile, highlight && styles.detailTileHighlight]}>
            <View style={styles.detailTop}>
                <View style={[styles.detailIconWrap, highlight && styles.detailIconWrapHighlight]}>
                    <Ionicons
                        name={getDetailIcon(label)}
                        size={12}
                        color={highlight ? Colors.white : Colors.primary}
                    />
                </View>
                <Text style={styles.detailLabel}>{label}</Text>
            </View>
            <Text numberOfLines={2} style={[styles.detailValue, highlight && styles.detailValueHighlight]}>
                {value}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.background,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md,
    },
    title: {
        fontSize: responsiveFont(24),
        color: Colors.text,
        fontFamily: Fonts.bold,
    },
    subtitle: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        marginTop: 4,
        fontFamily: Fonts.regular,
    },
    list: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingBottom: Spacing.sm,
    },
    compactCard: {
        backgroundColor: Colors.white,
        borderRadius: 18,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        flexDirection: "row",
        gap: Spacing.sm,
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
    empty: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingVertical: 56,
    },
    emptyText: {
        fontSize: FontSizes.subtitle,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
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
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.xs,
        marginTop: Spacing.xs,
    },
    detailTile: {
        width: "48.8%",
        backgroundColor: Colors.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 10,
        minHeight: 72,
        justifyContent: "space-between",
    },
    detailTileHighlight: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    detailTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 6,
    },
    detailIconWrap: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: Colors.primaryLight,
        alignItems: "center",
        justifyContent: "center",
    },
    detailIconWrapHighlight: {
        backgroundColor: Colors.white + "30",
    },
    detailLabel: {
        fontSize: FontSizes.tiny,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
    },
    detailValue: {
        fontSize: FontSizes.small,
        color: Colors.text,
        fontFamily: Fonts.medium,
        lineHeight: 17,
    },
    detailValueHighlight: {
        color: Colors.white,
        fontFamily: Fonts.bold,
    },
});
