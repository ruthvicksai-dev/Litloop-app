import { FontSizes, Fonts } from "@/constants/fonts";
import { Colors, Spacing, ZONES } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface DeliveryZoneSelectorProps {
    zone: string;
    setZone: (zone: string) => void;
    isVerifiedStudent?: boolean;
}

export default function DeliveryZoneSelector({ zone, setZone, isVerifiedStudent = false }: DeliveryZoneSelectorProps) {
    return (
        <>
            <Text style={styles.sectionTitle}>Delivery Zone</Text>
            <View style={styles.zoneGrid}>
                {ZONES.map((item) => {
                    const isLocked = item === "College" && !isVerifiedStudent;
                    const isActive = zone === item;

                    return (
                        <TouchableOpacity
                            key={item}
                            style={[
                                styles.zoneChip,
                                isActive && styles.zoneChipActive,
                                isLocked && !isActive && styles.zoneChipLocked,
                            ]}
                            onPress={() => setZone(item)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.chipContent}>
                                <Text
                                    style={[
                                        styles.zoneChipText,
                                        isActive && styles.zoneChipTextActive,
                                    ]}
                                >
                                    {item}
                                </Text>
                                {isLocked ? (
                                    <Ionicons
                                        name="lock-closed"
                                        size={13}
                                        color={isActive ? Colors.white : Colors.textSecondary}
                                        style={styles.lockIcon}
                                    />
                                ) : null}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: Spacing.sm,
        marginTop: Spacing.sm,
    },
    zoneGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    zoneChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.surfaceCard,
    },
    zoneChipActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary,
    },
    zoneChipLocked: {
        borderColor: Colors.border,
        backgroundColor: Colors.surfaceCard,
    },
    chipContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    zoneChipText: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.medium,
        color: Colors.text,
    },
    zoneChipTextActive: {
        color: Colors.white,
    },
    lockIcon: {
        marginLeft: 2,
    },
});
