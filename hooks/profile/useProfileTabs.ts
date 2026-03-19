import { useRef, useState } from "react";
import { Animated } from "react-native";

export type ProfileTab = "favorites" | "readLater";

/**
 * Custom hook to handle profile tab switching and animations.
 */
export function useProfileTabs(initialTab: ProfileTab = "favorites") {
    const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
    const slideAnimDist = useRef(new Animated.Value(0)).current;
    const listOpacity = useRef(new Animated.Value(1)).current;

    const handleTabChange = (tab: ProfileTab) => {
        if (tab === activeTab) return;

        // Slide out
        Animated.parallel([
            Animated.timing(listOpacity, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnimDist, {
                toValue: tab === "favorites" ? -20 : 20,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setActiveTab(tab);

            // Prepare for slide in from opposite side
            slideAnimDist.setValue(tab === "favorites" ? 20 : -20);

            // Slide in
            Animated.parallel([
                Animated.timing(listOpacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnimDist, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        });
    };

    return {
        activeTab,
        handleTabChange,
        slideAnimDist,
        listOpacity,
    };
}
