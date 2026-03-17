import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing, scale } from "@/constants/theme";
import React, { useRef } from "react";
import {
    ActivityIndicator,
    Animated,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle,
} from "react-native";

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: "primary" | "secondary" | "outline";
    loading?: boolean;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
}

export default function Button({
    title,
    onPress,
    variant = "primary",
    loading = false,
    disabled = false,
    style,
    textStyle,
}: ButtonProps) {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            friction: 3,
            useNativeDriver: true,
        }).start();
    };

    const buttonStyles = [
        styles.button,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "outline" && styles.outline,
        disabled && styles.disabled,
        style,
    ];

    const textStyles = [
        styles.text,
        variant === "primary" && styles.primaryText,
        variant === "secondary" && styles.secondaryText,
        variant === "outline" && styles.outlineText,
        textStyle,
    ];

    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity
                style={buttonStyles}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
                activeOpacity={0.8}
            >
                {loading ? (
                    <ActivityIndicator
                        color={variant === "outline" ? Colors.primary : Colors.white}
                        size="small"
                    />
                ) : (
                    <Text style={textStyles}>{title}</Text>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: scale(14),
        paddingHorizontal: Spacing.lg,
        borderRadius: Layout.borderRadius,
        alignItems: "center",
        justifyContent: "center",
        minHeight: Layout.buttonHeight,
    },
    primary: {
        backgroundColor: Colors.primary,
        borderWidth: 1,
        borderColor: Colors.primaryDark + "40",
    },
    secondary: {
        backgroundColor: Colors.primaryLight,
    },
    outline: {
        backgroundColor: "transparent",
        borderWidth: 1.5,
        borderColor: Colors.primary,
    },
    disabled: {
        opacity: 0.5,
    },
    text: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.medium,
    },
    primaryText: {
        color: Colors.white,
    },
    secondaryText: {
        color: Colors.primaryDark,
    },
    outlineText: {
        color: Colors.primary,
    },
});
