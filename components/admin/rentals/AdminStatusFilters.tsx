import { FontSizes, Fonts } from "@/constants/fonts";
import { Colors, RENTAL_STATUS_LABELS, Spacing } from "@/constants/theme";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";

type AdminStatusFiltersProps = {
    items: readonly string[];
    selected: string;
    onSelect: (item: string) => void;
};

export default function AdminStatusFilters({
    items,
    selected,
    onSelect,
}: AdminStatusFiltersProps) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            style={styles.filterScroll}
        >
            {items.map((item) => (
                <TouchableOpacity
                    key={item}
                    style={[
                        styles.filterChip,
                        selected === item && styles.filterChipActive,
                    ]}
                    onPress={() => onSelect(item)}
                >
                    <Text
                        style={[
                            styles.filterChipText,
                            selected === item && styles.filterChipTextActive,
                        ]}
                    >
                        {item === "all" ? "All" : RENTAL_STATUS_LABELS[item] || item}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    filterScroll: {
        flexGrow: 0,
        marginBottom: Spacing.sm,
    },
    filterRow: {
        paddingHorizontal: 20,
        paddingBottom: 6,
        gap: 6,
        alignItems: "center",
    },
    filterChip: {
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: Colors.white,
        alignSelf: "flex-start",
        height: 32,
        justifyContent: "center",
    },
    filterChipActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary,
    },
    filterChipText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
    },
    filterChipTextActive: {
        color: Colors.white,
    },
});
