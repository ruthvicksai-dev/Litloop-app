import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { triggerHaptic } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type QuickActionGridProps = {
    statusCounts?: Record<string, number>;
};

export default function QuickActionGrid({ statusCounts = {} }: QuickActionGridProps) {
    const router = useRouter();

    const actions = [
        // Row 1: Core Management
        {
            key: "add-book",
            label: "Add Book",
            icon: "add" as const,
            iconColor: Colors.primary,
            bgColor: Colors.primary + "15",
            onPress: () => router.push("/(admin)/add-book"),
        },
        {
            key: "verify-students",
            label: "Verifications",
            icon: "shield-checkmark" as const,
            iconColor: "#7C3AED",
            bgColor: "#7C3AED15",
            onPress: () => router.push("/(admin)/verify-payment"),
        },
        {
            key: "books",
            label: "Books",
            icon: "book" as const,
            iconColor: Colors.primary,
            bgColor: Colors.primary + "15",
            onPress: () => router.push("/(admin)/books"),
        },
        {
            key: "series",
            label: "Series",
            icon: "layers" as const,
            iconColor: "#2563EB",
            bgColor: "#2563EB15",
            onPress: () => router.push("/(admin)/series" as any),
        },
        {
            key: "home-sections",
            label: "Home Sections",
            icon: "home-outline" as const,
            iconColor: "#0891B2",
            bgColor: "#0891B215",
            onPress: () => router.push("/(admin)/manage-home-sections" as any),
        },
        // Row 2: Orders Flow
        {
            key: "all-orders",
            label: "All Orders",
            icon: "clipboard" as const,
            iconColor: "#6B7280",
            bgColor: "#6B728015",
            onPress: () => router.push("/(admin)/orders?status=all" as any),
        },
        {
            key: "requested",
            label: "Requested",
            icon: "document-text" as const,
            iconColor: "#D97706",
            bgColor: "#D9770615",
            badge: statusCounts["requested"] ?? 0,
            onPress: () => router.push("/(admin)/orders?status=requested" as any),
        },
        {
            key: "delivery-scheduled",
            label: "Delivery Scheduled",
            icon: "calendar-number" as const,
            iconColor: "#2563EB",
            bgColor: "#2563EB15",
            badge: statusCounts["delivery_scheduled"] ?? 0,
            onPress: () => router.push("/(admin)/orders?status=delivery_scheduled" as any),
        },
        {
            key: "pickup-scheduled",
            label: "Pickup Scheduled",
            icon: "bicycle" as const,
            iconColor: "#059669",
            bgColor: "#05966915",
            badge: statusCounts["pickup_scheduled"] ?? 0,
            onPress: () => router.push("/(admin)/orders?status=pickup_scheduled" as any),
        },
        // Row 3: Payment & Statuses
        {
            key: "payment-pending",
            label: "Payment Pending",
            icon: "cash" as const,
            iconColor: "#EA580C",
            bgColor: "#EA580C15",
            badge: statusCounts["payment_pending"] ?? 0,
            onPress: () => router.push("/(admin)/orders?status=payment_pending" as any),
        },
        {
            key: "paid",
            label: "Paid",
            icon: "card" as const,
            iconColor: "#059669",
            bgColor: "#05966915",
            onPress: () => router.push("/(admin)/orders?status=paid" as any),
        },
        {
            key: "delivered",
            label: "Delivered",
            icon: "checkmark-circle" as const,
            iconColor: "#10B981",
            bgColor: "#10B98115",
            onPress: () => router.push("/(admin)/orders?status=delivered" as any),
        },
        {
            key: "returned",
            label: "Returned",
            icon: "refresh-circle" as const,
            iconColor: "#6B7280",
            bgColor: "#6B728015",
            onPress: () => router.push("/(admin)/orders?status=returned" as any),
        },
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.grid}>
                {actions.map((item) => (
                    <TouchableOpacity
                        key={item.key}
                        style={styles.card}
                        activeOpacity={0.75}
                        onPress={() => {
                            triggerHaptic("light");
                            item.onPress();
                        }}
                    >
                        <View style={[styles.iconWrap, { backgroundColor: item.bgColor }]}>
                            <Ionicons name={item.icon} size={20} color={item.iconColor} />
                            {item.badge && item.badge > 0 ? (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{item.badge}</Text>
                                </View>
                            ) : null}
                        </View>
                        <Text
                            style={styles.label}
                            numberOfLines={2}
                            adjustsFontSizeToFit
                            minimumFontScale={0.8}
                        >
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 14,
        marginTop: Spacing.md,
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 12,
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    card: {
        flexBasis: "22%",
        flexGrow: 1,
        backgroundColor: "rgba(255,255,255,0.55)",
        borderRadius: 18,
        paddingVertical: 12,
        paddingHorizontal: 4,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 88,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.7)",
    },
    iconWrap: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 6,
        position: "relative",
    },
    badge: {
        position: "absolute",
        top: -4,
        right: -6,
        backgroundColor: Colors.error,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: Colors.white,
    },
    badgeText: {
        color: Colors.white,
        fontSize: 10,
        fontFamily: Fonts.bold,
    },
    label: {
        fontSize: 11,
        fontFamily: Fonts.medium,
        color: Colors.text,
        textAlign: "center",
        paddingHorizontal: 2,
    },
});
