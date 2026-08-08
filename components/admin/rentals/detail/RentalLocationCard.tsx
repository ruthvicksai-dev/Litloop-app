import { FontSizes, Fonts } from "@/constants/fonts";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface RentalLocationCardProps {
    type: "Delivery" | "Pickup";
    zone?: string;
    location?: {
        roomNo?: string;
        rollNo?: string;
        department?: string;
        yearOfStudy?: string;
        formattedAddress?: string;
        area?: string;
        city?: string;
        landmark?: string;
        latitude?: number;
        longitude?: number;
        phone?: string;
    } | null;
    date?: string;
    time?: string;
}

export default function RentalLocationCard({ type, zone, location, date, time }: RentalLocationCardProps) {
    if (!location) return null;

    const isDelivery = type === "Delivery";
    const primaryColor = isDelivery ? Colors.primary : Colors.success;

    // Detect if this specific location has College fields or Home address fields
    const isCollegeLocation = Boolean(
        location.roomNo?.trim() ||
        location.rollNo?.trim() ||
        location.department?.trim() ||
        location.yearOfStudy?.trim() ||
        (zone === "College" && !location.formattedAddress?.trim() && !location.area?.trim() && !location.city?.trim())
    );

    const effectiveZone = isCollegeLocation ? "College" : "Home";
    const badgeText = `${effectiveZone} Zone ${isDelivery ? "Delivery" : "Pickup"}`;

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

    const addressText =
        location.formattedAddress?.trim() ||
        [location.area?.trim(), location.city?.trim()].filter(Boolean).join(", ") ||
        "Address not provided";

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.headerTitleRow}>
                    <Ionicons name={isDelivery ? "location" : "bicycle"} size={16} color={primaryColor} />
                    <Text style={styles.cardHeaderTitle}>{type} Information</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: primaryColor + "15" }]}>
                    <Text style={[styles.badgeText, { color: primaryColor }]}>{badgeText}</Text>
                </View>
            </View>

            {isCollegeLocation ? (
                <View style={styles.gridContainer}>
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
                            <Text style={styles.gridLabel}>Year of Study</Text>
                            <Text style={styles.gridValue}>{location.yearOfStudy || "N/A"}</Text>
                        </View>
                    </View>
                    {location.landmark ? (
                        <View style={styles.landmarkRow}>
                            <Ionicons name="navigate-outline" size={13} color={Colors.textSecondary} />
                            <Text style={styles.landmarkText}>Landmark: {location.landmark}</Text>
                        </View>
                    ) : null}
                </View>
            ) : (
                <View style={styles.addressContainer}>
                    <Text style={styles.addressLabel}>Address</Text>
                    <Text style={styles.addressText}>{addressText}</Text>
                    {location.landmark ? (
                        <View style={styles.landmarkRow}>
                            <Ionicons name="navigate-outline" size={13} color={Colors.textSecondary} />
                            <Text style={styles.landmarkText}>Landmark: {location.landmark}</Text>
                        </View>
                    ) : null}
                </View>
            )}

            {location.phone ? (
                <View style={styles.phoneRow}>
                    <Ionicons name="call-outline" size={13} color={Colors.textSecondary} />
                    <Text style={styles.phoneText}>Contact: {location.phone}</Text>
                </View>
            ) : null}

            {date || time ? (
                <View style={styles.scheduleRow}>
                    <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.scheduleText}>
                        Scheduled: {[date, time].filter(Boolean).join(" at ")}
                    </Text>
                </View>
            ) : !isDelivery ? (
                <View style={styles.scheduleRow}>
                    <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.scheduleText}>
                        Scheduled: Pending customer return request
                    </Text>
                </View>
            ) : null}

            {location.latitude && location.longitude ? (
                <TouchableOpacity style={styles.mapBtn} activeOpacity={0.8} onPress={openMap}>
                    <Ionicons name="map-outline" size={14} color={Colors.primary} />
                    <Text style={styles.mapBtnText}>Open Map Navigation</Text>
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
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.bold,
    },
    gridContainer: {
        gap: 10,
    },
    gridRow: {
        flexDirection: "row",
        gap: 12,
    },
    gridItem: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.02)",
        borderRadius: 10,
        padding: 8,
    },
    gridLabel: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        marginBottom: 2,
    },
    gridValue: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    addressContainer: {
        backgroundColor: "rgba(0,0,0,0.02)",
        borderRadius: 12,
        padding: 10,
    },
    addressLabel: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        marginBottom: 2,
    },
    addressText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.text,
        lineHeight: 18,
    },
    landmarkRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 6,
    },
    landmarkText: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
    },
    phoneRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 8,
    },
    phoneText: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
    },
    scheduleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 10,
        backgroundColor: Colors.primary + "0D",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    scheduleText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: Colors.primary,
    },
    mapBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        marginTop: 10,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: Colors.primary + "12",
    },
    mapBtnText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
});
