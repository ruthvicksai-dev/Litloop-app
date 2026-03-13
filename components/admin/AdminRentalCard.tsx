import { Fonts } from "@/constants/fonts";
import { Colors, RENTAL_STATUS_LABELS, STATUS_COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

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
    const statusColor = STATUS_COLORS[item.status] || Colors.textSecondary;
    const coverUri = item.coverUrl || item.coverUrls?.[0] || null;

    return (
        <View style={styles.rentalCard}>
            <View style={styles.rentalTop}>
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
                                size={SCREEN_WIDTH * 0.08}
                                color={Colors.primary}
                            />
                        </View>
                    )}
                </View>
                <View style={styles.rentalInfo}>
                    <Text style={styles.rentalTitle} numberOfLines={1}>
                        {item.book?.title || "Unknown"}
                    </Text>
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
                            color={Colors.textSecondary}
                        />
                        <Text style={styles.rentalLocation}>
                            {item.deliveryLocation?.area}, {item.deliveryLocation?.city}
                        </Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + "18" }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusText, { color: statusColor }]}>
                        {RENTAL_STATUS_LABELS[item.status]}
                    </Text>
                </View>
            </View>

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
        backgroundColor: Colors.white,
        marginHorizontal: SCREEN_WIDTH * 0.06,
        marginBottom: 10,
        borderRadius: 14,
        padding: 16,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    rentalTop: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    coverWrap: {
        marginRight: 12,
    },
    cover: {
        width: 58,
        height: 82,
        borderRadius: 10,
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
        marginRight: 10,
    },
    rentalTitle: {
        fontSize: 15,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 4,
    },
    subInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 2,
    },
    rentalUser: {
        fontSize: 12,
        color: Colors.textSecondary,
      fontFamily: Fonts.regular,
    },
    rentalLocation: {
        fontSize: 12,
        color: Colors.textSecondary,
      fontFamily: Fonts.regular,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 10,
        fontFamily: Fonts.bold,
    },
    actionRow: {
        flexDirection: "row",
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: Colors.border + "40",
        gap: 8,
    },
    actionBtn: {
        flex: 1,
        backgroundColor: Colors.primary,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
    },
    successBtn: {
        backgroundColor: "#10B981",
    },
    actionBtnText: {
        color: Colors.white,
        fontSize: 12,
        fontFamily: Fonts.bold,
    },
});
