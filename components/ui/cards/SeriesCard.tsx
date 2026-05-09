import { Fonts, FontSizes } from "@/constants/fonts";
import { Colors, Layout, Spacing, scale } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";

interface SeriesCardProps {
    _id: string;
    name: string;
    coverUrl: string | null;
    onPress: () => void;
}

export default function SeriesCard({
    name,
    coverUrl,
    onPress,
}: SeriesCardProps) {
    return (
        <Animated.View entering={FadeInRight.duration(400)}>
            <TouchableOpacity
                style={styles.shadowContainer}
                onPress={onPress}
                activeOpacity={0.9}
            >
                <View style={styles.container}>
                    <View style={styles.imageContainer}>
                        {coverUrl ? (
                            <Image source={{ uri: coverUrl }} style={styles.image} />
                        ) : (
                            <View style={[styles.image, styles.placeholder]}>
                                <Text style={styles.placeholderText} allowFontScaling={false}>
                                    {name[0]}
                                </Text>
                            </View>
                        )}

                        <LinearGradient
                            colors={["transparent", "rgba(0,0,0,0.8)"]}
                            style={styles.gradient}
                        />

                        <View style={styles.content}>
                            <Text style={styles.name} numberOfLines={2} allowFontScaling={false}>
                                {name}
                            </Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText} allowFontScaling={false}>
                                    SERIES
                                </Text>
                            </View>
                        </View>

                        <View style={styles.arrowContainer}>
                            <Ionicons name="chevron-forward" size={scale(16)} color={Colors.white} />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    shadowContainer: {
        width: scale(140),
        height: scale(210),
        marginRight: Spacing.md,
        borderRadius: Layout.cardRadius,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
    },
    container: {
        flex: 1,
        borderRadius: Layout.cardRadius,
        overflow: "hidden",
    },
    imageContainer: {
        flex: 1,
        position: "relative",
    },
    image: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    placeholder: {
        backgroundColor: Colors.primary + "20",
        alignItems: "center",
        justifyContent: "center",
    },
    placeholderText: {
        fontSize: FontSizes.display,
        fontFamily: Fonts.bold,
        color: Colors.primary,
    },
    gradient: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "60%",
    },
    content: {
        position: "absolute",
        bottom: scale(12),
        left: scale(12),
        right: scale(12),
    },
    arrowContainer: {
        position: "absolute",
        top: scale(10),
        right: scale(10),
        backgroundColor: "rgba(0,0,0,0.3)",
        padding: Spacing.xs,
        borderRadius: scale(8),
    },
    name: {
        fontSize: FontSizes.body,
        color: Colors.white,
        fontFamily: Fonts.bold,
        marginBottom: Spacing.xs,
    },
    badge: {
        backgroundColor: Colors.primary,
        paddingHorizontal: scale(6),
        paddingVertical: scale(2),
        borderRadius: scale(4),
        alignSelf: "flex-start",
    },
    badgeText: {
        fontSize: FontSizes.tiny,
        color: Colors.white,
        fontFamily: Fonts.bold,
        letterSpacing: 0.5,
    },
});
