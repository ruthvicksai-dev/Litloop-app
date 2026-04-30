import { Colors, Layout, Spacing, scale } from "@/constants/theme";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Skeleton } from "./Skeleton";

export const BookCardSkeleton = () => {
    return (
        <View style={styles.card}>
            <View style={styles.row}>
                {/* Cover Skeleton */}
                <Skeleton
                    width={scale(74)}
                    height={scale(108)}
                    borderRadius={Layout.borderRadius}
                />

                {/* Info Skeleton */}
                <View style={styles.info}>
                    <View style={styles.headerRow}>
                        <Skeleton width="60%" height={20} />
                        <View style={styles.actionsRow}>
                            <Skeleton width={32} height={32} borderRadius={999} />
                            <Skeleton width={32} height={32} borderRadius={999} />
                        </View>
                    </View>

                    <Skeleton width="40%" height={14} style={{ marginTop: 4 }} />

                    {/* Price & Availability Row */}
                    <View style={styles.priceRow}>
                        <Skeleton width="30%" height={18} />
                        <Skeleton width="25%" height={22} borderRadius={12} />
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <Skeleton width={40} height={14} />
                        <Skeleton width={60} height={14} style={{ marginLeft: 8 }} />
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: Spacing.md,
        borderRadius: Layout.cardRadius,
        backgroundColor: Colors.white,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: "rgba(117,64,67,0.10)",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    info: {
        flex: 1,
        marginLeft: Spacing.md,
        gap: scale(6),
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    actionsRow: {
        flexDirection: "row",
        gap: scale(6),
    },
    priceRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        marginTop: 4,
    },
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
    },
});
