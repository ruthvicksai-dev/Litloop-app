import { Fonts } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
Platform,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from "react-native";

interface DatePickerFieldProps {
    label: string;
    value: string;
    placeholder?: string;
    error?: string;
    minimumDate?: Date;
    maximumDate?: Date;
    containerStyle?: StyleProp<ViewStyle>;
    inputStyle?: StyleProp<ViewStyle>;
    onChange: (value: string) => void;
}

function formatDate(value: Date) {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, "0");
    const day = `${value.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function parseDate(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return null;
    }

    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDisplayDate(value: string) {
    const parsed = parseDate(value);
    if (!parsed) {
        return value;
    }

    return parsed.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export default function DatePickerField({
    label,
    value,
    placeholder = "Select a date",
    error,
    minimumDate,
    maximumDate,
    containerStyle,
    inputStyle,
    onChange,
}: DatePickerFieldProps) {
    const [showPicker, setShowPicker] = useState(false);

    const pickerValue = useMemo(() => {
        return (
            parseDate(value) ??
            minimumDate ??
            maximumDate ??
            new Date()
        );
    }, [maximumDate, minimumDate, value]);

    const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === "android") {
            setShowPicker(false);
        }

        if (event.type !== "set" || !selectedDate) {
            return;
        }

        onChange(formatDate(selectedDate));
    };

    return (
        <View style={[styles.container, containerStyle]}>
            <Text style={styles.label}>{label}</Text>
            <Pressable
                style={[
                    styles.input,
                    error && styles.inputError,
                    inputStyle,
                ]}
                onPress={() => setShowPicker(true)}
            >
                <Text style={value ? styles.valueText : styles.placeholderText}>
                    {value ? formatDisplayDate(value) : placeholder}
                </Text>
                <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={Colors.textSecondary}
                />
            </Pressable>

            {showPicker ? (
                <View style={styles.pickerWrap}>
                    <DateTimePicker
                        value={pickerValue}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        minimumDate={minimumDate}
                        maximumDate={maximumDate}
                        onChange={handleChange}
                    />
                    {Platform.OS === "ios" ? (
                        <Pressable
                            style={styles.doneButton}
                            onPress={() => setShowPicker(false)}
                        >
                            <Text style={styles.doneText}>Done</Text>
                        </Pressable>
                    ) : null}
                </View>
            ) : null}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: Colors.text,
        marginBottom: Spacing.xs,
    },
    input: {
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: Spacing.md,
        paddingVertical: 14,
        fontSize: 16,
        color: Colors.text,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      fontFamily: Fonts.regular,
    },
    inputError: {
        borderColor: Colors.error,
    },
    valueText: {
        fontSize: 16,
        color: Colors.text,
      fontFamily: Fonts.regular,
    },
    placeholderText: {
        fontSize: 16,
        color: Colors.textLight,
      fontFamily: Fonts.regular,
    },
    pickerWrap: {
        marginTop: Spacing.sm,
        backgroundColor: Colors.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: "hidden",
    },
    doneButton: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
        alignItems: "flex-end",
    },
    doneText: {
        fontSize: 14,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
    errorText: {
        color: Colors.error,
        fontSize: 12,
        marginTop: Spacing.xs,
      fontFamily: Fonts.regular,
    },
});
