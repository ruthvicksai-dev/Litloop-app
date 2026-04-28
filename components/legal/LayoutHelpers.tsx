import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export interface SectionProps {
    title: string;
    children: React.ReactNode;
}

export function Section({ title, children }: SectionProps) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle} allowFontScaling={false}>
                {title}
            </Text>
            {children}
        </View>
    );
}

export function Para({ children }: { children: React.ReactNode }) {
    return (
        <Text style={styles.para} allowFontScaling={false}>
            {children}
        </Text>
    );
}

export function Bullet({ text }: { text: string }) {
    return (
        <View style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.bulletText} allowFontScaling={false}>
                {text}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.primary,
        marginBottom: Spacing.sm,
    },
    para: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.text,
        lineHeight: 22,
        marginBottom: Spacing.sm,
    },
    bulletRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 6,
        paddingLeft: 4,
    },
    bulletDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.primary,
        marginTop: 8,
        marginRight: 10,
        flexShrink: 0,
    },
    bulletText: {
        flex: 1,
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.text,
        lineHeight: 22,
    },
});
