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
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolateColor,
} from "react-native-reanimated";

const AnimatedView = Animated.View;

interface InputFieldProps extends TextInputProps {
    label: string;
    error?: string;
    helperText?: string;
    containerStyle?: ViewStyle;
    inputStyle?: StyleProp<TextStyle>;
    showPasswordToggle?: boolean;
}

export default function InputField({
    label,
    error,
    helperText,
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

    const focusAnim = useSharedValue(0);

    const handleFocus = (e: any) => {
        focusAnim.value = withTiming(1, { duration: 200 });
        props.onFocus?.(e);
    };

    const handleBlur = (e: any) => {
        focusAnim.value = withTiming(0, { duration: 200 });
        props.onBlur?.(e);
    };

    const animatedBorderStyle = useAnimatedStyle(() => {
        const borderColor = error
            ? Colors.error
            : interpolateColor(
                  focusAnim.value,
                  [0, 1],
                  [Colors.border, Colors.primary]
              );

        return {
            borderColor,
            borderWidth: focusAnim.value > 0.5 ? 1.5 : 1,
        };
    });

    return (
        <View style={[styles.container, containerStyle]}>
            <Text style={styles.label}>{label}</Text>
            <AnimatedView style={[styles.inputWrapper, animatedBorderStyle]}>
                <TextInput
                    style={[
                        styles.input,
                        isMultiline && styles.multilineInput,
                        showEye && styles.inputWithToggle,
                        inputStyle,
                    ]}
                    placeholderTextColor={Colors.textLight}
                    underlineColorAndroid="transparent"
                    selectionColor={Colors.primary}
                    secureTextEntry={isPassword && !passwordVisible}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
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
            </AnimatedView>
            {error ? (
                <Text style={styles.errorText}>{error}</Text>
            ) : helperText ? (
                <Text style={styles.helperText}>{helperText}</Text>
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
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: Spacing.xs + 2,
        letterSpacing: 0.1,
    },
    inputWrapper: {
        borderRadius: Layout.borderRadius,
        backgroundColor: Colors.surfaceCard,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: "hidden",
    },
    input: {
        paddingHorizontal: Spacing.md,
        paddingVertical: scale(13),
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
        paddingTop: scale(13),
    },
    eyeButton: {
        position: "absolute",
        right: Spacing.md,
        top: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: Spacing.xs,
    },
    helperText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
    },
    errorText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: Colors.error,
        marginTop: Spacing.xs,
    },
});
