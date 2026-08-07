import { FontSizes, Fonts } from "@/constants/fonts";
import { Colors } from "@/constants/theme";
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
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.headerTitleRow}>
                    <Ionicons name="person" size={16} color={Colors.primary} />
                    <Text style={styles.cardHeaderTitle}>Customer Information</Text>
                </View>
                {phone ? (
                    <Pressable
                        style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.75 }]}
                        onPress={handleCall}
                    >
                        <Ionicons name="call" size={12} color={Colors.white} />
                        <Text style={styles.callBtnText}>Call</Text>
                    </Pressable>
                ) : null}
            </View>

            <View style={styles.contentRows}>
                <View style={styles.detailRow}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="person-outline" size={14} color={Colors.primary} />
                    </View>
                    <View style={styles.textGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <Text style={styles.value}>{name || "N/A"}</Text>
                    </View>
                </View>

                <View style={styles.detailRow}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="mail-outline" size={14} color={Colors.primary} />
                    </View>
                    <View style={styles.textGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <Text style={styles.value}>{email || "N/A"}</Text>
                    </View>
                </View>

                {phone ? (
                    <Pressable
                        style={({ pressed }) => [styles.detailRow, pressed && { opacity: 0.75 }]}
                        onPress={handleCall}
                    >
                        <View style={styles.iconCircle}>
                            <Ionicons name="call-outline" size={14} color={Colors.primary} />
                        </View>
                        <View style={styles.textGroup}>
                            <Text style={styles.label}>Phone Number</Text>
                            <Text style={[styles.value, styles.phoneText]}>{phone}</Text>
                        </View>
                        <Ionicons name="open-outline" size={14} color={Colors.primary} />
                    </Pressable>
                ) : null}
            </View>
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
    callBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: Colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    callBtnText: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.bold,
        color: Colors.white,
    },
    contentRows: {
        gap: 12,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    iconCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: Colors.primary + "12",
        alignItems: "center",
        justifyContent: "center",
    },
    textGroup: {
        flex: 1,
    },
    label: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
    },
    value: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    phoneText: {
        color: Colors.primary,
    },
});
