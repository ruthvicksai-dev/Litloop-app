import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
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
                    <Ionicons name="add" size={20} color={Colors.white} />
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
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    iconBtnText: {
        color: Colors.white,
        fontWeight: "700",
        fontSize: 13,
    },
    logoutBtn: {
        width: 40,
        height: 40,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: Colors.border,
        justifyContent: "center",
        alignItems: "center",
    },
    logoutText: {
        color: Colors.textSecondary,
        fontSize: 13,
        fontWeight: "600",
    },
});
