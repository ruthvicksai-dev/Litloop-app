import InputField from "@/components/ui/InputField";
import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type FeaturedSectionsFieldsProps = {
    isTop10: boolean;
    top10Position: string;
    isFamous: boolean;
    isTrending: boolean;
    isSeries: boolean;
    series: string;
    onToggleTop10: () => void;
    onToggleFamous: () => void;
    onToggleTrending: () => void;
    onToggleSeries: () => void;
    onChangeSeries: (value: string) => void;
    onChangeTop10Position: (value: string) => void;
};

function CheckRow({
    label,
    checked,
    onPress,
}: {
    label: string;
    checked: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity style={styles.checkRow} onPress={onPress} activeOpacity={0.85}>
            <View style={[styles.checkbox, checked && styles.checkboxActive]}>
                {checked ? <Ionicons name="checkmark" size={14} color={Colors.white} /> : null}
            </View>
            <Text style={styles.checkLabel}>{label}</Text>
        </TouchableOpacity>
    );
}

export default function FeaturedSectionsFields({
    isTop10,
    top10Position,
    isFamous,
    isTrending,
    isSeries,
    series,
    onToggleTop10,
    onToggleFamous,
    onToggleTrending,
    onToggleSeries,
    onChangeSeries,
    onChangeTop10Position,
}: FeaturedSectionsFieldsProps) {
    return (
        <View style={styles.container}>
            <CheckRow label="Top 10 Rentals" checked={isTop10} onPress={onToggleTop10} />

            {isTop10 ? (
                <View style={styles.positionWrap}>
                    <Text style={styles.positionLabel}>Top 10 Position</Text>
                    <View style={styles.positionGrid}>
                        {Array.from({ length: 10 }, (_, index) => {
                            const value = String(index + 1);
                            const selected = top10Position === value;
                            return (
                                <TouchableOpacity
                                    key={value}
                                    style={[styles.positionChip, selected && styles.positionChipActive]}
                                    onPress={() => onChangeTop10Position(value)}
                                    activeOpacity={0.85}
                                >
                                    <Text
                                        style={[
                                            styles.positionChipText,
                                            selected && styles.positionChipTextActive,
                                        ]}
                                    >
                                        {value}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            ) : null}

            <CheckRow label="Famous Books" checked={isFamous} onPress={onToggleFamous} />
            <CheckRow label="Trending Books" checked={isTrending} onPress={onToggleTrending} />
            <CheckRow label="Book Series" checked={isSeries} onPress={onToggleSeries} />

            {isSeries ? (
                <InputField
                    label="Series Name"
                    placeholder="e.g. Harry Potter"
                    value={series}
                    onChangeText={onChangeSeries}
                    containerStyle={styles.seriesField}
                />
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
    },
    checkRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: Spacing.sm,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.white,
        alignItems: "center",
        justifyContent: "center",
    },
    checkboxActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    checkLabel: {
        marginLeft: Spacing.sm,
        fontSize: FontSizes.bodyLarge,
        color: Colors.text,
        fontFamily: Fonts.medium,
    },
    positionWrap: {
        marginBottom: Spacing.md,
    },
    positionLabel: {
        marginBottom: Spacing.xs,
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
    },
    positionGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.xs,
    },
    positionChip: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.white,
    },
    positionChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    positionChipText: {
        fontSize: FontSizes.small,
        color: Colors.text,
        fontFamily: Fonts.medium,
    },
    positionChipTextActive: {
        color: Colors.white,
    },
    seriesField: {
        marginTop: Spacing.xs,
    },
});
