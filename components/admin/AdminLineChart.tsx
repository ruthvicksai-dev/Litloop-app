import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Line, Path, Circle, Text as SvgText } from "react-native-svg";

type Point = {
    label: string;
    value: number;
};

type AdminLineChartProps = {
    title: string;
    points: Point[];
    emptyLabel: string;
    tone?: string;
};

const formatToDayMonth = (label: string) => {
    const fullDateMatch = label.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (fullDateMatch) {
        const [, , month, day] = fullDateMatch;
        return `${day} - ${month}`;
    }

    const monthDayMatch = label.match(/^(\d{2})-(\d{2})$/);
    if (monthDayMatch) {
        const [, month, day] = monthDayMatch;
        return `${day} - ${month}`;
    }

    return label;
};

export default function AdminLineChart({
    title,
    points,
    emptyLabel,
    tone = Colors.primary,
}: AdminLineChartProps) {
    const width = 320;
    const height = 220;
    const padding = 28;
    const chartHeight = 140;
    const maxValue = Math.max(...points.map((point) => point.value), 0);
    const maxXAxisLabels = 6;

    const coordinates = useMemo(() => {
        if (points.length === 0) {
            return [];
        }

        return points.map((point, index) => {
            const x =
                points.length === 1
                    ? width / 2
                    : padding + (index * (width - padding * 2)) / (points.length - 1);
            const y =
                padding +
                chartHeight -
                (maxValue > 0 ? (point.value / maxValue) * chartHeight : 0);

            return { ...point, x, y };
        });
    }, [chartHeight, maxValue, points]);

    const path = coordinates
        .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
        .join(" ");

    const visibleLabelIndices = useMemo(() => {
        if (points.length <= maxXAxisLabels) {
            return new Set(points.map((_, index) => index));
        }

        const lastIndex = points.length - 1;
        const step = Math.ceil(lastIndex / (maxXAxisLabels - 1));
        const indices = new Set<number>([0, lastIndex]);

        for (let index = step; index < lastIndex; index += step) {
            indices.add(index);
        }

        return indices;
    }, [points]);

    return (
        <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            {points.length === 0 ? (
                <Text style={styles.empty}>{emptyLabel}</Text>
            ) : (
                <Svg width={width} height={height}>
                    {[0, 1, 2, 3].map((step) => {
                        const y = padding + (chartHeight / 3) * step;
                        return (
                            <Line
                                key={step}
                                x1={padding}
                                y1={y}
                                x2={width - padding}
                                y2={y}
                                stroke={Colors.border}
                                strokeDasharray="4 4"
                            />
                        );
                    })}
                    <Path d={path} fill="none" stroke={tone} strokeWidth={3} />
                    {coordinates.map((point, index) => (
                        <React.Fragment key={point.label}>
                            <Circle cx={point.x} cy={point.y} r={4} fill={tone} />
                            {visibleLabelIndices.has(index) ? (
                                <SvgText
                                    x={point.x}
                                    y={height - 18}
                                    fontSize={10}
                                    fill={Colors.textSecondary}
                                    textAnchor="middle"
                                >
                                    {formatToDayMonth(point.label)}
                                </SvgText>
                            ) : null}
                        </React.Fragment>
                    ))}
                </Svg>
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
});
