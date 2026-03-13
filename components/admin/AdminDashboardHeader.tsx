import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
        paddingHorizontal: 20,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.sm,
    },
    headerGreeting: {
        fontSize: FontSizes.small,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
    },
    title: {
        fontSize: FontSizes.hero,
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
        backgroundColor: Colors.primary,
        width: 40,
        aspectRatio: 1,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    iconBtnText: {
        color: Colors.white,
        fontFamily: Fonts.bold,
        fontSize: FontSizes.small,
    },
    logoutBtn: {
        width: 40,
        aspectRatio: 1,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: Colors.border,
        justifyContent: "center",
        alignItems: "center",
    },
    logoutText: {
        color: Colors.textSecondary,
        fontSize: FontSizes.small,
        fontFamily: Fonts.medium,
    },
});
