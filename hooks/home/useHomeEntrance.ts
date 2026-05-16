import { useEffect, useMemo } from "react";
import { Animated } from "react-native";

export function useHomeEntrance() {
    const fadeAnim = useMemo(() => new Animated.Value(0), []);
    const slideAnim = useMemo(() => new Animated.Value(30), []);
    const searchFade = useMemo(() => new Animated.Value(0), []);

    useEffect(() => {
        const animation = Animated.stagger(150, [
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ]),
            Animated.timing(searchFade, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
        ]);

        animation.start();

        return () => {
            animation.stop();
        };
    }, [fadeAnim, searchFade, slideAnim]);

    return {
        fadeAnim,
        slideAnim,
        searchFade,
    };
}
