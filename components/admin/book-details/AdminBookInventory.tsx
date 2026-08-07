import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors } from "@/constants/theme";

interface AdminBookInventoryProps {
    inventoryStatus: string;
    totalCopies: number;
    availableCopies: number;
    borrowedCopies: number;
    inventoryValue: string;
    setInventoryValue: (val: string) => void;
    updatingInventory: boolean;
    onSave: () => void;
}

export default function AdminBookInventory({
    inventoryStatus,
    totalCopies,
    availableCopies,
    borrowedCopies,
    inventoryValue,
    setInventoryValue,
    updatingInventory,
    onSave,
}: AdminBookInventoryProps) {
    const statusColor =
        inventoryStatus === "out_of_stock" ? Colors.error :
            inventoryStatus === "low_stock" ? Colors.warning :
                Colors.success;
    const statusText =
        inventoryStatus === "out_of_stock" ? "Out of Stock" :
            inventoryStatus === "low_stock" ? "Low Stock" :
                "In Stock";

    return (
        <View>
            {/* Header */}
            <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                    <Ionicons name="library" size={16} color={Colors.primary} />
                    <Text style={styles.headerTitle}>Inventory</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + "15" }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusText}</Text>
                </View>
            </View>

            {/* Inventory Grid */}
            <View style={styles.inventoryGrid}>
                <View style={styles.inventoryItem}>
                    <Text style={styles.inventoryNumber}>{totalCopies}</Text>
                    <Text style={styles.inventoryLabel}>Total</Text>
                </View>
                <View style={styles.inventoryDivider} />
                <View style={styles.inventoryItem}>
                    <Text style={[styles.inventoryNumber, { color: Colors.success }]}>{availableCopies}</Text>
                    <Text style={styles.inventoryLabel}>Available</Text>
                </View>
                <View style={styles.inventoryDivider} />
                <View style={styles.inventoryItem}>
                    <Text style={[styles.inventoryNumber, { color: Colors.warning }]}>{borrowedCopies}</Text>
                    <Text style={styles.inventoryLabel}>Borrowed</Text>
                </View>
            </View>

            {/* Quick Update */}
            <View style={styles.updateRow}>
                <TextInput
                    style={styles.input}
                    placeholder="New total copies"
                    placeholderTextColor={Colors.textLight}
                    keyboardType="number-pad"
                    value={inventoryValue}
                    onChangeText={setInventoryValue}
                />
                <TouchableOpacity
                    style={[styles.updateBtn, updatingInventory && { opacity: 0.6 }]}
                    onPress={onSave}
                    disabled={updatingInventory || !inventoryValue.trim()}
                    activeOpacity={0.8}
                >
                    <Ionicons name="checkmark" size={16} color={Colors.white} />
                    <Text style={styles.updateBtnText}>
                        {updatingInventory ? "Saving..." : "Update"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.04)",
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    headerTitle: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.text,
        letterSpacing: 0.2,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusBadgeText: {
        fontSize: FontSizes.tiny,
        fontFamily: Fonts.bold,
    },
    inventoryGrid: {
        flexDirection: "row",
        backgroundColor: "rgba(0,0,0,0.02)",
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 8,
        alignItems: "center",
        marginBottom: 12,
    },
    inventoryItem: {
        flex: 1,
        alignItems: "center",
        gap: 3,
    },
    inventoryNumber: {
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    inventoryLabel: {
        fontSize: FontSizes.tiny,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    inventoryDivider: {
        width: 1,
        height: 28,
        backgroundColor: "rgba(0,0,0,0.06)",
    },
    updateRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    input: {
        flex: 1,
        backgroundColor: Colors.background,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.text,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.06)",
    },
    updateBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.primary,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 5,
    },
    updateBtnText: {
        color: Colors.white,
        fontFamily: Fonts.bold,
        fontSize: FontSizes.caption,
    },
});
