import { FontSizes, Fonts } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface RentalCustomerCardProps {
    name?: string;
    email?: string;
    phone?: string;
}

export default function RentalCustomerCard({ name, email, phone }: RentalCustomerCardProps) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionLabel}>Customer</Text>
            <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.detailValue}>{name}</Text>
            </View>
            <View style={styles.detailRow}>
                <Ionicons name="mail-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.detailValue}>{email}</Text>
            </View>
            <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.detailValue}>{phone}</Text>
            </View>
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
});
