import { FontSizes, Fonts } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { triggerHaptic } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

interface RentalCustomerCardProps {
    name?: string;
    email?: string;
    phone?: string;
}

export default function RentalCustomerCard({ name, email, phone }: RentalCustomerCardProps) {
    const handleCall = () => {
        if (!phone) return;
        triggerHaptic("light");
        const cleaned = phone.replace(/[^\d+]/g, "");
        if (cleaned) {
            Linking.openURL(`tel:${cleaned}`);
        }
    };

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
            {phone ? (
                <Pressable
                    style={({ pressed }) => [styles.detailRow, pressed && { opacity: 0.6 }]}
                    onPress={handleCall}
                >
                    <Ionicons name="call-outline" size={16} color={Colors.primary} />
                    <Text style={[styles.detailValue, styles.phoneValue]}>{phone}</Text>
                    <Ionicons name="open-outline" size={14} color={Colors.primary} />
                </Pressable>
            ) : null}
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
    phoneValue: {
        color: Colors.primary,
        fontFamily: Fonts.bold,
    },
});
