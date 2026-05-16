import { Fonts, FontSizes } from "@/constants/fonts";
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

interface TimePickerFieldProps {
    label: string;
    value: string;
    placeholder?: string;
    error?: string;
    containerStyle?: StyleProp<ViewStyle>;
    inputStyle?: StyleProp<ViewStyle>;
    onChange: (value: string) => void;
}

const MIN_HOUR = 6;
const MAX_HOUR = 22;

function parseTime(value: string) {
    const match = value.match(/^(\d{1,2}):(\d{2})\s(AM|PM)$/);
    if (!match) {
        return null;
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    const meridiem = match[3];

    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
        return null;
    }

    let hour24 = hours % 12;
    if (meridiem === "PM") {
        hour24 += 12;
    }

    return { hour24, minutes };
}

function formatTime(date: Date) {
    const hours24 = date.getHours();
    const minutes = `${date.getMinutes()}`.padStart(2, "0");
    const meridiem = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 || 12;
    return `${hours12}:${minutes} ${meridiem}`;
}

function clampTime(date: Date) {
    const next = new Date(date);
    const hours = next.getHours();

    if (hours < MIN_HOUR) {
        next.setHours(MIN_HOUR, 0, 0, 0);
        return next;
    }

    if (hours > MAX_HOUR || (hours === MAX_HOUR && next.getMinutes() > 0)) {
        next.setHours(MAX_HOUR, 0, 0, 0);
        return next;
    }

    return next;
}

function getPickerValue(value: string) {
    const date = new Date();
    const parsed = parseTime(value);

    if (!parsed) {
        date.setHours(MIN_HOUR, 0, 0, 0);
        return date;
    }

    date.setHours(parsed.hour24, parsed.minutes, 0, 0);
    return clampTime(date);
}

export default function TimePickerField({
    label,
    value,
    placeholder = "Select a time",
    error,
    containerStyle,
    inputStyle,
    onChange,
}: TimePickerFieldProps) {
    const [showPicker, setShowPicker] = useState(false);

    const pickerValue = useMemo(() => getPickerValue(value), [value]);

    const handleChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
        if (Platform.OS === "android") {
            setShowPicker(false);
        }

        if (event.type !== "set" || !selectedTime) {
            return;
        }

        onChange(formatTime(clampTime(selectedTime)));
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
                    {value || placeholder}
                </Text>
                <Ionicons
                    name="time-outline"
                    size={18}
                    color={Colors.textSecondary}
                />
            </Pressable>

            {showPicker ? (
                <View style={styles.pickerWrap}>
                    <DateTimePicker
                        value={pickerValue}
                        mode="time"
                        is24Hour={false}
                        display={Platform.OS === "ios" ? "spinner" : "default"}
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
        marginBottom: Spacing.xs,
    },
    input: {
        backgroundColor: Colors.surfaceCard,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: Spacing.md,
        paddingVertical: 14,
        fontSize: FontSizes.subtitle,
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
        fontSize: FontSizes.subtitle,
        color: Colors.text,
        fontFamily: Fonts.regular,
    },
    placeholderText: {
        fontSize: FontSizes.subtitle,
        color: Colors.textLight,
        fontFamily: Fonts.regular,
    },
    pickerWrap: {
        marginTop: Spacing.sm,
        backgroundColor: Colors.surfaceCard,
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
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
});
