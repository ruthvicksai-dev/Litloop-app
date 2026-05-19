import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing } from "@/constants/theme";

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
    return (
        <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
                <Ionicons name="library-outline" size={20} color={Colors.primary} />
                <Text style={styles.sectionLabel}>Inventory</Text>
                <View style={[
                    styles.inventoryBadge,
                    {
                        backgroundColor:
                            inventoryStatus === "out_of_stock" ? Colors.error + "18" :
                                inventoryStatus === "low_stock" ? Colors.warning + "18" :
                                    Colors.success + "18",
                    },
                ]}>
                    <Text style={[
                        styles.inventoryBadgeText,
                        {
                            color:
                                inventoryStatus === "out_of_stock" ? Colors.error :
                                    inventoryStatus === "low_stock" ? Colors.warning :
                                        Colors.success,
                        },
                    ]}>
                        {inventoryStatus === "out_of_stock" ? "Out of Stock" :
                            inventoryStatus === "low_stock" ? "Low Stock" :
                                "In Stock"}
                    </Text>
                </View>
            </View>

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

            {/* Quick Update Inventory */}
            <View style={styles.inventoryUpdateRow}>
                <TextInput
                    style={styles.inventoryInput}
                    placeholder="New total copies"
                    placeholderTextColor={Colors.textLight}
                    keyboardType="number-pad"
                    value={inventoryValue}
                    onChangeText={setInventoryValue}
                />
                <TouchableOpacity
                    style={[styles.inventoryUpdateBtn, updatingInventory && { opacity: 0.6 }]}
                    onPress={onSave}
                    disabled={updatingInventory || !inventoryValue.trim()}
                    activeOpacity={0.8}
                >
                    <Ionicons name="checkmark" size={18} color={Colors.white} />
                    <Text style={styles.inventoryUpdateBtnText}>
                        {updatingInventory ? "Saving..." : "Update"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    sectionCard: {
        paddingTop: Spacing.xs,
        paddingBottom: Spacing.md,
        paddingHorizontal: Spacing.xs,
        marginBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.05)",
    },
    sectionHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: Spacing.md,
    },
    sectionLabel: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.text,
        flex: 1,
    },
    inventoryGrid: {
        flexDirection: "row",
        backgroundColor: "rgba(255, 255, 255, 0.5)",
        borderRadius: Layout.cardRadius,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.sm,
        alignItems: "center",
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.03)",
    },
    inventoryItem: {
        flex: 1,
        alignItems: "center",
        gap: 4,
    },
    inventoryNumber: {
        fontSize: FontSizes.titleLarge,
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
        height: 30,
        backgroundColor: Colors.border,
        opacity: 0.6,
    },
    inventoryBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    inventoryBadgeText: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.bold,
    },
    inventoryUpdateRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs,
    },
    inventoryInput: {
        flex: 1,
        backgroundColor: Colors.background,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.text,
        borderWidth: 1.5,
        borderColor: Colors.primaryDark,
    },
    inventoryUpdateBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 10,
        gap: 6,
    },
    inventoryUpdateBtnText: {
        color: Colors.white,
        fontFamily: Fonts.medium,
        fontSize: FontSizes.small,
    },
});
