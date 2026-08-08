import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, getRentalStatusMeta, scale } from "@/constants/theme";
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
    onVerifyCash?: () => void;
};

function AdminRentalCardComponent({
    item,
    onScheduleDelivery,
    onVerifyPayment,
    onMarkDelivered,
    onMarkReturned,
    onVerifyCash,
}: AdminRentalCardProps) {
    const router = useRouter();

    const statusMeta = getRentalStatusMeta({
        status: item.status,
        paymentStatus: item.paymentStatus,
        paymentMethod: item.paymentMethod,
    });

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
                        <View style={[styles.statusBadge, { backgroundColor: statusMeta.color + "18", borderColor: statusMeta.color + "35" }]}>
                            <View style={[styles.statusDot, { backgroundColor: statusMeta.color }]} />
                            <Text
                                style={[styles.statusText, { color: statusMeta.color }]}
                                numberOfLines={1}
                            >
                                {statusMeta.badgeText}
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

            {/* Quick Action Buttons based on Enterprise Status Matrix */}
            <View style={styles.actionRow}>
                {statusMeta.allowedActions.includes("schedule_delivery") && (
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

                {statusMeta.allowedActions.includes("mark_delivered") && (
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

                {statusMeta.allowedActions.includes("verify_upi") && (
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: "#8B5CF6" }]}
                        onPress={() => {
                            triggerHaptic("light");
                            onVerifyPayment();
                        }}
                    >
                        <Text style={styles.actionBtnText}>Verify Payment (UPI)</Text>
                    </TouchableOpacity>
                )}

                {statusMeta.allowedActions.includes("verify_cash") && (
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: "#10B981" }]}
                        onPress={() => {
                            triggerHaptic("light");
                            if (onVerifyCash) {
                                onVerifyCash();
                            } else {
                                onVerifyPayment();
                            }
                        }}
                    >
                        <Text style={styles.actionBtnText}>Verify Cash (Mark Paid)</Text>
                    </TouchableOpacity>
                )}

                {statusMeta.allowedActions.includes("reverify_payment") && (
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: "#EF4444" }]}
                        onPress={() => {
                            triggerHaptic("light");
                            onVerifyPayment();
                        }}
                    >
                        <Text style={styles.actionBtnText}>Review Rejected Payment</Text>
                    </TouchableOpacity>
                )}

                {statusMeta.allowedActions.includes("mark_returned") && (
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.successBtn]}
                        onPress={() => {
                            triggerHaptic("light");
                            onMarkReturned();
                        }}
                    >
                        <Text style={styles.actionBtnText}>Mark Returned & Restock</Text>
                    </TouchableOpacity>
                )}

                {!statusMeta.allowedActions.length && (item.status === "pickup_scheduled" || item.status === "payment_pending") && (
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: Colors.surfaceSecondary }]}
                        onPress={() => {
                            triggerHaptic("light");
                            router.push({
                                pathname: "/(admin)/rental/[id]",
                                params: { id: item._id }
                            } as any);
                        }}
                    >
                        <Text style={[styles.actionBtnText, { color: Colors.textSecondary }]}>
                            ⏳ Awaiting Customer Payment
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
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
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: Colors.border,
        flexShrink: 0,
        alignSelf: "flex-start",
        marginTop: 1,
    },
    statusDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
    },
    statusText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        letterSpacing: 0.1,
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
