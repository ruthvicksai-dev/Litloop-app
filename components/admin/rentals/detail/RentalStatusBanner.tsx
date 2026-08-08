import { FontSizes, Fonts } from "@/constants/fonts";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface RentalStatusBannerProps {
    statusColor: string;
    statusLabel: string;
    createdAt: number;
    paymentLabel?: string;
    paymentColor?: string;
    rejectionReason?: string;
}

export default function RentalStatusBanner({
    statusColor,
    statusLabel,
    createdAt,
    paymentLabel,
    paymentColor,
    rejectionReason,
}: RentalStatusBannerProps) {
    const formattedDate = new Date(createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <View style={styles.container}>
            <View style={styles.bannerRow}>
                <View style={styles.leftGroup}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
                    {paymentLabel ? (
                        <View style={[styles.paymentPill, { backgroundColor: (paymentColor || Colors.primary) + "15" }]}>
                            <Text style={[styles.paymentPillText, { color: paymentColor || Colors.primary }]}>
                                {paymentLabel}
                            </Text>
                        </View>
                    ) : null}
                </View>
                <View style={styles.dateBadge}>
                    <Ionicons name="time-outline" size={12} color={Colors.textSecondary} />
                    <Text style={styles.statusDate}>{formattedDate}</Text>
                </View>
            </View>

            {rejectionReason ? (
                <View style={styles.rejectionAlert}>
                    <Ionicons name="alert-circle" size={16} color="#EF4444" />
                    <View style={styles.rejectionTextGroup}>
                        <Text style={styles.rejectionTitle}>Payment Proof Rejected</Text>
                        <Text style={styles.rejectionReasonText}>{rejectionReason}</Text>
                    </View>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 4,
    },
    bannerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 12,
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.05)",
    },
    leftGroup: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        flex: 1,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    statusLabel: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
    },
    paymentPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    paymentPillText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        letterSpacing: 0.1,
    },
    dateBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "rgba(0,0,0,0.03)",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    statusDate: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
    },
    rejectionAlert: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
        backgroundColor: "#FEF2F2",
        borderWidth: 1,
        borderColor: "#FCA5A5",
        borderRadius: 12,
        padding: 10,
        marginBottom: 10,
    },
    rejectionTextGroup: {
        flex: 1,
    },
    rejectionTitle: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: "#991B1B",
        marginBottom: 2,
    },
    rejectionReasonText: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.regular,
        color: "#B91C1C",
        lineHeight: 16,
    },
});
