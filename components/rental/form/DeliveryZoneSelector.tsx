import { FontSizes, Fonts } from "@/constants/fonts";
import { Colors, Spacing, ZONES } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface DeliveryZoneSelectorProps {
    zone: string;
    setZone: (zone: string) => void;
    isVerifiedStudent?: boolean;
}

export default function DeliveryZoneSelector({ zone, setZone, isVerifiedStudent = false }: DeliveryZoneSelectorProps) {
    const availableZones = isVerifiedStudent ? ZONES : ZONES.filter(z => z === "Home");

    return (
        <>
            <Text style={styles.sectionTitle}>Delivery Zone</Text>
            <View style={styles.zoneGrid}>
                {availableZones.map((item) => (
                    <TouchableOpacity
                        key={item}
                        style={[
                            styles.zoneChip,
                            zone === item && styles.zoneChipActive,
                        ]}
                        onPress={() => setZone(item)}
                    >
                        <Text
                            style={[
                                styles.zoneChipText,
                                zone === item && styles.zoneChipTextActive,
                            ]}
                        >
                            {item}
                        </Text>
                    </TouchableOpacity>
                ))}
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
    zoneChipText: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.medium,
        color: Colors.text,
    },
    zoneChipTextActive: {
        color: Colors.white,
    },
});
