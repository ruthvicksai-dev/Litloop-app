import { Colors, RENTAL_STATUS_LABELS, STATUS_COLORS } from "@/constants/theme";
import React from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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

    return (
        <View style={styles.rentalCard}>
            <View style={styles.rentalTop}>
                <View style={styles.rentalInfo}>
                    <Text style={styles.rentalTitle} numberOfLines={1}>
                        {item.book?.title || "Unknown"}
                    </Text>
                    <Text style={styles.rentalUser}>
                        ðŸ‘¤ {item.user?.name || "Unknown"} â€¢ {item.user?.phone}
                    </Text>
                    <Text style={styles.rentalLocation}>
                        ðŸ“ {item.deliveryLocation?.area}, {item.deliveryLocation?.city}
                    </Text>
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
                            <Text style={styles.actionBtnText}>ðŸ“… Schedule Delivery</Text>
                        </TouchableOpacity>
                    ) : null}
                    {item.status === "delivery_scheduled" ? (
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.successBtn]}
                            onPress={onMarkDelivered}
                        >
                            <Text style={styles.actionBtnText}>âœ… Mark Delivered</Text>
                        </TouchableOpacity>
                    ) : null}
                    {item.status === "paid" ? (
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.successBtn]}
                            onPress={onMarkReturned}
                        >
                            <Text style={styles.actionBtnText}>ðŸ“¦ Mark Returned</Text>
                        </TouchableOpacity>
                    ) : null}
                    {item.status === "payment_pending" ? (
                        <TouchableOpacity style={styles.actionBtn} onPress={onVerifyPayment}>
                            <Text style={styles.actionBtnText}>ðŸ’³ Verify Payment</Text>
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
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    rentalInfo: {
        flex: 1,
        marginRight: 10,
    },
    rentalTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: Colors.text,
        marginBottom: 4,
    },
    rentalUser: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 2,
    },
    rentalLocation: {
        fontSize: 12,
        color: Colors.textSecondary,
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
        fontWeight: "700",
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
    },
    successBtn: {
        backgroundColor: "#10B981",
    },
    actionBtnText: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: "700",
    },
});
