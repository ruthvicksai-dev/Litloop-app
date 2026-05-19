import { FontSizes, Fonts } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface RentalLocationCardProps {
    type: "Delivery" | "Pickup";
    zone?: string;
    location: {
        roomNo?: string;
        rollNo?: string;
        department?: string;
        yearOfStudy?: string;
        formattedAddress?: string;
        area?: string;
        city?: string;
        latitude?: number;
        longitude?: number;
        phone?: string;
    };
    date?: string;
    time?: string;
}

export default function RentalLocationCard({ type, zone, location, date, time }: RentalLocationCardProps) {
    const isDelivery = type === "Delivery";
    const primaryColor = isDelivery ? Colors.primary : Colors.success;
    const badgeText = isDelivery ? zone : "Collection";

    const openMap = () => {
        const { latitude, longitude } = location;
        if (latitude && longitude) {
            const url = Platform.select({
                ios: `maps:0,0?q=${latitude},${longitude}`,
                android: `geo:0,0?q=${latitude},${longitude}`,
            });
            if (url) Linking.openURL(url);
        }
    };

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>{type}</Text>
                <View style={[styles.badge, { backgroundColor: primaryColor + "18" }]}>
                    <Text style={[styles.badgeText, { color: primaryColor }]}>{badgeText}</Text>
                </View>
            </View>

            {zone === "College" ? (
                <>
                    <View style={styles.gridRow}>
                        <View style={styles.gridItem}>
                            <Text style={styles.gridLabel}>Room No</Text>
                            <Text style={styles.gridValue}>{location.roomNo || "N/A"}</Text>
                        </View>
                        <View style={styles.gridItem}>
                            <Text style={styles.gridLabel}>Roll No</Text>
                            <Text style={styles.gridValue}>{location.rollNo || "N/A"}</Text>
                        </View>
                    </View>
                    <View style={styles.gridRow}>
                        <View style={styles.gridItem}>
                            <Text style={styles.gridLabel}>Department</Text>
                            <Text style={styles.gridValue}>{location.department || "N/A"}</Text>
                        </View>
                        <View style={styles.gridItem}>
                            <Text style={styles.gridLabel}>Year</Text>
                            <Text style={styles.gridValue}>{location.yearOfStudy || "N/A"}</Text>
                        </View>
                    </View>
                </>
            ) : (
                <>
                    <Text style={styles.addressText}>
                        {location.formattedAddress ||
                            (location.area ? `${location.area}, ${location.city}` : "Delivery Address Reused")}
                    </Text>
                    {location.latitude && location.longitude && (
                        <TouchableOpacity style={styles.mapBtn} onPress={openMap}>
                            <Ionicons name="navigate-outline" size={14} color={primaryColor} />
                            <Text style={[styles.mapBtnText, { color: primaryColor }]}>Open in Maps</Text>
                        </TouchableOpacity>
                    )}
                </>
            )}

            {!isDelivery && location.phone && (
                <View style={styles.detailRow}>
                    <Ionicons name="call-outline" size={16} color={primaryColor} />
                    <Text style={[styles.detailValue, { color: primaryColor }]}>{location.phone}</Text>
                </View>
            )}

            {date && (
                <View style={styles.scheduleRow}>
                    <Ionicons name={isDelivery ? "time-outline" : "calendar-outline"} size={14} color={primaryColor} />
                    <Text style={[styles.scheduleText, { color: primaryColor }]}>{date} at {time}</Text>
                </View>
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
    sectionHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 99,
    },
    badgeText: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.bold,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    detailValue: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.text,
        flex: 1,
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
    addressText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.text,
        lineHeight: 22,
    },
    mapBtn: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 6,
        marginTop: 4,
    },
    mapBtnText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
    },
    scheduleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingTop: Spacing.sm,
        marginTop: Spacing.xs,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    scheduleText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
    },
});
