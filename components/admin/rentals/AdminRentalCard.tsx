import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, RENTAL_STATUS_LABELS, scale, STATUS_COLORS } from "@/constants/theme";
import { triggerHaptic } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import {
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

function AdminRentalCardComponent({
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
                onPress={() => {
                    triggerHaptic("light");
                    router.push({
                        pathname: "/(admin)/rental/[id]",
                        params: { id: item._id }
                    } as any);
                }}
                activeOpacity={0.7}
            >
                <View style={styles.coverWrap}>
                    {coverUri ? (
                        <Image
                            source={coverUri}
                            style={styles.cover}
                            cachePolicy="disk"
                            contentFit="cover"
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
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + "15" }]}>
                            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                            <Text
                                style={[styles.statusText, { color: statusColor }]}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.75}
                            >
                                {RENTAL_STATUS_LABELS[item.status] || item.status}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.customerName} numberOfLines={1}>
                        <Ionicons name="person-outline" size={12} color={Colors.textSecondary} />{" "}
                        {item.user?.name || "Customer"} ({item.user?.phone || "No phone"})
                    </Text>

                    <Text style={styles.zoneTag} numberOfLines={1}>
                        <Ionicons name="location-outline" size={12} color={Colors.primary} /> Zone: {item.zone}
                    </Text>

                    {/* Key Detail Chips */}
                    <View style={styles.detailRow}>
                        {item.deliveryDate ? (
                            <View style={styles.detailChip}>
                                <Text style={styles.detailLabel}>Deliv:</Text>
                                <Text style={styles.detailValue}>{item.deliveryDate}</Text>
                            </View>
                        ) : null}
                        {item.pickupDate ? (
                            <View style={styles.detailChip}>
                                <Text style={styles.detailLabel}>Pickup:</Text>
                                <Text style={styles.detailValue}>{item.pickupDate}</Text>
                            </View>
                        ) : null}
                    </View>

                    {item.deliveryLocation?.formattedAddress ? (
                        <Text style={styles.addressText} numberOfLines={1}>
                            📍 {item.deliveryLocation.formattedAddress}
                        </Text>
                    ) : item.deliveryLocation?.roomNo ? (
                        <Text style={styles.addressText} numberOfLines={1}>
                            📍 Room {item.deliveryLocation.roomNo}, {item.deliveryLocation.department || ""}
                        </Text>
                    ) : null}
                </View>
            </TouchableOpacity>

            {/* Quick Action Buttons */}
            {(item.status === "requested" ||
                item.status === "payment_pending" ||
                item.status === "delivery_scheduled" ||
                item.status === "pickup_scheduled") && (
                <View style={styles.actionRow}>
                    {item.status === "requested" && (
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => {
                                triggerHaptic("light");
                                onScheduleDelivery();
                            }}
                        >
                            <Text style={styles.actionBtnText}>Schedule Delivery</Text>
                        </TouchableOpacity>
                    )}

                    {item.status === "payment_pending" && (
                        <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => {
                                triggerHaptic("light");
                                onVerifyPayment();
                            }}
                        >
                            <Text style={styles.actionBtnText}>Verify Payment</Text>
                        </TouchableOpacity>
                    )}

                    {item.status === "delivery_scheduled" && (
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.successBtn]}
                            onPress={() => {
                                triggerHaptic("light");
                                onMarkDelivered();
                            }}
                        >
                            <Text style={styles.actionBtnText}>Mark Delivered</Text>
                        </TouchableOpacity>
                    )}

                    {item.status === "pickup_scheduled" && (
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.successBtn]}
                            onPress={() => {
                                triggerHaptic("light");
                                onMarkReturned();
                            }}
                        >
                            <Text style={styles.actionBtnText}>Mark Returned</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}

export default React.memo(AdminRentalCardComponent);

const styles = StyleSheet.create({
    rentalCard: {
        backgroundColor: Colors.white,
        borderRadius: 18,
        padding: 18,
        marginBottom: 15,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.04)",
    },
    rentalTop: {
        flexDirection: "row",
        gap: 12,
    },
    coverWrap: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cover: {
        width: 64,
        height: 94,
        borderRadius: 10,
        backgroundColor: Colors.border,
    },
    coverPlaceholder: {
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.primaryLight,
    },
    rentalInfo: {
        flex: 1,
        justifyContent: "space-between",
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 6,
        marginBottom: 2,
    },
    rentalTitle: {
        flex: 1,
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.text,
        lineHeight: 20,
    },
    customerName: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    zoneTag: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.bold,
        color: Colors.primary,
        marginTop: 4,
    },
    addressText: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        marginTop: 5,
    },
    detailRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginTop: 5,
    },
    detailChip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.background,
        paddingHorizontal: 6,
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
        marginTop: 10,
        paddingTop: 10,
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
