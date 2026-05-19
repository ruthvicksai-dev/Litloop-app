import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type StackedBarItem = {
    label: string;
    active: number;
    pending: number;
    completed: number;
};

type AdminStackedBarChartProps = {
    title: string;
    items: StackedBarItem[];
    emptyLabel: string;
};

export default function AdminStackedBarChart({
    title,
    items,
    emptyLabel,
}: AdminStackedBarChartProps) {
    const maxTotal = Math.max(
        ...items.map((item) => item.active + item.pending + item.completed),
        0
    );

    return (
        <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            {items.length === 0 ? (
                <Text style={styles.empty}>{emptyLabel}</Text>
            ) : (
                <>
                    <View style={styles.legend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
                            <Text style={styles.legendText}>Active</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
                            <Text style={styles.legendText}>Pending</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
                            <Text style={styles.legendText}>Completed</Text>
                        </View>
                    </View>
                    <View style={styles.chartArea}>
                        {items.map((item) => {
                            const total = item.active + item.pending + item.completed;
                            const scale = maxTotal > 0 ? total / maxTotal : 0;
                            const chartHeight = 140;
                            const activeHeight = total > 0 ? (item.active / total) * chartHeight * scale : 0;
                            const pendingHeight = total > 0 ? (item.pending / total) * chartHeight * scale : 0;
                            const completedHeight = total > 0 ? (item.completed / total) * chartHeight * scale : 0;

                            return (
                                <View key={item.label} style={styles.barColumn}>
                                    <Text style={styles.barTotal}>{total}</Text>
                                    <View style={styles.barTrack}>
                                        <View style={[styles.barSegment, styles.barCompleted, { height: completedHeight }]} />
                                        <View style={[styles.barSegment, styles.barPending, { height: pendingHeight }]} />
                                        <View style={[styles.barSegment, styles.barActive, { height: activeHeight }]} />
                                    </View>
                                    <Text style={styles.barLabel}>{item.label}</Text>
                                </View>
                            );
                        })}
                    </View>
                </>
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
    legend: {
        flexDirection: "row",
        gap: 12,
        marginBottom: Spacing.sm,
        flexWrap: "wrap",
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
    },
    legendDot: {
        width: 10,
        aspectRatio: 1,
        borderRadius: 5,
        marginRight: 6,
    },
    legendText: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
    },
    chartArea: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        minHeight: 180,
        paddingTop: 8,
    },
    barColumn: {
        flex: 1,
        alignItems: "center",
        maxWidth: 64,
    },
    barTotal: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.bold,
        color: Colors.text,
        marginBottom: 6,
    },
    barTrack: {
        width: 26,
        height: 140,
        borderRadius: 12,
        backgroundColor: Colors.background,
        justifyContent: "flex-end",
        overflow: "hidden",
    },
    barSegment: {
        width: "100%",
    },
    barActive: {
        backgroundColor: Colors.primary,
    },
    barPending: {
        backgroundColor: Colors.warning,
    },
    barCompleted: {
        backgroundColor: Colors.success,
    },
    barLabel: {
        fontSize: FontSizes.caption,
        fontFamily: Fonts.medium,
        color: Colors.textSecondary,
        marginTop: 8,
    },
});
