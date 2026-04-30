import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface SlotTimePickerProps {
    label?: string;
    slots: string[];
    selectedTime: string;
    onSelect: (timeStr: string) => void;
    error?: string;
    emptyMessage?: string;
}

export default function SlotTimePicker({ label, slots, selectedTime, onSelect, error, emptyMessage = "No slots available." }: SlotTimePickerProps) {
    return (
        <View style={styles.container}>
            {label ? <Text style={styles.label}>{label}</Text> : null}

            {slots.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>{emptyMessage}</Text>
                </View>
            ) : (
                <View style={styles.grid}>
                    {slots.map((slot) => {
                        const isSelected = slot === selectedTime;
                        return (
                            <TouchableOpacity
                                key={slot}
                                style={[styles.chip, isSelected && styles.chipSelected]}
                                onPress={() => onSelect(slot)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.text, isSelected && styles.textSelected]}>
                                    {slot}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.text,
        marginBottom: Spacing.sm,
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.sm,
    },
    chip: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: Spacing.md,
        backgroundColor: Colors.white,
        alignItems: "center",
        justifyContent: "center",
        flexGrow: 1,
        width: "48%",
    },
    chipSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    text: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.medium,
        color: Colors.text,
    },
    textSelected: {
        color: Colors.white,
    },
    emptyContainer: {
        padding: Spacing.md,
        backgroundColor: Colors.card,
        borderRadius: 8,
        alignItems: "center",
    },
    emptyText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
    },
    errorText: {
        color: Colors.error,
        fontSize: FontSizes.small,
        fontFamily: Fonts.regular,
        marginTop: Spacing.xs,
    },
});
