import { useEffect, useMemo } from "react";
import { Animated } from "react-native";

type UseFadeSlideInOptions = {
    slideFrom?: number;
    duration?: number;
    delay?: number;
    autoStart?: boolean;
};

export function useFadeSlideIn(options: UseFadeSlideInOptions = {}) {
    const { 
        slideFrom = 20, 
        duration = 400, 
        delay = 0,
        autoStart = true,
    } = options;

    const fadeAnim = useMemo(() => new Animated.Value(0), []);
    const slideAnim = useMemo(() => new Animated.Value(slideFrom), [slideFrom]);

    useEffect(() => {
        if (!autoStart) {
            return;
        }

        const animation = Animated.parallel([
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
        ]);

        const timeoutId = setTimeout(() => {
            animation.start();
        }, delay);

        return () => {
            clearTimeout(timeoutId);
            animation.stop();
        };
    }, [autoStart, duration, fadeAnim, slideAnim, delay]);

    return { fadeAnim, slideAnim };
}
