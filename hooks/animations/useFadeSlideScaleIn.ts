import { useEffect, useMemo } from "react";
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

    const fadeAnim = useMemo(() => new Animated.Value(0), []);
    const slideAnim = useMemo(() => new Animated.Value(slideFrom), [slideFrom]);
    const scaleAnim = useMemo(() => new Animated.Value(scaleFrom), [scaleFrom]);

    useEffect(() => {
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
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 4,
                tension: 60,
                useNativeDriver: true,
            }),
        ]);

        animation.start();

        return () => {
            animation.stop();
        };
    }, [duration, fadeAnim, scaleAnim, slideAnim]);

    return { fadeAnim, slideAnim, scaleAnim };
}
