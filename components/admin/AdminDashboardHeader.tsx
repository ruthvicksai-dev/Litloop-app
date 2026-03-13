import { Colors, Spacing } from "@/constants/theme";
import React from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type AdminDashboardHeaderProps = {
    onAddBook: () => void;
    onSignOut: () => void;
};

export default function AdminDashboardHeader({
    onAddBook,
    onSignOut,
}: AdminDashboardHeaderProps) {
    return (
        <View style={styles.header}>
            <View>
                <Text style={styles.headerGreeting}>Admin Panel</Text>
                <Text style={styles.title}>Dashboard</Text>
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity style={styles.iconBtn} onPress={onAddBook}>
                    <Text style={styles.iconBtnText}>+ Book</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.logoutBtn} onPress={onSignOut}>
                    <Text style={styles.logoutText}>Logout</Text>
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
        paddingHorizontal: SCREEN_WIDTH * 0.06,
        paddingTop: SCREEN_HEIGHT * 0.015,
        paddingBottom: Spacing.sm,
    },
    headerGreeting: {
        fontSize: 13,
        color: Colors.textSecondary,
        fontWeight: "500",
    },
    title: {
        fontSize: SCREEN_WIDTH * 0.065,
        fontWeight: "800",
        color: Colors.text,
    },
    headerActions: {
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
    },
    iconBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
    iconBtnText: {
        color: Colors.white,
        fontWeight: "700",
        fontSize: 13,
    },
    logoutBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    logoutText: {
        color: Colors.textSecondary,
        fontSize: 13,
        fontWeight: "600",
    },
});
