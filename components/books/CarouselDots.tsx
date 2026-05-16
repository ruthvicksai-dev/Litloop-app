import React, { useEffect, useRef } from "react";
import {
    Animated,
    Pressable,
    StyleSheet,
    View,
    type StyleProp,
    type ViewStyle,
} from "react-native";

type CarouselDotsProps = {
    images: string[];
    activeIndex: number;
    onIndexChange: (index: number) => void;
    style?: StyleProp<ViewStyle>;
};

const INACTIVE_DOT_WIDTH = 8;
const ACTIVE_DOT_WIDTH = 18;
const DOT_HEIGHT = 8;
const ANIMATION_DURATION = 240;

export default function CarouselDots({
    images,
    activeIndex,
    onIndexChange,
    style,
}: CarouselDotsProps) {
    const dotAnimations = useRef(
        images.map((_, index) => new Animated.Value(index === activeIndex ? 1 : 0))
    ).current;

    useEffect(() => {
        Animated.parallel(
            dotAnimations.map((animation, index) =>
                Animated.timing(animation, {
                    toValue: index === activeIndex ? 1 : 0,
                    duration: ANIMATION_DURATION,
                    useNativeDriver: false,
                })
            )
        ).start();
    }, [activeIndex, images.length]);

    if (images.length <= 1) {
        return null;
    }

    return (
        <View pointerEvents="box-none" style={[styles.container, style]}>
            <View style={styles.track}>
                {images.map((_, index) => {
                    const animation = dotAnimations[index];
                    const width = animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [INACTIVE_DOT_WIDTH, ACTIVE_DOT_WIDTH],
                    });

                    const backgroundColor = animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["rgba(255, 255, 255, 0.45)", "#FFFFFF"],
                    });

                    return (
                        <Pressable
                            key={`carousel-dot-${index}`}
                            accessibilityRole="button"
                            accessibilityLabel={`Go to image ${index + 1}`}
                            onPress={() => onIndexChange(index)}
                            hitSlop={8}
                            style={styles.pressable}
                        >
                            <Animated.View
                                style={[
                                    styles.dot,
                                    {
                                        width,
                                        backgroundColor,
                                    },
                                ]}
                            />
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 24,
        zIndex: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    track: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: "rgba(17, 17, 17, 0.28)",
    },
    pressable: {
        alignItems: "center",
        justifyContent: "center",
    },
    dot: {
        height: DOT_HEIGHT,
        borderRadius: DOT_HEIGHT / 2,
    },
});
