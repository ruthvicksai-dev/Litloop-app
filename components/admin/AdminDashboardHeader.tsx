import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type AdminDashboardHeaderProps = {
    onNotificationsPress: () => void;
    onSignOut: () => void;
    unreadCount?: number;
};

export default function AdminDashboardHeader({
    onNotificationsPress,
    onSignOut,
    unreadCount = 0,
}: AdminDashboardHeaderProps) {
    return (
        <View style={styles.header}>
            <View style={styles.headerTextWrap}>
                <Text style={styles.headerGreeting}>Admin Panel</Text>
                <Text style={styles.title}>Dashboard</Text>
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity style={styles.iconBtn} onPress={onNotificationsPress}>
                    <Ionicons
                        name={unreadCount > 0 ? "notifications" : "notifications-outline"}
                        size={20}
                        color={Colors.primary}
                    />
                    {unreadCount > 0 ? <View style={styles.badge} /> : null}
                </TouchableOpacity>
                <TouchableOpacity style={styles.logoutBtn} onPress={onSignOut}>
                    <Ionicons name="log-out-outline" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingHorizontal: 20,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.sm,
    },
    headerTextWrap: {
        marginLeft: 6,
    },
    headerGreeting: {
        fontSize: FontSizes.small,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
    },
    title: {
        fontSize: FontSizes.heading,
        color: Colors.text,
        fontFamily: Fonts.bold,
    },
    headerActions: {
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
        flexShrink: 0,
    },
    iconBtn: {
        width: 40,
        aspectRatio: 1,
        borderRadius: 12,
        backgroundColor: Colors.primaryLight,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    badge: {
        position: "absolute",
        top: 6,
        right: 6,
        width: 9,
        height: 9,
        borderRadius: 4.5,
        backgroundColor: Colors.error,
        borderWidth: 1.5,
        borderColor: Colors.primaryLight,
    },
    logoutBtn: {
        width: 40,
        aspectRatio: 1,
        borderRadius: 12,
        backgroundColor: Colors.background,
        justifyContent: "center",
        alignItems: "center",
    },
});
