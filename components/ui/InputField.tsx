import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing, scale } from "@/constants/theme";
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
    const isMultiline = Boolean(props.multiline);

    return (
        <View style={[styles.container, containerStyle]}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[
                    styles.input,
                    isMultiline && styles.multilineInput,
                    error && styles.inputError,
                    inputStyle,
                ]}
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
        fontSize: FontSizes.body,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: Spacing.xs,
    },
    input: {
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Layout.borderRadius,
        paddingHorizontal: Spacing.md,
        paddingVertical: scale(14),
        fontSize: FontSizes.subtitle,
        color: Colors.text,
        fontFamily: Fonts.regular,
        minHeight: Layout.buttonHeight,
    },
    multilineInput: {
        minHeight: scale(110),
        textAlignVertical: "top",
        paddingTop: scale(14),
    },
    inputError: {
        borderColor: Colors.error,
    },
    errorText: {
        color: Colors.error,
        fontSize: FontSizes.caption,
        marginTop: Spacing.xs,
        fontFamily: Fonts.regular,
    },
});
