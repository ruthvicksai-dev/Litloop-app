import { FontSizes, Fonts } from "@/constants/fonts";
import { Colors, PAYMENT_STATUS_COLORS, PAYMENT_STATUS_LABELS } from "@/constants/theme";
import { triggerHaptic } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface RentalPaymentCardProps {
    totalRent?: number;
    lateFee?: number;
    paymentMethod?: string;
    paymentStatus?: string;
    utrNumber?: string;
    screenshotUrl?: string | null;
}

export default function RentalPaymentCard({
    totalRent,
    lateFee,
    paymentMethod,
    paymentStatus,
    utrNumber,
    screenshotUrl,
}: RentalPaymentCardProps) {
    if (totalRent === undefined && !paymentStatus) return null;

    const statusColor = (paymentStatus && PAYMENT_STATUS_COLORS[paymentStatus]) || Colors.warning;
    const statusLabel = (paymentStatus && PAYMENT_STATUS_LABELS[paymentStatus]) || paymentStatus?.replace("_", " ").toUpperCase() || "PENDING";

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.headerTitleRow}>
                    <Ionicons name="card" size={16} color={Colors.primary} />
                    <Text style={styles.cardHeaderTitle}>Payment Summary</Text>
                </View>
                {paymentStatus ? (
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + "15" }]}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                            {statusLabel}
                        </Text>
                    </View>
                ) : null}
            </View>

            <View style={styles.paymentGrid}>
                {totalRent !== undefined && (
                    <View style={styles.metricBox}>
                        <Text style={styles.metricLabel}>Total Rent</Text>
                        <Text style={styles.metricValueTotal}>₹{totalRent}</Text>
                    </View>
                )}
                {lateFee !== undefined && lateFee > 0 ? (
                    <View style={styles.metricBox}>
                        <Text style={styles.metricLabel}>Late Fee</Text>
                        <Text style={styles.metricValueFee}>₹{lateFee}</Text>
                    </View>
                ) : null}
                {paymentMethod && (
                    <View style={styles.metricBox}>
                        <Text style={styles.metricLabel}>Payment Method</Text>
                        <Text style={styles.metricValue}>{paymentMethod.toUpperCase()}</Text>
                    </View>
                )}
            </View>

            {utrNumber ? (
                <View style={styles.utrRow}>
                    <Ionicons name="receipt-outline" size={14} color={Colors.textSecondary} />
                    <View style={styles.utrTextGroup}>
                        <Text style={styles.utrLabel}>UTR Transaction ID</Text>
                        <Text style={styles.utrValue}>{utrNumber}</Text>
                    </View>
                </View>
            ) : null}

            {screenshotUrl ? (
                <TouchableOpacity
                    style={styles.screenshotBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                        triggerHaptic("light");
                        Linking.openURL(screenshotUrl);
                    }}
                >
                    <Ionicons name="image-outline" size={16} color={Colors.primary} />
                    <Text style={styles.screenshotBtnText}>View Payment Screenshot</Text>
                    <Ionicons name="open-outline" size={14} color={Colors.primary} />
                </TouchableOpacity>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 16,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.04)",
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.04)",
    },
    headerTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    cardHeaderTitle: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.text,
        letterSpacing: 0.2,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusBadgeText: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.bold,
    },
    paymentGrid: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 8,
    },
    metricBox: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.02)",
        borderRadius: 12,
        padding: 10,
    },
    metricLabel: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        marginBottom: 2,
    },
    metricValue: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    metricValueTotal: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.success,
    },
    metricValueFee: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.error,
    },
    utrRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: Colors.background,
        borderRadius: 10,
        padding: 10,
        marginTop: 6,
    },
    utrTextGroup: {
        flex: 1,
    },
    utrLabel: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
    },
    utrValue: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    screenshotBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        marginTop: 10,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: Colors.primary + "12",
    },
    screenshotBtnText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
});
