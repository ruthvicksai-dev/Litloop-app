import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Item = {
    label: string;
    value: number;
};

type AdminVerticalBarChartProps = {
    title: string;
    items: Item[];
    emptyLabel: string;
    tone?: string;
};

export default function AdminVerticalBarChart({
    title,
    items,
    emptyLabel,
    tone = Colors.primary,
}: AdminVerticalBarChartProps) {
    const maxValue = Math.max(...items.map((item) => item.value), 0);

    return (
        <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            {items.length === 0 ? (
                <Text style={styles.empty}>{emptyLabel}</Text>
            ) : (
                <View style={styles.chartArea}>
                    {items.map((item) => (
                        <View key={item.label} style={styles.column}>
                            <Text style={styles.value}>{item.value}</Text>
                            <View style={styles.track}>
                                <View
                                    style={[
                                        styles.fill,
                                        {
                                            backgroundColor: tone,
                                            height: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={styles.label} numberOfLines={1}>
                                {item.label}
                            </Text>
                        </View>
                    ))}
                </View>
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
    chartArea: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        minHeight: 210,
        gap: 8,
    },
    column: {
        flex: 1,
        alignItems: "center",
        maxWidth: 52,
    },
    value: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 6,
    },
    track: {
        width: 24,
        height: 140,
        backgroundColor: Colors.background,
        borderRadius: 12,
        justifyContent: "flex-end",
        overflow: "hidden",
    },
    fill: {
        width: "100%",
        borderRadius: 12,
    },
    label: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        marginTop: 8,
    },
});
