import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing, scale } from "@/constants/theme";
import { Shadows, Opacity } from "@/constants/designTokens";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    ViewStyle,
} from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from "react-native-reanimated";

const SPRING_CONFIG = { damping: 15, stiffness: 400, mass: 0.8 };

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: "primary" | "secondary" | "outline" | "ghost";
    loading?: boolean;
    disabled?: boolean;
    containerStyle?: StyleProp<ViewStyle>;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    icon?: keyof typeof Ionicons.glyphMap;
    iconSize?: number;
}

export default function Button({
    title,
    onPress,
    variant = "primary",
    loading = false,
    disabled = false,
    containerStyle,
    style,
    textStyle,
    icon,
    iconSize = 18,
}: ButtonProps) {
    const scaleAnim = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scaleAnim.value }],
        opacity: scaleAnim.value < 1 ? 0.92 : 1,
    }));

    const handlePressIn = () => {
        scaleAnim.value = withSpring(0.96, SPRING_CONFIG);
    };

    const handlePressOut = () => {
        scaleAnim.value = withSpring(1, SPRING_CONFIG);
    };

    const buttonStyles = [
        styles.button,
        variant === "primary" && styles.primary,
        variant === "secondary" && styles.secondary,
        variant === "outline" && styles.outline,
        variant === "ghost" && styles.ghost,
        disabled && styles.disabled,
        style,
    ];

    const textStyles = [
        styles.text,
        variant === "primary" && styles.primaryText,
        variant === "secondary" && styles.secondaryText,
        variant === "outline" && styles.outlineText,
        variant === "ghost" && styles.ghostText,
        textStyle,
    ];

    const iconColor =
        variant === "primary"
            ? Colors.white
            : variant === "secondary"
              ? Colors.primaryDark
              : Colors.primary;

    return (
        <Animated.View style={[containerStyle, animatedStyle]}>
            <Pressable
                style={buttonStyles}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
            >
                {loading ? (
                    <ActivityIndicator
                        color={variant === "outline" || variant === "ghost" ? Colors.primary : Colors.white}
                        size="small"
                    />
                ) : (
                    <>
                        {icon && (
                            <Ionicons
                                name={icon}
                                size={iconSize}
                                color={iconColor}
                                style={styles.icon}
                            />
                        )}
                        <Text style={textStyles}>{title}</Text>
                    </>
                )}
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: scale(13),
        paddingHorizontal: Spacing.lg,
        borderRadius: Layout.borderRadius,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        minHeight: Layout.buttonHeight,
    },
    primary: {
        backgroundColor: Colors.primary,
        ...Shadows.primary,
    },
    secondary: {
        backgroundColor: Colors.primaryLight,
    },
    outline: {
        backgroundColor: "transparent",
        borderWidth: 1.5,
        borderColor: Colors.primary,
    },
    ghost: {
        backgroundColor: "transparent",
    },
    disabled: {
        opacity: Opacity.disabled,
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
    ghostText: {
        color: Colors.primary,
    },
    icon: {
        marginRight: Spacing.xs + 2,
    },
});
