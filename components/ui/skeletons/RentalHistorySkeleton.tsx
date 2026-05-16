import { Colors, Spacing } from "@/constants/theme";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Skeleton } from "./Skeleton";

export const RentalHistorySkeleton = () => {
    return (
        <View style={styles.card}>
            <View style={styles.row}>
                <Skeleton width={68} height={98} borderRadius={12} />
                <View style={styles.body}>
                    <View style={styles.top}>
                        <Skeleton width="60%" height={18} />
                        <Skeleton width={60} height={20} borderRadius={999} />
                    </View>
                    <Skeleton width="40%" height={14} style={{ marginTop: 4 }} />
                    <View style={styles.meta}>
                        <Skeleton width={80} height={22} borderRadius={999} />
                        <Skeleton width={60} height={22} borderRadius={999} />
                    </View>
                    <View style={styles.footer}>
                        <Skeleton width={50} height={18} />
                        <Skeleton width={90} height={30} borderRadius={8} />
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surfaceCard,
        borderRadius: 18,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: "rgba(117,64,67,0.10)",
    },
    row: {
        flexDirection: "row",
        gap: Spacing.sm,
    },
    body: {
        flex: 1,
        gap: 6,
    },
    top: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    meta: {
        flexDirection: "row",
        gap: 8,
        marginTop: 4,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 8,
    },
});
