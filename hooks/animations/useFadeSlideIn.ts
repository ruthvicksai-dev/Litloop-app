import { useEffect, useRef } from "react";
import { Animated } from "react-native";

type UseFadeSlideInOptions = {
    fadeFrom?: number;
    slideFrom?: number;
    toValue?: number;
    duration?: number;
    autoStart?: boolean;
};

export function useFadeSlideIn(options: UseFadeSlideInOptions = {}) {
    const {
        fadeFrom = 0,
        slideFrom = 30,
        toValue = 1,
        duration = 500,
        autoStart = true,
    } = options;

    const fadeAnim = useRef(new Animated.Value(fadeFrom)).current;
    const slideAnim = useRef(new Animated.Value(slideFrom)).current;

    useEffect(() => {
        if (!autoStart) {
            return;
        }

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue,
                duration,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration,
                useNativeDriver: true,
            }),
        ]).start();
    }, [autoStart, duration, fadeAnim, slideAnim, toValue]);

    return { fadeAnim, slideAnim };
}
