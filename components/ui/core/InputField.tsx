import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing, scale } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
StyleSheet,
    StyleProp,
    Text,
    TextInput,
    TextInputProps,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";

interface InputFieldProps extends TextInputProps {
    label: string;
    error?: string;
    containerStyle?: ViewStyle;
    inputStyle?: StyleProp<TextStyle>;
    showPasswordToggle?: boolean;
}

export default function InputField({
    label,
    error,
    containerStyle,
    inputStyle,
    secureTextEntry,
    showPasswordToggle = true,
    ...props
}: InputFieldProps) {
    const isMultiline = Boolean(props.multiline);
    const isPassword = Boolean(secureTextEntry);
    const hasToggle = isPassword && showPasswordToggle;
    const hasValue = Boolean(props.value);
    const showEye = hasToggle && hasValue;
    const [passwordVisible, setPasswordVisible] = useState(false);

    return (
        <View style={[styles.container, containerStyle]}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputWrapper}>
                <TextInput
                    style={[
                        styles.input,
                        isMultiline && styles.multilineInput,
                        showEye && styles.inputWithToggle,
                        error && styles.inputError,
                        inputStyle,
                    ]}
                    placeholderTextColor={Colors.textLight}
                    underlineColorAndroid="transparent"
                    selectionColor={Colors.primary}
                    secureTextEntry={isPassword && !passwordVisible}
                    {...props}
                />
                {showEye && (
                    <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setPasswordVisible((prev) => !prev)}
                        activeOpacity={0.6}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityRole="button"
                        accessibilityLabel={passwordVisible ? "Hide password" : "Show password"}
                    >
                        <Ionicons
                            name={passwordVisible ? "eye-off-outline" : "eye-outline"}
                            size={22}
                            color={Colors.textSecondary}
                        />
                    </TouchableOpacity>
                )}
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
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: Spacing.xs,
    },
    inputWrapper: {
        position: "relative",
        justifyContent: "center",
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
    inputWithToggle: {
        paddingRight: scale(48),
    },
    multilineInput: {
        minHeight: scale(110),
        textAlignVertical: "top",
        paddingTop: scale(14),
    },
    inputError: {
        borderColor: Colors.error,
    },
    eyeButton: {
        position: "absolute",
        right: Spacing.md,
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: Spacing.xs,
    },
});

