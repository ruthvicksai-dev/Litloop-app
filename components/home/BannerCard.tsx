import { Shadows } from "@/constants/designTokens";
import { Colors, Spacing, scale } from "@/constants/theme";
import { triggerHaptic } from "@/utils";
import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, useWindowDimensions, View, ViewStyle } from "react-native";

export interface BannerCardProps {
    bannerImageUrl?: string;
    onPress?: () => void;
    containerStyle?: ViewStyle;
    height?: number;
}

export default function BannerCard({
    bannerImageUrl,
    onPress,
    containerStyle,
    height,
}: BannerCardProps) {
    const { width: windowWidth } = useWindowDimensions();
    const cardWidth = Math.min(windowWidth - Spacing.md * 2, 600);
    const cardHeight = height ?? Math.round(cardWidth * (9 / 16));

    if (!bannerImageUrl) {
        return null;
    }

    return (
        <View style={[styles.outerContainer, containerStyle]}>
            <Pressable
                style={({ pressed }) => [
                    styles.cardContainer,
                    { width: cardWidth, height: cardHeight },
                    pressed && styles.pressed,
                ]}
                onPress={() => {
                    triggerHaptic("light");
                    onPress?.();
                }}
            >
                <Image
                    source={bannerImageUrl}
                    style={styles.bannerImage}
                    contentFit="cover"
                    cachePolicy="disk"
                    transition={300}
                />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        marginVertical: Spacing.md,
        alignItems: "center",
    },
    cardContainer: {
        borderRadius: scale(16),
        overflow: "hidden",
        backgroundColor: Colors.surfaceCard,
        ...Shadows.card,
    },
    pressed: {
        opacity: 0.95,
        transform: [{ scale: 0.99 }],
    },
    bannerImage: {
        width: "100%",
        height: "100%",
    },
});
