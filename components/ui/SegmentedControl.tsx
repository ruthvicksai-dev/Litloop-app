import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

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
    fadeAnim?: Animated.Value;
};

export function SegmentedControl({
    options,
    activeValue,
    onChange,
    fadeAnim,
}: SegmentedControlProps) {
    return (
        <Animated.View style={[styles.tabsContainer, fadeAnim && { opacity: fadeAnim }]}>
            <View style={styles.tabsWrapper}>
                {options.map((option) => {
                    const isActive = activeValue === option.value;
                    return (
                        <Pressable
                            key={option.value}
                            style={[styles.tab, isActive && styles.activeTab]}
                            onPress={() => onChange(option.value)}
                        >
                            <Ionicons
                                name={isActive ? option.activeIcon : option.icon}
                                size={18}
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
        </Animated.View>
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
        borderRadius: 16,
        padding: 4,
    },
    tab: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        borderRadius: 12,
        gap: 6,
    },
    activeTab: {
        backgroundColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
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
