import { scale, Spacing } from "@/constants/theme";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Skeleton } from "./Skeleton";

const CARD_WIDTH = scale(120);
const COVER_H = CARD_WIDTH * 1.5;

export const DiscoverBookCardSkeleton = () => {
    return (
        <View style={styles.card}>
            <Skeleton
                width={CARD_WIDTH}
                height={COVER_H}
                borderRadius={scale(14)}
            />
            <Skeleton
                width={CARD_WIDTH * 0.8}
                height={scale(14)}
                style={{ marginTop: scale(10) }}
            />
            <Skeleton
                width={CARD_WIDTH * 0.5}
                height={scale(12)}
                style={{ marginTop: Spacing.xs }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        marginRight: Spacing.md,
    },
});
