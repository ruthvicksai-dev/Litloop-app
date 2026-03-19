import { Colors } from "@/constants/theme";
import React, { useEffect, useRef } from "react";
import { Animated, DimensionValue, StyleProp, StyleSheet, ViewStyle } from "react-native";

interface SkeletonProps {
    width?: DimensionValue;
    height?: DimensionValue;
    borderRadius?: number;
    style?: StyleProp<ViewStyle>;
}

export const Skeleton = ({
    width,
    height,
    borderRadius = 4,
    style,
}: SkeletonProps) => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    borderRadius,
                    opacity,
                },
                style,
            ]}
        />
    );
};

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: Colors.border,
    },
});
