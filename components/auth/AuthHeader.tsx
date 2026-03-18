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
                <Animated.View style={styles.logoFrame}>
                    <Image
                        source={require("../../assets/images/icon.png")}
                        style={styles.logo}
                    />
                </Animated.View>
            </Animated.View>
            <Text style={styles.title} allowFontScaling={false}>
                <Text style={{ color: "orange" }} allowFontScaling={false}>
                    {words[0] || ""}
                </Text>
                <Text style={{ color: Colors.primaryDark }} allowFontScaling={false}>
                    {words[1] ? " " + words[1] : ""}
                </Text>
            </Text>
            <Text style={styles.subtitle} allowFontScaling={false}>
                {subtitle}
            </Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    header: {
        alignItems: "center",
    },
    logoFrame: {
        width: scale(142),
        height: scale(82),
        overflow: "hidden",
        marginBottom: Spacing.xs,
    },
    logo: {
        width: scale(165),
        height: scale(165),
        maxWidth: Layout.maxContentWidth * 0.42,
        resizeMode: "contain",
        transform: [{ translateX: scale(-11) }, { translateY: scale(-40) }],
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
