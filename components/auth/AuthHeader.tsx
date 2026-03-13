import { Colors, Spacing } from "@/constants/theme";
import React from "react";
import { Animated, Dimensions, StyleSheet, Text } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type AuthHeaderProps = {
    title: string;
    subtitle: string;
    fadeAnim: Animated.Value;
    slideAnim: Animated.Value;
    scaleAnim: Animated.Value;
};

export default function AuthHeader({
    title,
    subtitle,
    fadeAnim,
    slideAnim,
    scaleAnim,
}: AuthHeaderProps) {
    return (
        <Animated.View
            style={[
                styles.header,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            <Animated.Text
                style={[
                    styles.logo,
                    { transform: [{ scale: scaleAnim }] },
                ]}
            >
                ðŸ“š
            </Animated.Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    header: {
        alignItems: "center",
    },
    logo: {
        fontSize: SCREEN_WIDTH * 0.14,
        marginBottom: Spacing.sm,
    },
    title: {
        fontSize: SCREEN_WIDTH * 0.08,
        fontWeight: "800",
        color: Colors.primary,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: SCREEN_WIDTH * 0.04,
        color: Colors.textSecondary,
    },
});
