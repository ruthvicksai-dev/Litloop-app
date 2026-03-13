import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type StatCardProps = {
    label: string;
    value: string | number;
    icon: keyof typeof Ionicons.glyphMap;
    tint?: string;
};

export default function StatCard({
    label,
    value,
    icon,
    tint = Colors.primary,
}: StatCardProps) {
    return (
        <View style={styles.card}>
            <View style={[styles.iconWrap, { backgroundColor: tint + "18" }]}>
                <Ionicons name={icon} size={18} color={tint} />
            </View>
            <Text style={styles.label}>{label}</Text>
            <Text style={[styles.value, { color: tint }]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexBasis: "48%",
        flexGrow: 1,
        minHeight: 104,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 20,
        padding: 14,
    },
    iconWrap: {
        width: 34,
        aspectRatio: 1,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },
    label: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    value: {
        fontSize: FontSizes.titleLarge,
        fontFamily: Fonts.bold,
    },
});
