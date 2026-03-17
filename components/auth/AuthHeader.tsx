import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing, scale } from "@/constants/theme";
import React from "react";
import { Animated, Image, StyleSheet, Text } from "react-native";

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
    const words = (title || "").split(" ");
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
                <Image
                    source={require("../../assets/images/icon.png")}
                    style={styles.logo}
                />
            </Animated.View>
            <Text style={styles.title}>
                <Text style={{ color: "orange" }}>{words[0] || ""}</Text>
                <Text style={{ color: Colors.primaryDark }}>
                    {words[1] ? " " + words[1] : ""}
                </Text>
            </Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    header: {
        alignItems: "center",
    },
    logo: {
        width: scale(180),
        height: scale(95),
        maxWidth: Layout.maxContentWidth * 0.42,
        marginBottom: Spacing.sm,
        resizeMode: "contain",
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
        paddingHorizontal: Layout.screenPadding,
        maxWidth: Layout.maxContentWidth * 0.8,
    },
});
