import { Colors } from "@/constants/theme";
import React from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { Fonts, FontSizes } from "@/constants/fonts";

type AuthFooterProps = {
    fadeAnim: Animated.Value;
    prefix: string;
    linkLabel: string;
    onPress: () => void;
};

export default function AuthFooter({
    fadeAnim,
    prefix,
    linkLabel,
    onPress,
}: AuthFooterProps) {
    return (
        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
            <Text style={styles.footerText}>{prefix} </Text>
            <Text style={styles.link} onPress={onPress}>
                {linkLabel}
            </Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    footerText: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
    },
    link: {
        fontSize: FontSizes.body,
        color: Colors.primary,
        fontFamily: Fonts.medium,
    },
});
