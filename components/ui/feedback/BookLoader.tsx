import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Spacing } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

type BookLoaderProps = {
    label?: string;
    containerStyle?: StyleProp<ViewStyle>;
};

export default function BookLoader({
    label = "Loading...",
    containerStyle,
}: BookLoaderProps) {
    const scale = useRef(new Animated.Value(0.92)).current;
    const opacity = useRef(new Animated.Value(0.65)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(scale, {
                        toValue: 1,
                        duration: 700,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(scale, {
                        toValue: 0.92,
                        duration: 700,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
                Animated.sequence([
                    Animated.timing(opacity, {
                        toValue: 1,
                        duration: 700,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: 0.65,
                        duration: 700,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]),
            ])
        );

        animation.start();
        return () => animation.stop();
    }, [opacity, scale]);

    return (
        <View style={[styles.container, containerStyle]}>
            <Animated.View
                style={[
                    styles.iconWrap,
                    {
                        opacity,
                        transform: [{ scale }],
                    },
                ]}
            >
                <Ionicons name="book-outline" size={40} color={Colors.primary} />
            </Animated.View>
            <Text style={styles.label}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
    },
    iconWrap: {
        width: 72,
        aspectRatio: 1,
        borderRadius: 36,
        backgroundColor: Colors.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: Spacing.sm,
    },
    label: {
        fontSize: FontSizes.body,
        color: Colors.textSecondary,
        fontFamily: Fonts.medium,
    },
});
