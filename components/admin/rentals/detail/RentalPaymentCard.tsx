import { FontSizes, Fonts } from "@/constants/fonts";
import { Colors, Layout, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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

    return (
        <View style={styles.section}>
            <Text style={styles.sectionLabel}>Payment & Fees</Text>
            <View style={styles.gridRow}>
                {totalRent !== undefined && (
                    <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>Total Rent</Text>
                        <Text style={[styles.gridValue, { color: Colors.success, fontFamily: Fonts.bold }]}>₹{totalRent}</Text>
                    </View>
                )}
                {lateFee !== undefined && (
                    <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>Late Fee</Text>
                        <Text style={[styles.gridValue, { color: Colors.error }]}>₹{lateFee}</Text>
                    </View>
                )}
            </View>
            <View style={styles.gridRow}>
                {paymentMethod && (
                    <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>Method</Text>
                        <Text style={styles.gridValue}>{paymentMethod.toUpperCase()}</Text>
                    </View>
                )}
                {paymentStatus && (
                    <View style={styles.gridItem}>
                        <Text style={styles.gridLabel}>Status</Text>
                        <Text style={[styles.gridValue, { color: paymentStatus === "paid" ? Colors.success : Colors.warning }]}>
                            {paymentStatus.replace("_", " ").toUpperCase()}
                        </Text>
                    </View>
                )}
            </View>
            {utrNumber && (
                <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>UTR Number</Text>
                    <Text style={styles.gridValue}>{utrNumber}</Text>
                </View>
            )}
            {screenshotUrl && (
                <TouchableOpacity onPress={() => Linking.openURL(screenshotUrl)} style={styles.screenshotWrap}>
                    <Image source={{ uri: screenshotUrl }} style={styles.screenshot} resizeMode="cover" />
                    <View style={styles.screenshotOverlay}>
                        <Ionicons name="expand" size={18} color={Colors.white} />
                        <Text style={styles.screenshotOverlayText}>Tap to view</Text>
                    </View>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        gap: Spacing.sm,
    },
    sectionLabel: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 4,
    },
    gridRow: {
        flexDirection: "row",
        gap: Spacing.md,
    },
    gridItem: {
        flex: 1,
    },
    gridLabel: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.bold,
        color: Colors.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    gridValue: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.text,
    },
    screenshotWrap: {
        width: "100%",
        aspectRatio: 4 / 3,
        borderRadius: Layout.borderRadius,
        backgroundColor: Colors.primaryLight,
        overflow: "hidden",
        marginTop: Spacing.sm,
    },
    screenshot: {
        width: "100%",
        height: "100%",
    },
    screenshotOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.25)",
        justifyContent: "center",
        alignItems: "center",
        gap: 4,
    },
    screenshotOverlayText: {
        color: Colors.white,
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.bold,
    },
});
