import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, RENTAL_STATUS_LABELS, STATUS_COLORS, scale } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

type AdminRentalCardProps = {
    item: any;
    onScheduleDelivery: () => void;
    onVerifyPayment: () => void;
    onMarkDelivered: () => void;
    onMarkReturned: () => void;
};

export default function AdminRentalCard({
    item,
    onScheduleDelivery,
    onVerifyPayment,
    onMarkDelivered,
    onMarkReturned,
}: AdminRentalCardProps) {
    const router = useRouter();
    const statusColor = STATUS_COLORS[item.status] || Colors.textSecondary;
    const coverUri = item.coverUrl || item.coverUrls?.[0] || null;

    return (
        <View style={styles.rentalCard}>
            <TouchableOpacity
                style={styles.rentalTop}
                onPress={() => router.push({
                    pathname: "/(admin)/rental/[id]",
                    params: { id: item._id }
                } as any)}
                activeOpacity={0.7}
            >
                <View style={styles.coverWrap}>
                    {coverUri ? (
                        <Image
                            source={{ uri: coverUri }}
                            style={styles.cover}
                        />
                    ) : (
                        <View style={[styles.cover, styles.coverPlaceholder]}>
                            <Ionicons
                                name="book-outline"
                                size={28}
                                color={Colors.primary}
                            />
                        </View>
                    )}
                </View>
                <View style={styles.rentalInfo}>
                    <View style={styles.headerRow}>
                        <Text style={styles.rentalTitle} numberOfLines={1}>
                            {item.book?.title || "Unknown"}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + "18" }]}>
                            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                            <Text
                                style={[styles.statusText, { color: statusColor }]}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.8}
                            >
                                {RENTAL_STATUS_LABELS[item.status]}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.subInfo}>
                        <Ionicons
                            name="person-outline"
                            size={14}
                            color={Colors.textSecondary}
                        />
                        <Text style={styles.rentalUser}>
                            {item.user?.name || "Unknown"}
                        </Text>
                    </View>

                    <View style={styles.subInfo}>
                        <Ionicons
                            name="call-outline"
                            size={14}
                            color={Colors.textSecondary}
                        />
                        <Text style={styles.rentalUser}>{item.user?.phone}</Text>
                    </View>

                    <View style={styles.subInfo}>
                        <Ionicons
                            name="location-outline"
                            size={14}
                            color={Colors.primary}
                        />
                        <Text style={[styles.rentalLocation, { color: Colors.primary, fontFamily: Fonts.bold }]}>
                            {item.zone}
                        </Text>
                    </View>

                    {item.zone === "College" ? (
                        <View style={styles.detailsGrid}>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Room:</Text>
                                <Text style={styles.detailValue}>{item.deliveryLocation?.roomNo}</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Roll:</Text>
                                <Text style={styles.detailValue}>{item.deliveryLocation?.rollNo}</Text>
                            </View>
                            {item.deliveryLocation?.department && (
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Dept:</Text>
                                    <Text style={styles.detailValue}>{item.deliveryLocation?.department}</Text>
                                </View>
                            )}
                        </View>
                    ) : (
                        <View style={styles.addressContainer}>
                            <Text style={styles.rentalLocation} numberOfLines={2}>
                                {item.deliveryLocation?.formattedAddress ||
                                    `${item.deliveryLocation?.area}, ${item.deliveryLocation?.city}`}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>

            {(item.status === "requested" ||
                item.status === "delivery_scheduled" ||
                item.status === "paid" ||
                item.status === "payment_pending") && (
                    <View style={styles.actionRow}>
                        {item.status === "requested" ? (
                            <TouchableOpacity style={styles.actionBtn} onPress={onScheduleDelivery}>
                                <Ionicons name="calendar-outline" size={14} color={Colors.white} style={{ marginRight: 4 }} />
                                <Text style={styles.actionBtnText}>Schedule Delivery</Text>
                            </TouchableOpacity>
                        ) : null}
                        {item.status === "delivery_scheduled" ? (
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.successBtn]}
                                onPress={onMarkDelivered}
                            >
                                <Ionicons name="checkmark-done" size={14} color={Colors.white} style={{ marginRight: 4 }} />
                                <Text style={styles.actionBtnText}>Mark Delivered</Text>
                            </TouchableOpacity>
                        ) : null}
                        {item.status === "paid" ? (
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.successBtn]}
                                onPress={onMarkReturned}
                            >
                                <Ionicons name="archive-outline" size={14} color={Colors.white} style={{ marginRight: 4 }} />
                                <Text style={styles.actionBtnText}>Mark Returned</Text>
                            </TouchableOpacity>
                        ) : null}
                        {item.status === "payment_pending" ? (
                            <TouchableOpacity style={styles.actionBtn} onPress={onVerifyPayment}>
                                <Ionicons name="card-outline" size={14} color={Colors.white} style={{ marginRight: 4 }} />
                                <Text style={styles.actionBtnText}>Verify Payment</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                )}
        </View>
    );
}

const styles = StyleSheet.create({
    rentalCard: {
        backgroundColor: Colors.white + "F2",
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        position: 'relative',
    },
    rentalTop: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    coverWrap: {
        marginRight: 12,
        width: 58,
        alignSelf: "center",
    },
    cover: {
        width: "100%",
        aspectRatio: 58 / 82,
        borderRadius: 14,
        backgroundColor: Colors.border,
    },
    coverPlaceholder: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    rentalInfo: {
        flex: 1,
        paddingTop: 2,
        minWidth: 0,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
        marginBottom: 8,
    },
    rentalTitle: {
        flex: 1,
        fontSize: FontSizes.bodyLarge,
        fontFamily: Fonts.bold,
        color: Colors.text,
        minWidth: 0,
    },
    subInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 5,
    },
    rentalUser: {
        fontSize: FontSizes.caption,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
    },
    rentalLocation: {
        fontSize: FontSizes.caption,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        flex: 1,
    },
    detailsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 4,
    },
    detailItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.border + "40",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    detailLabel: {
        fontSize: 10,
        fontFamily: Fonts.bold,
        color: Colors.textSecondary,
        marginRight: 4,
    },
    detailValue: {
        fontSize: 10,
        fontFamily: Fonts.medium,
        color: Colors.text,
    },
    addressContainer: {
        marginTop: 2,
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
        alignSelf: "flex-start",
        marginTop: 1,
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
    actionRow: {
        flexDirection: "row",
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: Colors.border + "40",
        gap: 8,
        flexWrap: "wrap",
    },
    actionBtn: {
        flex: 1,
        minWidth: 170,
        backgroundColor: Colors.primary,
        paddingVertical: 11,
        borderRadius: 999,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
    },
    successBtn: {
        backgroundColor: "#10B981",
    },
    actionBtnText: {
        color: Colors.white,
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
    },
});
