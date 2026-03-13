import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

type DonutItem = {
    label: string;
    value: number;
    color: string;
};

type AdminDonutChartProps = {
    title: string;
    items: DonutItem[];
    centerLabel: string;
    centerValue: string;
    emptyLabel: string;
};

export default function AdminDonutChart({
    title,
    items,
    centerLabel,
    centerValue,
    emptyLabel,
}: AdminDonutChartProps) {
    const size = 170;
    const strokeWidth = 24;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const total = items.reduce((sum, item) => sum + item.value, 0);

    const segments = useMemo(() => {
        if (total === 0) {
            return [];
        }

        let offset = 0;

        return items.map((item) => {
            const segmentLength = (item.value / total) * circumference;
            const segment = {
                ...item,
                dashArray: `${segmentLength} ${circumference - segmentLength}`,
                dashOffset: -offset,
            };
            offset += segmentLength;
            return segment;
        });
    }, [circumference, items, total]);

    return (
        <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.chartWrap}>
                <Svg width={size} height={size}>
                    <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
                        <Circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke={Colors.background}
                            strokeWidth={strokeWidth}
                            fill="none"
                        />
                        {segments.map((segment) => (
                            <Circle
                                key={segment.label}
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke={segment.color}
                                strokeWidth={strokeWidth}
                                fill="none"
                                strokeDasharray={segment.dashArray}
                                strokeDashoffset={segment.dashOffset}
                                strokeLinecap="round"
                            />
                        ))}
                    </G>
                </Svg>
                <View style={styles.centerContent}>
                    <Text style={styles.centerLabel}>{centerLabel}</Text>
                    <Text style={styles.centerValue}>{total === 0 ? "0" : centerValue}</Text>
                </View>
            </View>
            {total === 0 ? (
                <Text style={styles.empty}>{emptyLabel}</Text>
            ) : (
                <View style={styles.legend}>
                    {items.map((item) => (
                        <View key={item.label} style={styles.legendRow}>
                            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                            <Text style={styles.legendLabel}>{item.label}</Text>
                            <Text style={styles.legendValue}>{item.value}</Text>
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
    chartWrap: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: Spacing.md,
    },
    centerContent: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
    },
    centerLabel: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
    },
    centerValue: {
        fontSize: FontSizes.title,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginTop: 2,
    },
    legend: {
        gap: 8,
    },
    legendRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    legendDot: {
        width: 10,
        aspectRatio: 1,
        borderRadius: 5,
        marginRight: 8,
    },
    legendLabel: {
        flex: 1,
        fontSize: FontSizes.small,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
    },
    legendValue: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.bold,
        color: Colors.text,
    },
});
