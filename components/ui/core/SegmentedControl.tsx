import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { triggerHaptic } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
} from "react-native-reanimated";

export type SegmentOption = {
    label: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
    activeIcon: keyof typeof Ionicons.glyphMap;
};

type SegmentedControlProps = {
    options: SegmentOption[];
    activeValue: string;
    onChange: (value: any) => void;
    fadeAnim?: any;
};

export function SegmentedControl({
    options,
    activeValue,
    onChange,
    }: SegmentedControlProps) {
    const activeIndex = options.findIndex((o) => o.value === activeValue);
    const indicatorX = useSharedValue(activeIndex >= 0 ? activeIndex : 0);

    React.useEffect(() => {
        const idx = options.findIndex((o) => o.value === activeValue);
        if (idx >= 0) {
            indicatorX.value = idx;
        }
    }, [activeValue, options, indicatorX]);

    const indicatorStyle = useAnimatedStyle(() => ({
        transform: [
            {
                translateX:
                    indicatorX.value *
                    ((1 / options.length) * 100) *
                    0.01 *
                    // We compute based on layout — use percentage approach
                    0, // Placeholder, we use left percentage below
            },
        ],
        left: `${(indicatorX.value / options.length) * 100}%`,
        width: `${100 / options.length}%`,
    }));

    return (
        <View style={styles.tabsContainer}>
            <View style={styles.tabsWrapper}>
                {/* Sliding indicator */}
                <Animated.View style={[styles.indicator, indicatorStyle]} />

                {options.map((option) => {
                    const isActive = activeValue === option.value;
                    return (
                        <Pressable
                            key={option.value}
                            style={styles.tab}
                            onPress={() => {
                                triggerHaptic("light");
                                onChange(option.value);
                            }}
                        >
                            <Ionicons
                                name={isActive ? option.activeIcon : option.icon}
                                size={17}
                                color={isActive ? Colors.white : Colors.textSecondary}
                            />
                            <Text
                                style={[styles.tabText, isActive && styles.activeTabText]}
                                allowFontScaling={false}
                            >
                                {option.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    tabsContainer: {
        backgroundColor: Colors.background,
        paddingHorizontal: 20,
        paddingBottom: Spacing.xs,
        zIndex: 10,
    },
    tabsWrapper: {
        flexDirection: "row",
        backgroundColor: "rgba(0,0,0,0.04)",
        borderRadius: 14,
        padding: 3,
        position: "relative",
    },
    indicator: {
        position: "absolute",
        top: 3,
        bottom: 3,
        borderRadius: 11,
        backgroundColor: Colors.primary,
    },
    tab: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        borderRadius: 11,
        gap: 6,
        zIndex: 1,
    },
    tabText: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
    },
    activeTabText: {
        color: Colors.white,
    },
});
