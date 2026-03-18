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
import { useFadeSlideIn } from "@/hooks";
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
        <View style={styles.detailTile}>
            <View style={styles.detailTop}>
                <View style={[styles.detailIconWrap, highlight && styles.detailIconWrapHighlight]}>
                    <Ionicons
                        name={getDetailIcon(label)}
                        size={12}
                        color={highlight ? Colors.primary : Colors.white}
                    />
                </View>
                <Text
                    style={[styles.detailLabel, highlight && styles.detailLabelHighlight]}
                    allowFontScaling={false}
                >
                    {label}
                </Text>
            </View>
            <Text
                numberOfLines={2}
                style={[styles.detailValue, highlight && styles.detailValueHighlight]}
                allowFontScaling={false}
            >
                {value}
            </Text>
        </View>
    );
}

export default function RentalHistoryScreen() {
    const { userId } = useAuth();
    const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "returned">("all");
    const [timeframeFilter, setTimeframeFilter] = useState<
        "all" | "last_30_days" | "this_month" | "this_year"
    >("all");
    const [showFilters, setShowFilters] = useState(false);
    const history = useQuery(
        api.rentals.getRentalHistory,
        userId
            ? { userId, status: statusFilter, timeframe: timeframeFilter }
            : "skip"
    );
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
                <View style={styles.headerTopRow}>
                    <View style={styles.headerTextWrap}>
                        <Text style={styles.title} allowFontScaling={false}>
                            Rental History
                        </Text>
                        <Text style={styles.subtitle} allowFontScaling={false}>
                            Past completed rentals
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => setShowFilters((current) => !current)}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="filter-outline" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                </View>
                {showFilters ? (
                    <View style={styles.filterPanel}>
                        <Text style={styles.filterSectionTitle} allowFontScaling={false}>
                            Status
                        </Text>
                        <View style={styles.filterRow}>
                            {[
                                { label: "All Orders", value: "all" },
                                { label: "Paid", value: "paid" },
                                { label: "Returned", value: "returned" },
                            ].map((option) => {
                                const isActive = statusFilter === option.value;

                                return (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[
                                            styles.filterChip,
                                            styles.filterChipThird,
                                            isActive && styles.filterChipActive,
                                        ]}
                                        onPress={() =>
                                            setStatusFilter(option.value as "all" | "paid" | "returned")
                                        }
                                        activeOpacity={0.85}
                                    >
                                        <Text
                                            style={[
                                                styles.filterChipText,
                                                isActive && styles.filterChipTextActive,
                                            ]}
                                            allowFontScaling={false}
                                            numberOfLines={1}
                                            adjustsFontSizeToFit
                                            minimumFontScale={0.8}
                                        >
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={styles.filterSectionTitle} allowFontScaling={false}>
                            Time
                        </Text>
                        <View style={styles.filterRow}>
                            {[
                                { label: "All Time", value: "all" },
                                { label: "Last 30 Days", value: "last_30_days" },
                                { label: "This Month", value: "this_month" },
                                { label: "This Year", value: "this_year" },
                            ].map((option) => {
                                const isActive = timeframeFilter === option.value;

                                return (
                                    <TouchableOpacity
                                        key={option.value}
                                        style={[
                                            styles.filterChip,
                                            styles.filterChipHalf,
                                            isActive && styles.filterChipActive,
                                        ]}
                                        onPress={() =>
                                            setTimeframeFilter(
                                                option.value as
                                                    | "all"
                                                    | "last_30_days"
                                                    | "this_month"
                                                    | "this_year"
                                            )
                                        }
                                        activeOpacity={0.85}
                                    >
                                        <Text
                                            style={[
                                                styles.filterChipText,
                                                isActive && styles.filterChipTextActive,
                                            ]}
                                            allowFontScaling={false}
                                            numberOfLines={1}
                                            adjustsFontSizeToFit
                                            minimumFontScale={0.8}
                                        >
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ) : null}
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
                                            <TouchableOpacity
                                                style={styles.detailsButton}
                                                onPress={() =>
                                                    setExpandedRentalId((current) =>
                                                        current === item._id ? null : item._id
                                                    )
                                                }
                                                activeOpacity={0.85}
                                            >
                                                <Text style={styles.detailsButtonText} allowFontScaling={false}>
                                                    {isExpanded ? "Hide Details" : "View Details"}
                                                </Text>
                                                <Ionicons
                                                    name={isExpanded ? "chevron-up" : "chevron-down"}
                                                    size={14}
                                                    color={Colors.white}
                                                />
                                            </TouchableOpacity>
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
                                            <DetailTile label="Book" value={item.book?.title || "Unknown Book"} />
                                            <DetailTile label="Author" value={item.book?.author || "Unknown Author"} />
                                            <DetailTile label="Zone" value={item.zone} />
                                            <DetailTile label="Delivery" value={item.deliveryDate || "-"} />
                                            <DetailTile label="Delivery Time" value={item.deliveryTime || "-"} />
                                            <DetailTile label="Pickup" value={item.pickupDate || "-"} />
                                            <DetailTile label="Pickup Time" value={item.pickupTime || "-"} />
                                            <DetailTile label="Rate Per Day" value={`₹ ${item.rentPerDay}`} />
                                            <DetailTile label="Total Rent" value={`₹ ${item.totalRent ?? 0}`} highlight />
                                            <DetailTile label="Late Fee" value={`₹ ${item.lateFee ?? 0}`} />
                                        </View>
                                    </View>
                                ) : null}
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
                        <Text style={styles.emptyText} allowFontScaling={false}>
                            No rental history yet
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
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
    headerTopRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headerTextWrap: {
        flex: 1,
        marginRight: Spacing.sm,
    },
    title: {
        fontSize: 24,
        color: Colors.text,
        fontFamily: Fonts.bold,
    },
    subtitle: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        marginTop: 4,
        fontFamily: Fonts.regular,
    },
    filterButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterPanel: {
        marginTop: Spacing.sm,
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterSectionTitle: {
        fontSize: FontSizes.caption,
        color: Colors.textSecondary,
        fontFamily: Fonts.bold,
        marginBottom: 8,
    },
    filterRow: {
        flexDirection: "row",
        flexWrap: "nowrap",
        gap: 6,
        marginBottom: Spacing.sm,
    },
    filterChip: {
        flex: 1,
        minHeight: 38,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    filterChipThird: {
        paddingHorizontal: 6,
    },
    filterChipHalf: {
        paddingHorizontal: 6,
    },
    filterChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterChipText: {
        fontSize: FontSizes.tiny,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
        textAlign: "center",
    },
    filterChipTextActive: {
        color: Colors.white,
    },
    list: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingBottom: 90,
    },
    compactCard: {
        backgroundColor: Colors.white,
        borderRadius: 18,
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
        marginTop: Spacing.xs,
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        rowGap: 12,
    },
    detailTile: {
        width: "48%",
    },
    detailTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 6,
    },
    detailIconWrap: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    detailIconWrapHighlight: {
        backgroundColor: Colors.primaryLight,
    },
    detailLabel: {
        fontSize: FontSizes.small,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
    },
    detailLabelHighlight: {
        color: Colors.primary,
    },
    detailValue: {
        fontSize: FontSizes.small,
        color: Colors.text,
        fontFamily: Fonts.medium,
        lineHeight: 17,
        paddingLeft: 26,
    },
    detailValueHighlight: {
        color: Colors.primary,
        fontFamily: Fonts.bold,
    },
});
