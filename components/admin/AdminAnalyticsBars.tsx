import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Item = {
    label: string;
    value: number;
};

type AdminAnalyticsBarsProps = {
    title: string;
    items: Item[];
    emptyLabel: string;
    tone?: string;
};

export default function AdminAnalyticsBars({
    title,
    items,
    emptyLabel,
    tone = Colors.primary,
}: AdminAnalyticsBarsProps) {
    const maxValue = Math.max(...items.map((item) => item.value), 0);

    return (
        <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            {items.length === 0 ? (
                <Text style={styles.empty}>{emptyLabel}</Text>
            ) : (
                items.map((item) => (
                    <View key={item.label} style={styles.row}>
                        <View style={styles.rowHeader}>
                            <Text style={styles.label}>{item.label}</Text>
                            <Text style={styles.value}>{item.value}</Text>
                        </View>
                        <View style={styles.track}>
                            <View
                                style={[
                                    styles.fill,
                                    {
                                        backgroundColor: tone,
                                        width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                                    },
                                ]}
                            />
                        </View>
                    </View>
                ))
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 20,
        marginBottom: Spacing.md,
        padding: Spacing.md,
        borderRadius: 20,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    title: {
        fontSize: FontSizes.subtitle,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: Spacing.sm,
    },
    empty: {
        fontSize: FontSizes.body,
        fontFamily: Fonts.regular,
        color: Colors.textSecondary,
    },
    row: {
        marginBottom: Spacing.sm,
    },
    rowHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    label: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
    },
    value: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
    track: {
        height: 8,
        borderRadius: 999,
        backgroundColor: Colors.background,
        overflow: "hidden",
    },
    fill: {
        height: "100%",
        borderRadius: 999,
    },
});
