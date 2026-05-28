import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { Skeleton } from "@/components/ui/skeletons/Skeleton";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import PreviousAddressCard, { AddressTemplate } from "./PreviousAddressCard";

interface PreviousAddressesSectionProps {
    addresses: AddressTemplate[];
    isLoading: boolean;
    onSelect: (address: AddressTemplate) => Promise<void> | void;
    currentZone?: string;
    verifyingAddressId?: string | null;
}

export default function PreviousAddressesSection({
    addresses,
    isLoading,
    onSelect,
    currentZone,
    verifyingAddressId = null,
}: PreviousAddressesSectionProps) {
    // Filter by current zone if one is selected, otherwise show all
    const filtered = currentZone
        ? addresses.filter((a) => a.zone === currentZone)
        : addresses;

    // Loading: show skeletons
    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.headerText}>Recently Used</Text>
                </View>
                {[0, 1].map((i) => (
                    <View key={i} style={styles.skeletonCard}>
                        <Skeleton width={36} height={36} borderRadius={10} />
                        <View style={{ flex: 1, marginLeft: Spacing.sm, gap: 4 }}>
                            <Skeleton width={80} height={14} borderRadius={4} />
                            <Skeleton width={150} height={12} borderRadius={4} />
                        </View>
                        <Skeleton width={50} height={30} borderRadius={8} />
                    </View>
                ))}
            </View>
        );
    }

    // No addresses or all filtered out: hide entirely
    if (filtered.length === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.headerText}>Recently Used</Text>
            </View>
            {filtered.map((address, index) => (
                <PreviousAddressCard
                    key={address.id}
                    address={address}
                    onSelect={onSelect}
                    index={index}
                    isVerifying={verifyingAddressId === address.id}
                    disabled={verifyingAddressId !== null && verifyingAddressId !== address.id}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        marginBottom: Spacing.sm,
    },
    headerText: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 0.3,
    },
    skeletonCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.surfaceCard,
        borderRadius: 14,
        padding: Spacing.sm + 2,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border,
    },
});
