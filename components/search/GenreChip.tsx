import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing, scale } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from "react-native-reanimated";

type GenreChipProps = {
    label: string;
    selected?: boolean;
    onPress: () => void;
    compact?: boolean;
};

const GENRE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    Action: "flash-outline",
    Fiction: "book-outline",
    Crime: "finger-print-outline",
    Romance: "heart-outline",
    "Sci-Fi": "rocket-outline",
    Mystery: "search-outline",
    Fantasy: "sparkles-outline",
    Adventure: "compass-outline",
    Thriller: "skull-outline",
    Horror: "eye-outline",
    Biography: "person-outline",
    "Self Help": "bulb-outline",
    History: "time-outline",
    "Rom com": "heart-half-outline",
    Business: "briefcase-outline",
    Psychology: "analytics-outline",
    "View All": "grid-outline",
};

function GenreChip({ label, selected = false, onPress, compact = false }: GenreChipProps) {
    const scaleAnim = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scaleAnim.value }]
        };
    });

    const handlePressIn = () => {
        scaleAnim.value = withSpring(0.95, { stiffness: 400, damping: 20 });
    };

    const handlePressOut = () => {
        scaleAnim.value = withSpring(1, { stiffness: 400, damping: 20 });
    };

    const iconName = GENRE_ICONS[label];

    return (
        <Animated.View style={[compact && styles.wrapCompact, animatedStyle]}>
            <Pressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[
                    styles.chip,
                    compact && styles.chipCompact,
                    selected && styles.chipSelected
                ]}
            >
                <View style={[styles.content, compact && styles.contentCompact]}>
                    {iconName ? (
                        <Ionicons
                            name={iconName}
                            size={compact ? scale(14) : scale(15)}
                            color={selected ? Colors.white : Colors.primary}
                        />
                    ) : null}
                    <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                        style={[
                            styles.label,
                            compact && styles.labelCompact,
                            selected && styles.labelSelected
                        ]}
                    >
                        {label}
                    </Text>
                    {selected ? (
                        <Ionicons name="close-circle" size={compact ? scale(13) : scale(14)} color={Colors.white} />
                    ) : null}
                </View>
            </Pressable>
        </Animated.View>
    );
}

export default memo(GenreChip);

const styles = StyleSheet.create({
    wrapCompact: {
        width: "100%",
    },
    chip: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1.2,
        borderColor: Colors.border,
        backgroundColor: Colors.white,
        borderRadius: 999,
        paddingHorizontal: scale(14),
        paddingVertical: scale(9),
        marginRight: Spacing.sm,
    },
    chipCompact: {
        paddingHorizontal: scale(8),
        paddingVertical: scale(9),
        marginRight: 0,
        justifyContent: "center",
        width: "100%",
    },
    chipSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        gap: scale(6),
    },
    contentCompact: {
        gap: scale(4),
        justifyContent: "center",
    },
    label: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.medium,
        color: Colors.text,
    },
    labelCompact: {
        fontSize: FontSizes.caption,
    },
    labelSelected: {
        color: Colors.white,
        fontFamily: Fonts.bold,
    },
});
