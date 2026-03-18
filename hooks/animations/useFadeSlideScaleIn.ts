import { useEffect, useRef } from "react";
import { Animated } from "react-native";

type UseFadeSlideScaleInOptions = {
    slideFrom?: number;
    scaleFrom?: number;
    duration?: number;
};

export function useFadeSlideScaleIn(
    options: UseFadeSlideScaleInOptions = {}
) {
    const {
        slideFrom = 30,
        scaleFrom = 0.6,
        duration = 500,
    } = options;

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(slideFrom)).current;
    const scaleAnim = useRef(new Animated.Value(scaleFrom)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                tension: 60,
                useNativeDriver: true,
            }),
        ]).start();
    }, [duration, fadeAnim, scaleAnim, slideAnim]);

    return { fadeAnim, slideAnim, scaleAnim };
}
