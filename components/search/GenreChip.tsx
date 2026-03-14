import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type GenreChipProps = {
    label: string;
    selected?: boolean;
    onPress: () => void;
};

function GenreChip({ label, selected = false, onPress }: GenreChipProps) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.chip, selected && styles.chipSelected]}
            activeOpacity={0.85}
        >
            <View style={styles.content}>
                <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
                {selected ? (
                    <Ionicons name="close-circle" size={14} color={Colors.white} />
                ) : null}
            </View>
        </TouchableOpacity>
    );
}

export default memo(GenreChip);

const styles = StyleSheet.create({
    chip: {
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.white,
        borderRadius: 999,
        paddingHorizontal: Spacing.md,
        paddingVertical: 10,
        marginRight: Spacing.sm,
    },
    chipSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    label: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.medium,
        color: Colors.text,
    },
    labelSelected: {
        color: Colors.white,
    },
});
