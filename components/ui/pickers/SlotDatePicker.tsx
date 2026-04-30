import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { formatDateString } from "@/utils/timeSlots";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface SlotDatePickerProps {
    label?: string;
    dates: Date[];
    selectedDate: string; // YYYY-MM-DD
    onSelect: (dateStr: string) => void;
    error?: string;
}

export default function SlotDatePicker({ label, dates, selectedDate, onSelect, error }: SlotDatePickerProps) {
    const todayStr = formatDateString(new Date());
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = formatDateString(tomorrow);

    return (
        <View style={styles.container}>
            {label ? <Text style={styles.label}>{label}</Text> : null}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {dates.map((d) => {
                    const dateStr = formatDateString(d);
                    const isSelected = dateStr === selectedDate;

                    let displayTitle = "";
                    let displaySubtitle = "";

                    if (dateStr === todayStr) {
                        displayTitle = "Today";
                    } else if (dateStr === tomorrowStr) {
                        displayTitle = "Tomorrow";
                    } else {
                        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                        displayTitle = days[d.getDay()];
                    }

                    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    displaySubtitle = `${d.getDate()} ${months[d.getMonth()]}`;

                    return (
                        <TouchableOpacity
                            key={dateStr}
                            style={[styles.chip, isSelected && styles.chipSelected]}
                            onPress={() => onSelect(dateStr)}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.title, isSelected && styles.textSelected]}>
                                {displayTitle}
                            </Text>
                            <Text style={[styles.subtitle, isSelected && styles.textSelected]}>
                                {displaySubtitle}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
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
    scrollContent: {
        gap: Spacing.sm,
        paddingVertical: 4,
    },
    chip: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.white,
        minWidth: 80,
    },
    chipSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    title: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
    },
    textSelected: {
        color: Colors.white,
    },
    errorText: {
        color: Colors.error,
        fontSize: FontSizes.small,
        fontFamily: Fonts.regular,
        marginTop: Spacing.xs,
    },
});
