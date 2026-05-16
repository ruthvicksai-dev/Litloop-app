import React, { useEffect } from "react";
import { DimensionValue, StyleProp, StyleSheet, ViewStyle } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

interface SkeletonProps {
    width?: DimensionValue;
    height?: DimensionValue;
    borderRadius?: number;
    style?: StyleProp<ViewStyle>;
}

export const Skeleton = ({
    width,
    height,
    borderRadius = 6,
    style,
}: SkeletonProps) => {
    const shimmerAnim = useSharedValue(0);

    useEffect(() => {
        shimmerAnim.value = withRepeat(
            withTiming(1, { duration: 1200, easing: Easing.linear }),
            -1,
            false,
        );
    }, [shimmerAnim]);

    const animatedStyle = useAnimatedStyle(() => {
        const translateX = interpolate(
            shimmerAnim.value,
            [0, 1],
            [-200, 200],
        );
        return {
            transform: [{ translateX }],
        };
    });

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    borderRadius,
                    overflow: "hidden",
                },
                style,
            ]}
        >
            <Animated.View style={[styles.shimmerWrap, animatedStyle]}>
                <LinearGradient
                    colors={[
                        "rgba(0,0,0,0)",
                        "rgba(255,255,255,0.25)",
                        "rgba(0,0,0,0)",
                    ]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.shimmerGradient}
                />
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: "rgba(0,0,0,0.06)",
    },
    shimmerWrap: {
        ...StyleSheet.absoluteFillObject,
        width: "200%",
    },
    shimmerGradient: {
        flex: 1,
    },
});
