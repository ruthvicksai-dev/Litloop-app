import { Fonts, FontSizes } from "@/constants/fonts";
import { MAIN_GENRES } from "@/constants/mainGenres";
import { Colors, Spacing } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type GenreSelectorProps = {
    genres?: readonly string[];
    selectedGenres: string[];
    onToggleGenre: (genre: string) => void;
    label?: string;
    helperText?: string;
};

export default function GenreSelector({
    genres = MAIN_GENRES,
    selectedGenres,
    onToggleGenre,
    label = "Genres",
    helperText,
}: GenreSelectorProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
            <View style={styles.chips}>
                {genres.map((genre) => {
                    const isSelected = selectedGenres.includes(genre);

                    return (
                        <TouchableOpacity
                            key={genre}
                            onPress={() => onToggleGenre(genre)}
                            activeOpacity={0.85}
                            style={[
                                styles.chip,
                                isSelected && styles.chipSelected,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.chipText,
                                    isSelected && styles.chipTextSelected,
                                ]}
                            >
                                {genre}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: FontSizes.body,
        color: Colors.text,
        marginBottom: Spacing.sm,
        fontFamily: Fonts.medium,
    },
    helperText: {
        fontSize: FontSizes.caption,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
        fontFamily: Fonts.regular,
    },
    chips: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.sm,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    chipSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    chipText: {
        fontSize: FontSizes.small,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
    },
    chipTextSelected: {
        color: Colors.white,
    },
});
