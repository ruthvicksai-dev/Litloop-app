import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import { useFadeSlideIn } from "./useFadeSlideIn";

export function useHomeEntrance() {
    const { fadeAnim, slideAnim } = useFadeSlideIn({ autoStart: false });
    const searchFade = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.stagger(150, [
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
        ]).start();
    }, [fadeAnim, searchFade, slideAnim]);

    return {
        fadeAnim,
        slideAnim,
        searchFade,
    };
}
