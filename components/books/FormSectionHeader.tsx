import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type FormSectionHeaderProps = {
    title: string;
    subtitle?: string;
};

export default function FormSectionHeader({ title, subtitle }: FormSectionHeaderProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: Spacing.md,
        marginBottom: Spacing.sm,
    },
    title: {
        fontSize: FontSizes.title,
        color: Colors.text,
        fontFamily: Fonts.bold,
    },
    subtitle: {
        marginTop: 2,
        fontSize: FontSizes.caption,
        color: Colors.textSecondary,
        fontFamily: Fonts.regular,
    },
});
