import { Fonts } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import React from "react";
import {
StyleSheet,
    StyleProp,
    Text,
    TextInput,
    TextInputProps,
    TextStyle,
    View,
    ViewStyle,
} from "react-native";

interface InputFieldProps extends TextInputProps {
    label: string;
    error?: string;
    containerStyle?: ViewStyle;
    inputStyle?: StyleProp<TextStyle>;
}

export default function InputField({
    label,
    error,
    containerStyle,
    inputStyle,
    ...props
}: InputFieldProps) {
    return (
        <View style={[styles.container, containerStyle]}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[styles.input, error && styles.inputError, inputStyle]}
                placeholderTextColor={Colors.textLight}
                underlineColorAndroid="transparent"
                selectionColor={Colors.primary}
                {...props}
            />
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
      fontFamily: Fonts.regular,
    },
    inputError: {
        borderColor: Colors.error,
    },
    errorText: {
        color: Colors.error,
        fontSize: 12,
        marginTop: Spacing.xs,
      fontFamily: Fonts.regular,
    },
});
