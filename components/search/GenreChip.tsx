import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
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
};

function GenreChip({ label, selected = false, onPress }: GenreChipProps) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }]
        };
    });

    const handlePressIn = () => {
        scale.value = withSpring(0.95, { stiffness: 400, damping: 20 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, { stiffness: 400, damping: 20 });
    };

    return (
        <Animated.View style={animatedStyle}>
            <Pressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[styles.chip, selected && styles.chipSelected]}
            >
                <View style={styles.content}>
                    <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
                    {selected ? (
                        <Ionicons name="close-circle" size={14} color={Colors.white} />
                    ) : null}
                </View>
            </Pressable>
        </Animated.View>
    );
}

export default memo(GenreChip);

const styles = StyleSheet.create({
    chip: {
        borderWidth: 1,
        borderColor: Colors.borderSubtle,
        backgroundColor: Colors.surfaceCard,
        borderRadius: 999,
        paddingHorizontal: Spacing.md,
        paddingVertical: 10,
        marginRight: Spacing.sm,
    },
    chipSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    label: {
        fontSize: FontSizes.small,
        fontFamily: Fonts.medium,
        color: Colors.text,
    },
    labelSelected: {
        color: Colors.white,
    },
});
