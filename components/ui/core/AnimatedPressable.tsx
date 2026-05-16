import { triggerHaptic } from "@/utils";
import React from "react";
import { GestureResponderEvent, Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from "react-native-reanimated";

const SPRING_CONFIG = { damping: 18, stiffness: 350, mass: 0.8 };

interface AnimatedPressableProps extends PressableProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    hapticType?: "light" | "medium" | "heavy" | "success" | "warning" | "error";
    scaleTo?: number;
}

export const AnimatedPressable = ({
    children,
    style,
    hapticType = "light",
    scaleTo = 0.96,
    onPressIn,
    onPressOut,
    onPress,
    ...props
}: AnimatedPressableProps) => {
    const scaleAnim = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scaleAnim.value }],
        opacity: scaleAnim.value < 1 ? 0.92 : 1,
    }));

    const handlePressIn = (event: GestureResponderEvent) => {
        triggerHaptic(hapticType);
        scaleAnim.value = withSpring(scaleTo, SPRING_CONFIG);
        onPressIn?.(event);
    };

    const handlePressOut = (event: GestureResponderEvent) => {
        scaleAnim.value = withSpring(1, SPRING_CONFIG);
        onPressOut?.(event);
    };

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}
            {...props}
        >
            <Animated.View style={[style, animatedStyle]}>
                {children}
            </Animated.View>
        </Pressable>
    );
};
