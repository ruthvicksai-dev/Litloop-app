import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Animated, StyleSheet, Text } from "react-native";

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
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <Ionicons
                    name="book-outline"
                    color={Colors.primary}
                    style={styles.logo}
                />
            </Animated.View>
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
        fontSize: FontSizes.display,
        marginBottom: Spacing.sm,
    },
    title: {
        fontSize: FontSizes.display,
        color: Colors.primary,
        marginBottom: Spacing.xs,
        fontFamily: Fonts.bold,
        textAlign: "center",
    },
    subtitle: {
        fontSize: FontSizes.bodyLarge,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
        textAlign: "center",
        paddingHorizontal: Spacing.md,
    },
});
