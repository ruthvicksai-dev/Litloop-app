import { triggerHaptic } from "@/utils/haptics";
import React, { useRef } from "react";
import { Animated, GestureResponderEvent, Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";

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
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = (event: GestureResponderEvent) => {
        triggerHaptic(hapticType);
        Animated.spring(scaleAnim, {
            toValue: scaleTo,
            useNativeDriver: true,
            speed: 20,
            bounciness: 10,
        }).start();
        onPressIn?.(event);
    };

    const handlePressOut = (event: GestureResponderEvent) => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 10,
        }).start();
        onPressOut?.(event);
    };

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}
            {...props}
        >
            <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
                {children}
            </Animated.View>
        </Pressable>
    );
};
